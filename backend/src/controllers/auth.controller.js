import crypto from 'crypto';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/user.model.js';
import Group from '../models/group.model.js';
import generateToken from '../utils/generateToken.js';
import { generateSubjectsForUser } from './user.controller.js';

dotenv.config();

const loginAttempts = new Map();

const getLoginKey = (ip) => {
  const today = new Date().toISOString().slice(0, 10);
  return `${ip}:${today}`;
};

const checkLoginLimit = (ip) => {
  const record = loginAttempts.get(getLoginKey(ip));
  return !record || record.count < 5;
};

const incrementLoginAttempt = (ip) => {
  const key = getLoginKey(ip);
  const record = loginAttempts.get(key);
  if (!record) {
    loginAttempts.set(key, { count: 1, createdAt: Date.now() });
    return;
  }
  record.count += 1;
};

setInterval(() => {
  const today = new Date().toISOString().slice(0, 10);
  for (const [key] of loginAttempts) {
    if (!key.includes(today)) loginAttempts.delete(key);
  }
}, 30 * 60 * 1000);

const googleClientId = (process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID)?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
let googleClient = null;

if (!googleClientId || googleClientId === 'your_google_client_id_here' || googleClientId.length < 20 || !googleClientId.includes('.apps.googleusercontent.com')) {
  console.error('GOOGLE_CLIENT_ID is missing, too short, or invalid in backend/.env. Google SSO will be unavailable.');
} else {
  console.log('Google OAuth configured with Client ID:', `${googleClientId.substring(0, 15)}...`);
  if (googleClientSecret && googleClientSecret.length > 0 && !googleClientSecret.includes('YOUR_')) {
    try {
      googleClient = new OAuth2Client(googleClientId, googleClientSecret);
      console.log('OAuth2Client initialized for ID token verification.');
    } catch {
      console.warn('Failed to initialize OAuth2Client with secret; access-token fallback will be used.');
    }
  } else {
    console.log('GOOGLE_CLIENT_SECRET not set or is placeholder; using access-token-only flow (userinfo API).');
  }
}

const isMaybeJwt = (value) => typeof value === 'string' && value.split('.').length === 3;

