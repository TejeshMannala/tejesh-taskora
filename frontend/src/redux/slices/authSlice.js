import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../../services/authApi';

function extractMessage(error) {
  if (error.response?.data?.message) return error.response.data;
  if (error.response?.data) return error.response.data;
  if (error.code === 'ECONNABORTED') return { message: 'Request timed out. Server may be down or unreachable.' };
  if (error.code === 'ERR_NETWORK') return { message: 'Network error. Unable to reach the server.' };
  return { message: error.message || 'An unexpected error occurred.' };
}

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const data = await authApi.login(credentials);
    return data;
  } catch (error) {
    return rejectWithValue(extractMessage(error));
  }
});

export const signup = createAsyncThunk('auth/signup', async (userData, { rejectWithValue }) => {
  try {
    const data = await authApi.signup(userData);
    return data;
  } catch (error) {
    return rejectWithValue(extractMessage(error));
  }
});

export const fetchProfile = createAsyncThunk('auth/fetchProfile', async (_, { rejectWithValue }) => {
  try {
    const data = await authApi.getProfile();
    return data;
  } catch (error) {
    const errData = extractMessage(error);
    return rejectWithValue(typeof errData === 'string' ? { message: errData } : errData);
  }
});

export const acceptAgreement = createAsyncThunk('auth/acceptAgreement', async (_, { rejectWithValue }) => {
  try {
    const data = await authApi.acceptAgreement();
    return data;
  } catch (error) {
    return rejectWithValue(extractMessage(error));
  }
});

export const googleLogin = createAsyncThunk('auth/googleLogin', async (credential, { rejectWithValue }) => {
  try {
    const data = await authApi.googleLogin(credential);
    return data;
  } catch (error) {
    return rejectWithValue(extractMessage(error));
  }
});

const initialState = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Login failed';
      })
      .addCase(signup.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(signup.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.token) {
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.token = action.payload.token;
          localStorage.setItem('token', action.payload.token);
          localStorage.setItem('user', JSON.stringify(action.payload.user));
        }
      })
      .addCase(signup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Signup failed';
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.user = action.payload.user || action.payload;
        localStorage.setItem('user', JSON.stringify(state.user));
      })
      .addCase(acceptAgreement.fulfilled, (state, action) => {
        state.user = action.payload.user;
        localStorage.setItem('user', JSON.stringify(state.user));
      })
      .addCase(googleLogin.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Google login failed';
      });
  },
});

export const { logout, clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;
