import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FaEnvelope, FaGraduationCap, FaUniversity, FaSave, FaCamera, FaSpinner, FaLock, FaUser, FaSchool, FaBookOpen, FaCheckCircle, FaCalendarAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { PageSkeleton } from '../../components/ui/LoadingSkeleton';
import UploadPopup from '../../components/ui/UploadPopup';
import { userApi } from '../../services/userApi';
import { academicApi } from '../../services/academicApi';
import { FALLBACK_EDUCATION_TYPES } from '../../constants/academic';
import { semesterApi } from '../../services/semesterApi';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../redux/slices/authSlice';
import Select from '../../components/ui/Select';
import BackButton from '../../components/ui/BackButton';
import AcademicTimeline from '../../components/academic/AcademicTimeline';

const Profile = () => {
  const dispatch = useDispatch();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [educationTypes, setEducationTypes] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    college: '',
    university: '',
    educationType: '',
    group: '',
    profilePicture: '',
    profileLocked: false,
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [semesters, setSemesters] = useState([]);
  const [semestersLoading, setSemestersLoading] = useState(false);
  const fileInputRef = useRef(null);

  const loadSemesters = useCallback(async () => {
    if (!form.educationType) return;
    setSemestersLoading(true);
    try {
      const data = await semesterApi.getAll();
      setSemesters(data.semesters || []);
    } catch {
      setSemesters([]);
    } finally {
      setSemestersLoading(false);
    }
  }, [form.educationType]);

  const loadProfile = useCallback(async () => {
    try {
      const [profileData, typesData] = await Promise.all([
        userApi.getProfile(),
        academicApi.getEducationTypes().catch(() => ({ educationTypes: FALLBACK_EDUCATION_TYPES })),
      ]);
      const data = profileData;
      setProfile(data.user);
      setEducationTypes(typesData.educationTypes || FALLBACK_EDUCATION_TYPES);
      const pic = data.user.profilePicture || data.user.avatar || '';
      setForm({
        name: data.user.name || '',
        college: data.user.college || '',
        university: data.user.university || '',
        group: data.user.group?._id || data.user.group || '',
        educationType: data.user.educationType || '',
        profilePicture: pic,
        profileLocked: data.user.profileLocked || false,
      });
      setPreviewImage(pic);
    } catch (err) {
      const msg = err?.response?.status === 401
        ? 'Session expired. Please login again.'
        : err?.response?.status === 404
          ? 'User profile not found.'
          : err?.code === 'ECONNABORTED'
            ? 'Request timed out. Server may be unavailable.'
            : err?.code === 'ERR_NETWORK'
              ? 'Network error. Unable to reach the server.'
              : 'Failed to load profile. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (profile) loadSemesters();
  }, [profile, loadSemesters]);

  useEffect(() => {
    if (!form.educationType) {
      setGroups([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setGroupsLoading(true);
      try {
        const data = await academicApi.getGroups(form.educationType);
        if (!cancelled) setGroups(data.groups || []);
      } catch {
        if (!cancelled) setGroups([]);
      } finally {
        if (!cancelled) setGroupsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [form.educationType]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.college.trim()) errs.college = 'College name is required';
    if (!form.educationType) errs.educationType = 'Education type is required';
    if (!form.group) errs.group = 'Group or branch is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, JPEG, PNG, and WEBP files are allowed');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    setUploadStatus('uploading');
    setUploadMessage('');
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) { clearInterval(progressInterval); return 90; }
        return prev + Math.random() * 15;
      });
    }, 300);

    try {
      const formData = new FormData();
      formData.append('image', file);
      const result = await userApi.uploadProfileImage(formData);
      clearInterval(progressInterval);
      setUploadProgress(100);
      if (result.success) {
        setForm(f => ({ ...f, profilePicture: result.profilePicture }));
        setPreviewImage(result.profilePicture);
        dispatch(updateUser({ profilePicture: result.profilePicture, avatar: result.profilePicture }));
        setUploadStatus('success');
        setUploadMessage('Profile picture updated successfully');
        setTimeout(() => { setUploadStatus('idle'); setUploading(false); }, 2000);
      }
    } catch (err) {
      clearInterval(progressInterval);
      const msg = err.response?.data?.message || 'Failed to upload image';
      setUploadStatus('error');
      setUploadMessage(msg);
      setPreviewImage(form.profilePicture || '');
      setTimeout(() => { setUploadStatus('idle'); setUploading(false); }, 2500);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error('Please fix the highlighted errors');
      return;
    }
    if (!form.profileLocked && (!form.name?.trim() || !form.college?.trim() || !form.educationType || !form.group)) {
      toast.error('Please complete all required profile fields');
      return;
    }
    setSaving(true);
    try {
      const payload = form.profileLocked
        ? { name: form.name }
        : {
            name: form.name,
            college: form.college,
            university: form.university,
            educationType: form.educationType,
            group: form.group,
          };
      const data = await userApi.updateProfile(payload);
      dispatch(updateUser(data.user));
      toast.success(data.message || 'Profile updated');
      loadProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const getApiUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${path}`;
  };

  if (loading) return <PageSkeleton />;
  if (!profile) return <div className="text-center text-gray-500 py-20">Profile not found</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-8">
      <BackButton to="/dashboard" />
      <UploadPopup
        isOpen={uploading || uploadStatus === 'success' || uploadStatus === 'error'}
        status={uploadStatus}
        message={uploadMessage}
        progress={uploadProgress}
      />
      <div className="glass-card p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-secondary/10 rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="relative group shrink-0">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-4xl font-bold text-white overflow-hidden">
              {previewImage ? (
                <img src={getApiUrl(previewImage)} alt={profile.name} className="h-full w-full object-cover" />
              ) : (
                profile.name?.charAt(0) || 'U'
              )}
            </div>
            {form.profileLocked && (
              <div className="absolute -top-1 -right-1 bg-primary/80 rounded-full p-1.5">
                <FaLock size={12} className="text-white" />
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                <FaSpinner className="animate-spin text-white text-xl" />
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 p-2.5 bg-primary rounded-full text-white hover:bg-accent transition-all shadow-lg hover:shadow-primary/30 disabled:opacity-50"
            >
              <FaCamera size={14} />
            </button>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-white">{form.name || 'Your Name'}</h1>
            <p className="text-gray-400 flex items-center gap-2 justify-center md:justify-start mt-2">
              <FaEnvelope /> {profile.email}
            </p>
            <div className="flex flex-wrap gap-4 mt-4 justify-center md:justify-start">
              <span className="px-3 py-1 rounded-full bg-white/5 text-gray-300 text-sm flex items-center gap-1">
                <FaSchool /> {form.college || 'College not set'}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 text-gray-300 text-sm flex items-center gap-1">
                <FaUniversity /> {form.university || 'University not set'}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 text-gray-300 text-sm flex items-center gap-1">
                <FaGraduationCap /> {form.educationType || 'Education not set'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 text-center">
          <div className="text-3xl font-bold text-primary">{profile.studyStreak || 0}</div>
          <p className="text-gray-400 text-sm mt-1">Day Streak</p>
        </div>
        <div className="glass-card p-6 text-center">
          <div className="text-3xl font-bold text-secondary">{profile.longestStreak || 0}</div>
          <p className="text-gray-400 text-sm mt-1">Longest Streak</p>
        </div>
        <div className="glass-card p-6 text-center">
          <div className="text-3xl font-bold text-accent">{profile.totalStudyHours?.toFixed(1) || 0}h</div>
          <p className="text-gray-400 text-sm mt-1">Total Study Hours</p>
        </div>
      </div>

      <div className="glass-card p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Profile Information</h2>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-medium flex items-center gap-2 hover:bg-accent transition-all disabled:opacity-50"
          >
            {saving ? <><FaSpinner className="animate-spin" /> Saving...</> : <><FaSave /> Save Changes</>}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Full Name *</label>
            <div className="relative">
              <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
              <input
                type="text"
                value={form.name}
                onChange={(e) => { setForm(f => ({ ...f, name: e.target.value })); setErrors(prev => ({ ...prev, name: '' })); }}
                className={`w-full bg-white/5 border rounded-lg pl-10 pr-4 py-2.5 text-white outline-none transition-colors ${errors.name ? 'border-red-500' : 'border-white/10 focus:border-primary'}`}
                placeholder="Your full name"
              />
            </div>
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">College Name *</label>
            <div className="relative">
              <FaSchool className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
              <input
                type="text"
                value={form.college}
                onChange={(e) => { setForm(f => ({ ...f, college: e.target.value })); setErrors(prev => ({ ...prev, college: '' })); }}
                disabled={form.profileLocked}
                className={`w-full bg-white/5 border rounded-lg pl-10 pr-4 py-2.5 text-white outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${errors.college ? 'border-red-500' : 'border-white/10 focus:border-primary'}`}
                placeholder={form.profileLocked ? 'Locked' : 'Your college name'}
              />
            </div>
            {errors.college && <p className="text-red-400 text-xs mt-1">{errors.college}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">University Name *</label>
            <div className="relative">
              <FaUniversity className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
              <input
                type="text"
                value={form.university}
                onChange={(e) => { setForm(f => ({ ...f, university: e.target.value })); setErrors(prev => ({ ...prev, university: '' })); }}
                disabled={form.profileLocked}
                className={`w-full bg-white/5 border rounded-lg pl-10 pr-4 py-2.5 text-white outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${errors.university ? 'border-red-500' : 'border-white/10 focus:border-primary'}`}
                placeholder={form.profileLocked ? 'Locked' : 'Your university name'}
              />
            </div>
            {errors.university && <p className="text-red-400 text-xs mt-1">{errors.university}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Education Type *</label>
            <Select
              value={form.educationType}
              onChange={(e) => { setForm(f => ({ ...f, educationType: e.target.value, group: '' })); setErrors(prev => ({ ...prev, educationType: '' })); }}
              disabled={form.profileLocked}
              placeholder={form.profileLocked ? 'Locked' : 'Select education type'}
              options={educationTypes}
              className={errors.educationType ? 'border-red-500' : ''}
            />
            {errors.educationType && <p className="text-red-400 text-xs mt-1">{errors.educationType}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Group / Branch *</label>
            {groupsLoading ? (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-gray-400">
                <FaSpinner className="animate-spin text-sm" /> Loading groups...
              </div>
            ) : !groups.length && form.educationType && !form.profileLocked ? (
              <div className="bg-white/5 border border-yellow-500/30 rounded-lg px-4 py-2.5 text-yellow-300 text-sm">
                No groups found for &quot;{form.educationType}&quot;. Please select a different Education Type.
              </div>
            ) : (
              <Select
                value={form.group}
                onChange={(e) => { setForm(f => ({ ...f, group: e.target.value })); setErrors(prev => ({ ...prev, group: '' })); }}
                disabled={!form.educationType || form.profileLocked}
                placeholder={!form.educationType ? 'Select education type first' : form.profileLocked ? 'Locked' : 'Select group'}
                className={errors.group ? 'border-red-500' : ''}
              >
                {groups.map((g) => (
                  <option key={g._id} value={g._id}>{g.name}</option>
                ))}
              </Select>
            )}
            {errors.group && <p className="text-red-400 text-xs mt-1">{errors.group}</p>}
          </div>
        </div>
      </div>

      {form.educationType && (
        <div className="glass-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <FaCalendarAlt className="text-primary" size={20} />
            <h2 className="text-xl font-bold text-white">Academic Progress</h2>
          </div>
          {semestersLoading ? (
            <div className="flex items-center justify-center py-8">
              <FaSpinner className="animate-spin text-primary text-xl" />
            </div>
          ) : (
            <AcademicTimeline semesters={semesters} educationType={form.educationType} />
          )}
        </div>
      )}

      {semesters.filter(s => s.status === 'active').length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 text-center">
            <FaBookOpen className="text-primary text-2xl mx-auto mb-2" />
            <div className="text-lg font-bold text-white">
              {semesters.filter(s => s.status === 'completed').length}/{semesters.length}
            </div>
            <p className="text-gray-400 text-sm mt-1">Semesters Completed</p>
          </div>
          <div className="glass-card p-6 text-center">
            <FaCheckCircle className="text-secondary text-2xl mx-auto mb-2" />
            <div className="text-lg font-bold text-white">
              {Math.round((semesters.filter(s => s.status === 'completed').length / Math.max(semesters.length, 1)) * 100)}%
            </div>
            <p className="text-gray-400 text-sm mt-1">Overall Progress</p>
          </div>
          <div className="glass-card p-6 text-center">
            <FaGraduationCap className="text-accent text-2xl mx-auto mb-2" />
            <div className="text-lg font-bold text-white">
              {profile.totalStudyHours?.toFixed(1) || 0}h
            </div>
            <p className="text-gray-400 text-sm mt-1">Total Study Hours</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Profile;
