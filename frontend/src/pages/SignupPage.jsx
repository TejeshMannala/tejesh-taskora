import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FaCheckCircle, FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa';
import confetti from 'canvas-confetti';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import GoogleAuthButton from '../components/auth/GoogleAuthButton';
import { signup, googleLogin } from '../redux/slices/authSlice';
import { signupSchema } from '../utils/validations';
import PasswordStrengthMeter from '../components/auth/PasswordStrengthMeter';
import ErrorModal from '../components/ui/ErrorModal';
import { academicApi } from '../services/academicApi';
import api from '../services/api';
import Select from '../components/ui/Select';
import { FALLBACK_EDUCATION_TYPES } from '../constants/academic';

const SignupPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.auth);
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [educationTypes, setEducationTypes] = useState(FALLBACK_EDUCATION_TYPES);
  const [emailStatus, setEmailStatus] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorModal, setErrorModal] = useState({ isOpen: false, type: 'default', message: '' });
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      college: '',
      educationType: '',
      group: '',
    },
  });

  const email = watch('email');
  const selectedEducationType = watch('educationType');
  const password = watch('password');

  useEffect(() => {
    academicApi.getEducationTypes()
      .then((data) => {
        const types = data.educationTypes || FALLBACK_EDUCATION_TYPES;
        setEducationTypes(types);
      })
      .catch(() => {
        setEducationTypes(FALLBACK_EDUCATION_TYPES);
      });
  }, []);

  useEffect(() => {
    setValue('group', '');
    setGroups([]);
    if (!selectedEducationType) return;

    const loadGroups = async () => {
      setGroupsLoading(true);
      try {
        const data = await academicApi.getGroups(selectedEducationType);
        setGroups(data.groups || []);
      } catch {
        toast.error('Failed to load groups.');
      } finally {
        setGroupsLoading(false);
      }
    };
    loadGroups();
  }, [selectedEducationType, setValue]);

  useEffect(() => {
    const checkEmail = async () => {
      if (!email || errors.email) {
        setEmailStatus(null);
        return;
      }
      setEmailStatus('checking');
      try {
        const response = await api.get(`/api/v1/auth/check-email?email=${encodeURIComponent(email)}`);
        if (response.data.exists) {
          setEmailStatus('exists');
          setError('email', { type: 'manual', message: 'Email already registered' });
        } else {
          setEmailStatus('available');
          clearErrors('email');
        }
      } catch {
        setEmailStatus(null);
      }
    };
    const timer = setTimeout(checkEmail, 450);
    return () => clearTimeout(timer);
  }, [email, errors.email, setError, clearErrors]);

  const handleSignup = async (data) => {
    if (emailStatus === 'exists') return;

    try {
      const response = await dispatch(signup({
        name: data.fullName,
        email: data.email,
        password: data.password,
        college: data.college,
        group: data.group,
        educationType: data.educationType,
      })).unwrap();

      if (response.success) {
        setIsSuccess(true);
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.65 } });
        toast.success('Account created successfully.');
        setTimeout(() => navigate('/profile'), 1500);
      }
    } catch (error) {
      const message = error?.message || 'Signup failed. Please try again.';
      if (message.includes('registered') || message.includes('exists')) {
        setError('email', { type: 'manual', message });
        setErrorModal({ isOpen: true, type: 'duplicate-email', message });
      } else {
        setErrorModal({ isOpen: true, type: 'default', message });
      }
    }
  };

  const handleGoogleSignup = async (accessToken) => {
    setIsGoogleLoading(true);
    try {
      const result = await dispatch(googleLogin(accessToken)).unwrap();
      if (result.success) {
        setIsSuccess(true);
        toast.success('Welcome to TASKORA!');
        setTimeout(() => navigate('/profile'), 1500);
      }
    } catch (error) {
      setErrorModal({
        isOpen: true,
        type: 'google-auth',
        message: error?.message || error?.data?.message || 'Google signup failed. Please try again.',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = (error) => {
    setErrorModal({
      isOpen: true,
      type: 'google-auth',
      title: 'Google Signup Failed',
      message: error?.message || 'Google signup was cancelled or failed. Please try again.',
    });
  };

  const inputClass = (field) =>
    `w-full rounded-lg border bg-white/5 px-4 py-3 text-white outline-none transition focus:border-secondary ${
      errors[field] ? 'border-red-500' : 'border-white/10'
    }`;

  return (
    <div className="min-h-screen bg-[#09090f] text-white">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(124,58,237,0.14),transparent_36%)]" />
      <Navbar />

      <main className="relative z-10 px-4 pb-12 pt-24">
        {isSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto mt-16 max-w-md rounded-2xl border border-white/10 bg-white/10 p-10 text-center backdrop-blur-xl"
          >
            <FaCheckCircle className="mx-auto mb-5 text-5xl text-green-400" />
            <h1 className="text-3xl font-bold">Welcome to TASKORA</h1>
            <p className="mt-2 text-gray-300">Your profile is ready.</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-2xl"
          >
            <div className="rounded-2xl border border-white/10 bg-[#12121a]/90 p-5 shadow-2xl backdrop-blur-xl md:p-8">
              <div className="mb-6 text-center">
                <h1 className="text-3xl font-bold">Create Account</h1>
                <p className="mt-2 text-gray-400">Set up your student profile and academic path.</p>
              </div>

              <div className="mb-6">
                <GoogleAuthButton
                  onSuccess={handleGoogleSignup}
                  onError={handleGoogleError}
                  isLoading={isGoogleLoading}
                  type="signup"
                />
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-[#12121a] px-3 text-gray-400">or sign up with email</span>
                </div>
              </div>

              <form onSubmit={handleSubmit(handleSignup)} className="grid gap-4 md:grid-cols-2">
                <Field label="Full Name" error={errors.fullName?.message}>
                  <input {...register('fullName')} className={inputClass('fullName')} placeholder="Your full name" />
                </Field>

                <Field label="Email" error={errors.email?.message}>
                  <div className="relative">
                    <input type="email" {...register('email')} className={`${inputClass('email')} pr-11`} placeholder="you@college.edu" />
                    {emailStatus === 'checking' && <FaSpinner className="absolute right-4 top-4 animate-spin text-gray-400" />}
                    {emailStatus === 'available' && <FaCheckCircle className="absolute right-4 top-4 text-green-400" />}
                  </div>
                </Field>

                <Field label="Password" error={errors.password?.message}>
                  <PasswordInput
                    register={register('password')}
                    visible={showPassword}
                    onToggle={() => setShowPassword((value) => !value)}
                    className={inputClass('password')}
                  />
                  <PasswordStrengthMeter password={password} />
                </Field>

                <Field label="Confirm Password" error={errors.confirmPassword?.message}>
                  <PasswordInput
                    register={register('confirmPassword')}
                    visible={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword((value) => !value)}
                    className={inputClass('confirmPassword')}
                  />
                </Field>

                <Field label="College" error={errors.college?.message}>
                  <input {...register('college')} className={inputClass('college')} placeholder="Your college" />
                </Field>

                <Field label="Education Type" error={errors.educationType?.message}>
                  <Select
                    selectProps={{ ...register('educationType') }}
                    error={errors.educationType?.message}
                  >
                    <option value="">Select education type</option>
                    {educationTypes.map((et) => (
                      <option key={et} value={et}>{et}</option>
                    ))}
                  </Select>
                </Field>

                <Field label="Group" error={errors.group?.message}>
                  {!groups.length && selectedEducationType && !groupsLoading ? (
                    <div className="bg-white/5 border border-yellow-500/30 rounded-lg px-4 py-2.5 text-yellow-300 text-sm">
                      No groups found for &quot;{selectedEducationType}&quot;. Please select a different Education Type.
                    </div>
                  ) : (
                    <Select
                      selectProps={{ ...register('group') }}
                      disabled={!selectedEducationType || groupsLoading}
                      error={errors.group?.message}
                    >
                      <option value="">
                        {!selectedEducationType ? 'Select education type first' : groupsLoading ? 'Loading groups...' : 'Select group'}
                      </option>
                      {groups.map((group) => (
                        <option key={group._id} value={group._id}>{group.name}</option>
                      ))}
                    </Select>
                  )}
                </Field>

                <div className="md:col-span-2 mt-2">
                  <button
                    type="submit"
                    disabled={isLoading || emailStatus === 'checking' || emailStatus === 'exists'}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-3 font-bold text-gray-950 transition hover:bg-cyan-300 disabled:opacity-60"
                  >
                    {isLoading ? <><FaSpinner className="animate-spin" /> Creating Account...</> : 'Create Account'}
                  </button>
                </div>
              </form>

              <p className="mt-6 text-center text-gray-400">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-primary hover:text-white">Sign In</Link>
              </p>
            </div>
          </motion.div>
        )}
      </main>

      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
        type={errorModal.type}
        title={errorModal.title}
        message={errorModal.message}
      />
    </div>
  );
};

const Field = ({ label, error, children }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-medium text-gray-300">{label}</span>
    {children}
    {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
  </label>
);

const PasswordInput = ({ register, visible, onToggle, className }) => (
  <div className="relative">
    <input
      type={visible ? 'text' : 'password'}
      {...register}
      className={`${className} pr-11`}
      placeholder="Password"
    />
    <button type="button" onClick={onToggle} className="absolute right-4 top-4 text-gray-400 hover:text-white">
      {visible ? <FaEyeSlash /> : <FaEye />}
    </button>
  </div>
);

export default SignupPage;
