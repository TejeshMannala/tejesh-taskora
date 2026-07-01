import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaEnvelope, FaGraduationCap, FaBook, FaCalendar, FaSave, FaCamera, FaSpinner, FaCheckCircle, FaLock } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { PageSkeleton } from '../../components/ui/LoadingSkeleton';
import UploadPopup from '../../components/ui/UploadPopup';
import { userApi } from '../../services/userApi';
import { academicApi } from '../../services/academicApi';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../redux/slices/authSlice';
import Select from '../../components/ui/Select';
import BackButton from '../../components/ui/BackButton';

const Profile = () => {
  const dispatch = useDispatch();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [groups, setGroups] = useState([]);
  const [years, setYears] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [form, setForm] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (!form.educationType) { setGroups([]); setYears([]); return; }
    loadGroups(form.educationType);
    generateYears(form.educationType);
  }, [form.educationType]);

  const generateYears = (educationType) => {
    if (educationType === 'Intermediate') {
      setYears(['1st Year', '2nd Year']);
    } else if (educationType === 'Degree') {
      setYears(['1st Year', '2nd Year', '3rd Year']);
    } else if (educationType === 'B.Tech') {
      setYears(['1st Year', '2nd Year', '3rd Year', '4th Year']);
    } else {
      setYears([]);
    }
  };

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const yearsList = [];
    for (let i = -1; i < 4; i++) {
      const start = currentYear + i;
      yearsList.push(`${start}-${start + 1}`);
    }
    setAcademicYears(yearsList);
  }, []);

  const loadGroups = async (educationType) => {
    try {
      console.log('[Profile] Loading groups for:', educationType);
      const data = await academicApi.getGroups(educationType);
      console.log('[Profile] Groups loaded:', data.groups?.length || 0);
      setGroups(data.groups || []);
    } catch (err) {
      console.error('[Profile] Failed to load groups:', err);
      setGroups([]);
    }
  };

  const loadProfile = async () => {
    try {
      const data = await userApi.getProfile();
      setProfile(data.user);
      const pic = data.user.profilePicture || data.user.avatar || '';
      setForm({
        name: data.user.name || '',
        college: data.user.college || '',
        group: data.user.group?._id || data.user.group || '',
        educationType: data.user.educationType || '',
        semesterYear: data.user.semesterYear || data.user.year || '',
        academicYear: data.user.academicYear || '',
        profilePicture: pic,
        profileLocked: data.user.profileLocked || false,
      });
      setPreviewImage(pic);
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
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
      console.log("File:", file.name, file.type, file.size);
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
    if (!form.profileLocked && (!form.name?.trim() || !form.college?.trim() || !form.educationType || !form.group || !form.academicYear?.trim())) {
      toast.error('Please complete all required profile fields');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        college: form.college,
        educationType: form.educationType,
        group: form.group,
        semesterYear: form.semesterYear || form.academicYear,
        academicYear: form.academicYear,
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

  if (loading) return <PageSkeleton />;
  if (!profile) return <div className="text-center text-gray-500 py-20">Profile not found</div>;

  const getApiUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${path}`;
  };

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
          <div className="relative group">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-4xl font-bold text-white overflow-hidden">
              {previewImage ? (
                <img src={getApiUrl(previewImage)} alt={profile.name} className="h-full w-full rounded-full object-cover" />
              ) : (
                profile.name?.charAt(0) || 'U'
              )}
              {form.profileLocked && (
                <div className="absolute top-0 right-0 bg-primary/80 rounded-full p-1.5">
                  <FaLock size={12} className="text-white" />
                </div>
              )}
            </div>
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
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              disabled={form.profileLocked}
              className="text-3xl font-bold bg-transparent border-b border-transparent hover:border-white/20 focus:border-primary outline-none text-white w-full transition-colors disabled:opacity-60"
              placeholder="Your full name"
            />
            <p className="text-gray-400 flex items-center gap-2 justify-center md:justify-start mt-2">
              <FaEnvelope /> {profile.email}
            </p>
            <div className="flex flex-wrap gap-4 mt-4 justify-center md:justify-start">
              <span className="px-3 py-1 rounded-full bg-white/5 text-gray-300 text-sm flex items-center gap-1">
                <FaGraduationCap /> {form.college || 'College not set'}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 text-gray-300 text-sm flex items-center gap-1">
                <FaBook /> {form.educationType || 'Education not set'}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 text-gray-300 text-sm flex items-center gap-1">
                <FaCalendar /> {form.academicYear || 'Year not set'}
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
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-primary transition-colors"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-gray-400 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">College Name *</label>
            <input
              type="text"
              value={form.college}
              onChange={(e) => setForm(f => ({ ...f, college: e.target.value }))}
              disabled={form.profileLocked}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              placeholder={form.profileLocked ? 'Locked' : 'Your college name'}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Education Type *</label>
            <Select
              value={form.educationType}
              onChange={(e) => setForm(f => ({ ...f, educationType: e.target.value, group: '', academicYear: '' }))}
              disabled={form.profileLocked}
              placeholder={form.profileLocked ? 'Locked' : 'Select education type'}
              options={['Intermediate', 'Degree', 'B.Tech']}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Group / Branch *</label>
            <Select
              value={form.group}
              onChange={(e) => setForm(f => ({ ...f, group: e.target.value }))}
              disabled={!form.educationType || form.profileLocked}
              placeholder={!form.educationType ? 'Select education type first' : form.profileLocked ? 'Locked' : 'Select group'}
            >
              {groups.map((g) => (
                <option key={g._id} value={g._id}>{g.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Semester / Year</label>
            <input
              type="text"
              value={form.semesterYear}
              onChange={(e) => setForm(f => ({ ...f, semesterYear: e.target.value }))}
              disabled={form.profileLocked}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              placeholder={form.profileLocked ? 'Locked' : '1st Year / Semester 1'}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Academic Year *</label>
            <Select
              value={form.academicYear}
              onChange={(e) => setForm(f => ({ ...f, academicYear: e.target.value }))}
              disabled={!form.educationType || form.profileLocked}
              placeholder={!form.educationType ? 'Select education type first' : form.profileLocked ? 'Locked' : 'Select year range'}
            >
              {academicYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </Select>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Profile;