const getGoogleProfileFromAccessToken = async (accessToken) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  let response;
  try {
    response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
  } catch (fetchError) {
    clearTimeout(timeout);
    if (fetchError.name === 'AbortError') {
      throw new Error('Google API timed out. Check your internet connection or Google Cloud quota.');
    }
    throw new Error('Network error contacting Google. Please try again.');
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 401) {
    throw new Error('Google access token is invalid or expired. Please sign in again.');
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Google userinfo API returned ${response.status}: ${body || 'Unknown error'}`);
  }

  const profile = await response.json();
  if (!profile.sub) {
    throw new Error('Google did not return a user ID. Ensure your Google account is properly set up.');
  }
  if (!profile.email) {
    throw new Error('Google did not return an email address. Ensure the email scope is granted to your Google account.');
  }

  return {
    googleId: profile.sub,
    email: profile.email,
    name: profile.name,
    picture: profile.picture,
  };
};

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Google JWT verification timed out')), ms)
    ),
  ]);

const getGoogleProfile = async (credential) => {
  // Strategy: try JWT (ID token) first, fall back to access token.
  // Frontend @react-oauth/google:
  //   <GoogleLogin> component         -> returns ID token JWT as credential
  //   useGoogleLogin() hook (implicit) -> returns access_token
  // We handle both transparently.

  // 1. Try as JWT / ID token
  if (googleClient && isMaybeJwt(credential)) {
    try {
      const ticket = await withTimeout(
        googleClient.verifyIdToken({
          idToken: credential,
          audience: googleClientId,
        }),
        10000
      );
      const payload = ticket.getPayload();
      if (payload) {
        return {
          googleId: payload.sub,
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
        };
      }
    } catch {
      // JWT verification failed or timed out – fall through to access token path
    }
  }

  // 2. Fallback: treat as access token
  return getGoogleProfileFromAccessToken(credential);
};

const userResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  group: user.group,
  educationType: user.educationType,
  college: user.college,
  university: user.university,
  profilePicture: user.profilePicture,
  hasAcceptedAgreement: user.hasAcceptedAgreement,
  hasAcceptedTerms: user.hasAcceptedTerms,
  isFirstLogin: user.isFirstLogin,
  avatar: user.avatar,
});

const formatAuthResponse = async (user, message) => {
  const populatedUser = await User.findById(user._id).populate('group', 'name');
  const userData = populatedUser || user;
  return {
    success: true,
    message,
    token: generateToken(user._id),
    user: userResponse(userData),
  };
};

const duplicateEmailResponse = (res) => res.status(409).json({
  success: false,
  message: 'This email is already registered. Please log in instead.',
});

export const checkEmail = async (req, res) => {
  try {
    const email = req.query.email?.trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const userExists = await User.exists({ email });
    return res.json({ success: true, exists: !!userExists });
  } catch (error) {
    console.error('Email check failed:', error);
    return res.status(500).json({ success: false, message: 'Server error checking email' });
  }
};

const resolveGroup = async (groupId, educationType) => {
  if (!groupId || groupId === '') return undefined;
  if (mongoose.Types.ObjectId.isValid(groupId)) return groupId;
  const group = await Group.findOne({ name: groupId, educationType });
  if (group) return group._id;
  const fallbackMatch = typeof groupId === 'string' && groupId.startsWith('fb:')
    ? groupId.split(':').pop()
    : null;
  if (fallbackMatch) {
    const found = await Group.findOne({ name: fallbackMatch, educationType });
    if (found) return found._id;
  }
  return undefined;
};

export const signupUser = async (req, res) => {
  try {
    let { name, email, password, college, university, group, educationType } = req.body;
    email = email?.trim().toLowerCase();

    group = await resolveGroup(group, educationType);

    if (await User.exists({ email })) {
      return duplicateEmailResponse(res);
    }

    let user;
    try {
      user = await User.create({
        name,
        email,
        password,
        college,
        university,
        group,
        educationType: educationType || undefined,
        isFirstLogin: true,
        hasAcceptedTerms: false,
        hasAcceptedAgreement: false,
      });
      if (user.group) {
        generateSubjectsForUser(user._id, user.group).catch(err =>
          console.error('[Signup] Subject generation failed (non-fatal):', err.message)
        );
      }
    } catch (createError) {
      if (createError.code === 11000) return duplicateEmailResponse(res);
      throw createError;
    }

    return res.status(201).json(await formatAuthResponse(user, 'Registration successful'));
  } catch (error) {
    console.error('Signup failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Signup failed. Please try again.',
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    if (!checkLoginLimit(ip)) {
      return res.status(429).json({
        success: false,
        message: 'Too many login attempts (5 per day). Please try again tomorrow.',
      });
    }

    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      incrementLoginAttempt(ip);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    return res.json(await formatAuthResponse(user, 'Login successful'));
  } catch (error) {
    console.error('Login failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Login failed. Please try again.',
    });
  }
};

export const googleLogin = async (req, res) => {
  try {
    console.log('[GoogleAuth] Login attempt received');
    const ip = req.ip || req.connection.remoteAddress;
    if (!checkLoginLimit(ip)) {
      console.warn(`[GoogleAuth] Rate limit exceeded for IP: ${ip}`);
      return res.status(429).json({
        success: false,
        message: 'Too many login attempts (5 per day). Please try again tomorrow.',
      });
    }

    const { credential } = req.body;
    if (!credential) {
      console.warn('[GoogleAuth] No credential in request body');
      return res.status(400).json({ success: false, message: 'Google credential is required' });
    }

    console.log('[GoogleAuth] Verifying Google credential...');
    let profile;
    try {
      profile = await getGoogleProfile(credential);
    } catch (profileError) {
      console.error('[GoogleAuth] Profile fetch failed:', profileError.message);
      console.error('[GoogleAuth] Go to https://console.cloud.google.com/apis/credentials');
      console.error('[GoogleAuth] Select your OAuth 2.0 Client ID and ADD these to Authorized JavaScript Origins:');
      console.error('[GoogleAuth]   - http://localhost:5173');
      console.error('[GoogleAuth]   - https://tejesh-taskora-frontend.onrender.com');
      console.error('[GoogleAuth] If you still get errors, also add to Authorized Redirect URIs:');
      console.error('[GoogleAuth]   - http://localhost:5173');
      console.error('[GoogleAuth]   - https://tejesh-taskora-frontend.onrender.com');
      throw profileError;
    }

    const { googleId, email, name, picture } = profile;
    console.log(`[GoogleAuth] Profile obtained — email: ${email}, googleId: ${googleId ? googleId.substring(0, 8) + '...' : 'N/A'}`);
    if (!googleId || !email) {
      return res.status(400).json({
        success: false,
        message: 'Google did not return an email address. Choose a Google account that has an email address.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = await User.findOne({ $or: [{ googleId }, { email: normalizedEmail }] });

    if (user) {
      if (user.email.toLowerCase() !== normalizedEmail) {
        return res.status(403).json({
          success: false,
          message: 'This Google account is linked to a different email. Please choose the Google account that matches your Taskora account.',
        });
      }

      user.googleId = googleId;
      if (picture && !user.avatar) user.avatar = picture;
      await user.save();
      if (user.group) await generateSubjectsForUser(user._id, user.group);
    } else {
      try {
        user = await User.create({
          name: name || normalizedEmail.split('@')[0],
          email: normalizedEmail,
          password: crypto.randomBytes(24).toString('hex'),
          googleId,
          avatar: picture || '',
          isFirstLogin: true,
          hasAcceptedTerms: false,
          hasAcceptedAgreement: false,
        });
        if (user.group) await generateSubjectsForUser(user._id, user.group);
      } catch (createError) {
        if (createError.code === 11000) {
          return res.status(409).json({
            success: false,
            message: 'This email is already registered. Please log in with that email or continue with the matching Google account.',
          });
        }
        throw createError;
      }
    }

    console.log(`[GoogleAuth] Login successful for: ${email}`);
    return res.json(await formatAuthResponse(user, 'Google login successful'));
  } catch (error) {
    const rawMessage = error.message || '';
    console.error('[GoogleAuth] Failed:', rawMessage);
    console.error('[GoogleAuth] Full error:', error.stack || error);

    let message;
    if (rawMessage.includes('invalid or expired')) {
      message = 'Your Google session expired. Please sign in again.';
    } else if (rawMessage.includes('401') || rawMessage.includes('userinfo')) {
      message = 'Google rejected the access token. Make sure your Google Cloud Console has the frontend URL in Authorized JavaScript Origins.';
    } else if (rawMessage.includes('origin_mismatch') || rawMessage.includes('redirect_uri_mismatch')) {
      message = 'Google origin mismatch. Add these URLs to Google Cloud Console > Credentials > Authorized JavaScript Origins:\n' +
        '  - http://localhost:5173\n' +
        '  - https://tejesh-taskora-frontend.onrender.com\n' +
        'And to Authorized Redirect URIs:\n' +
        '  - http://localhost:5173\n' +
        '  - https://tejesh-taskora-frontend.onrender.com';
    } else if (rawMessage.includes('user ID') || rawMessage.includes('email')) {
      message = rawMessage;
    } else if (rawMessage.includes('timed out')) {
      message = 'Google authentication timed out. Check your internet connection or Google Cloud quota.';
    } else if (rawMessage.includes('Network error')) {
      message = 'Network error contacting Google. Check your internet connection.';
    } else {
      message = 'Google authentication failed. Ensure:\n' +
        '  1. frontend/.env VITE_GOOGLE_CLIENT_ID matches backend/.env GOOGLE_CLIENT_ID\n' +
        '  2. Google Cloud Console has these Authorized JavaScript Origins:\n' +
        '     - http://localhost:5173\n' +
        '     - https://tejesh-taskora-frontend.onrender.com\n' +
        '  3. backend/.env GOOGLE_CLIENT_SECRET is NOT a placeholder';
    }

    return res.status(500).json({
      success: false,
      message,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

export const acceptAgreement = async (req, res) => {
  try {
    let user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.hasAcceptedAgreement = true;
    user.acceptedAgreementAt = new Date();
    user.hasAcceptedTerms = true;
    user.isFirstLogin = false;
    await user.save();

    user = await User.findById(user._id).populate('group', 'name');

    return res.json({
      success: true,
      message: 'Agreement accepted',
      user: userResponse(user),
    });
  } catch (error) {
    console.error('Accept agreement failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to accept agreement.',
    });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('group', 'name');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      user: userResponse(user),
    });
  } catch (error) {
    console.error('Profile fetch failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to load profile.',
    });
  }
};
