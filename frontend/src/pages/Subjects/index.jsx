import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FaBook, FaBookOpen, FaEdit, FaFilter, FaPlus, FaSearch, FaTrash, FaSync, FaGraduationCap } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import Select from '../../components/ui/Select';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import { PageSkeleton } from '../../components/ui/LoadingSkeleton';
import { subjectApi } from '../../services/subjectApi';
import { Link } from 'react-router-dom';
import BackButton from '../../components/ui/BackButton';

const blankForm = { name: '', color: '#7c3aed', icon: 'book', targetHours: 40 };

const Subjects = () => {
  const { user } = useSelector((state) => state.auth);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [filters, setFilters] = useState({ search: '', color: '' });

  const loadSubjects = async () => {
    try {
      console.log("Education:", user?.educationType);
      console.log("Group:", user?.group);
      const data = await subjectApi.getAll();
      console.log("Subjects:", data.subjects || []);
      setSubjects(data.subjects || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const handleRegenerate = async () => {
    if (!confirm('This will refresh your subjects based on your current group. Continue?')) return;
    setGenerating(true);
    try {
      const data = await subjectApi.getAll();
      setSubjects(data.subjects || []);
      toast.success('Subjects refreshed');
    } catch (err) {
      toast.error('Failed to refresh subjects');
    } finally {
      setGenerating(false);
    }
  };

  const visibleSubjects = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return subjects.filter((subject) => {
      const matchesSearch = !query || subject.name.toLowerCase().includes(query);
      const matchesColor = !filters.color || subject.color === filters.color;
      return matchesSearch && matchesColor;
    });
  }, [subjects, filters]);

  const colors = [...new Set(subjects.map((subject) => subject.color).filter(Boolean))];

  const openCreate = () => {
    setEditing(null);
    setForm(blankForm);
    setShowModal(true);
  };

  const openEdit = (subject) => {
    setEditing(subject);
    setForm({
      name: subject.name,
      color: subject.color || '#7c3aed',
      icon: subject.icon || 'book',
      targetHours: subject.targetHours || 40,
    });
    setShowModal(true);
  };

  const saveSubject = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error('Subject name is required');
      return;
    }

    try {
      if (editing) {
        await subjectApi.update(editing._id, form);
        toast.success('Subject updated');
      } else {
        await subjectApi.create(form);
        toast.success('Subject added');
      }
      setShowModal(false);
      loadSubjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save subject');
    }
  };

  const deleteSubject = async (subject) => {
    if (!subject.name) return;
    const confirmed = window.confirm(`Delete ${subject.name}?`);
    if (!confirmed) return;
    try {
      await subjectApi.delete(subject._id);
      toast.success('Subject deleted');
      loadSubjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete subject');
    }
  };

  if (loading) return <PageSkeleton />;

  if (!user?.group) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <BackButton to="/dashboard" />
        <h1 className="text-3xl font-bold text-white">Subjects</h1>
        <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-12 text-center">
          <FaBook size={48} className="mx-auto mb-4 text-gray-600" />
          <p className="text-lg text-gray-400">Complete your academic profile to generate subjects.</p>
          <Link to="/profile" className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-xl bg-primary text-white font-medium">
            <FaGraduationCap /> Complete Profile
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <BackButton to="/dashboard" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Subjects</h1>
          <p className="mt-2 text-sm text-gray-400">
            {user.educationType || 'Education'} / {user.group?.name || 'Selected group'}
            {user.academicYear && ` / ${user.academicYear}`}
          </p>
        </div>
        <div className="flex gap-2">
          {subjects.length > 0 && (
            <button onClick={handleRegenerate} disabled={generating} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-gray-300 font-medium hover:bg-white/10 transition-all">
              <FaSync className={generating ? 'animate-spin' : ''} /> Refresh
            </button>
          )}
          <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-medium text-white">
            <FaPlus /> Add Subject
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative max-w-md flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={filters.search}
            onChange={(event) => setFilters((value) => ({ ...value, search: event.target.value }))}
            placeholder="Search subjects..."
            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white outline-none focus:border-primary"
          />
        </div>
        <div className="relative">
          <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <Select
            value={filters.color}
            onChange={(event) => setFilters((value) => ({ ...value, color: event.target.value }))}
            className="min-w-[140px] pl-9"
          >
            <option value="">All colors</option>
            {colors.map((color) => <option key={color} value={color}>{color}</option>)}
          </Select>
        </div>
      </div>

      {visibleSubjects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-12 text-center">
          <FaBook size={48} className="mx-auto mb-4 text-gray-600" />
          <p className="text-lg text-gray-500">
            {subjects.length === 0
              ? 'No subjects found for your group. Click "Add Subject" to create one or update your profile.'
              : 'No subjects match your filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibleSubjects.map((subject, index) => (
            <motion.article
              key={subject._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur"
            >
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full opacity-10" style={{ backgroundColor: subject.color || '#7c3aed' }} />
              <div className="relative z-10">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ backgroundColor: subject.color || '#7c3aed' }}>
                      <FaBookOpen />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold text-white">{subject.name}</h3>
                      <p className="text-xs text-gray-500">{subject.targetHours || 40} target hours</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(subject)} className="p-2 text-gray-400 hover:text-secondary"><FaEdit /></button>
                    <button onClick={() => deleteSubject(subject)} className="p-2 text-gray-400 hover:text-danger"><FaTrash /></button>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Subject' : 'Add Subject'}>
        <form onSubmit={saveSubject} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm text-gray-300">Subject Name</span>
            <input value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-primary" />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-2 block text-sm text-gray-300">Color</span>
              <input type="color" value={form.color} onChange={(event) => setForm((value) => ({ ...value, color: event.target.value }))} className="h-12 w-full rounded-lg border border-white/10 bg-white/5 p-1" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-gray-300">Target Hours</span>
              <input type="number" min="1" value={form.targetHours} onChange={(event) => setForm((value) => ({ ...value, targetHours: Number(event.target.value) }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-primary" />
            </label>
          </div>
          <button className="w-full rounded-xl bg-primary py-3 font-medium text-white">{editing ? 'Update Subject' : 'Create Subject'}</button>
        </form>
      </Modal>
    </motion.div>
  );
};

export default Subjects;
