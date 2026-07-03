import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaBook, FaBookOpen, FaSearch, FaGraduationCap, FaPlus, FaTimes,
  FaSync, FaFilter, FaSortAmountDown, FaSortAmountUp, FaEdit, FaTrash,
  FaUniversity, FaCheckCircle, FaSpinner, FaExclamationTriangle,
} from 'react-icons/fa';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { subjectApi } from '../../services/subjectApi';
import { semesterApi } from '../../services/semesterApi';
import { taskApi } from '../../services/taskApi';
import { Link } from 'react-router-dom';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } },
};

const subjectIcons = {
  book: FaBook,
  'book-open': FaBookOpen,
  'fa-book': FaBook,
  'fa-book-open': FaBookOpen,
};

const getIcon = (iconName) => {
  const Icon = subjectIcons[iconName];
  return Icon ? <Icon /> : <FaBook />;
};

const SkeletonSubjectCard = () => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <div className="h-11 w-11 rounded-xl bg-white/10" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-white/10 rounded w-2/3" />
        <div className="h-3 bg-white/10 rounded w-1/3" />
      </div>
    </div>
    <div className="h-2 bg-white/10 rounded-full mb-3" />
    <div className="flex justify-between">
      <div className="h-3 bg-white/10 rounded w-16" />
      <div className="h-3 bg-white/10 rounded w-20" />
    </div>
  </div>
);

const Subjects = () => {
  const { user } = useSelector((state) => state.auth);
  const [subjects, setSubjects] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({ name: '', color: '#7c3aed', icon: 'book', targetHours: 40 });
  const [taskCounts, setTaskCounts] = useState({});
  const loadedRef = useRef(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [subjectData, semData] = await Promise.all([
        subjectApi.getAll().catch(() => ({ subjects: [] })),
        semesterApi.getAll().catch(() => ({ semesters: [] })),
      ]);
      const subjectList = subjectData.subjects || [];
      setSubjects(subjectList);
      const semList = semData.semesters || [];
      setSemesters(semList);

      if (semList.length > 0 && !selectedSemester) {
        const active = semList.find((s) => s.status === 'active');
        if (active) {
          setSelectedSemester(active._id);
        }
      }

      try {
        const taskData = await taskApi.getAll({ limit: 100 });
        const tasks = taskData.tasks || [];
        const counts = {};
        for (const subject of subjectList) {
          const subjectTasks = tasks.filter((t) => t.subject === subject.name);
          counts[subject._id] = {
            total: subjectTasks.length,
            completed: subjectTasks.filter((t) => t.status === 'Completed').length,
            pending: subjectTasks.filter((t) => t.status !== 'Completed').length,
          };
        }
        setTaskCounts(counts);
      } catch {
        // non-critical
      }
    } catch (err) {
      const status = err?.response?.status;
      const msg = status === 401
        ? 'Session expired. Please login again.'
        : status === 503
          ? 'Service temporarily unavailable. Please try again.'
          : err?.code === 'ECONNABORTED'
            ? 'Request timed out. Server may be unavailable.'
            : err?.code === 'ERR_NETWORK'
              ? 'Network error. Unable to reach the server.'
              : err?.response?.data?.message || 'Failed to load subjects.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      loadData();
    }
  }, [loadData]);

  const filteredSubjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = subjects;
    if (q) {
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }
    if (selectedSemester) {
      list = list.filter((s) => {
        const semId = s.semester?._id || s.semester;
        return semId === selectedSemester;
      });
    }
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortBy === 'progress') {
        const ap = taskCounts[a._id];
        const bp = taskCounts[b._id];
        const aPct = ap?.total ? (ap.completed / ap.total) : 0;
        const bPct = bp?.total ? (bp.completed / bp.total) : 0;
        cmp = aPct - bPct;
      } else if (sortBy === 'tasks') {
        const ap = taskCounts[a._id]?.total || 0;
        const bp = taskCounts[b._id]?.total || 0;
        cmp = ap - bp;
      } else if (sortBy === 'targetHours') {
        cmp = (a.targetHours || 40) - (b.targetHours || 40);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [subjects, search, selectedSemester, sortBy, sortDir, taskCounts]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const openCreateForm = () => {
    setEditingSubject(null);
    setFormData({ name: '', color: '#7c3aed', icon: 'book', targetHours: 40 });
    setShowForm(true);
  };

  const openEditForm = (subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      color: subject.color || '#7c3aed',
      icon: subject.icon || 'book',
      targetHours: subject.targetHours || 40,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Subject name is required');
      return;
    }
    setSubmitting(true);
    try {
      if (editingSubject) {
        await subjectApi.update(editingSubject._id, {
          name: formData.name.trim(),
          color: formData.color,
          icon: formData.icon,
          targetHours: formData.targetHours,
        });
        toast.success('Subject updated');
      } else {
        await subjectApi.create({
          name: formData.name.trim(),
          color: formData.color,
          icon: formData.icon,
          targetHours: formData.targetHours,
        });
        toast.success('Subject created');
      }
      setShowForm(false);
      setEditingSubject(null);
      await loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save subject');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This action cannot be undone.`)) return;
    try {
      await subjectApi.delete(id);
      toast.success('Subject deleted');
      setSubjects((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete subject');
    }
  };

  const toggleSortDir = () => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="h-8 bg-white/10 rounded w-48 mb-6 animate-pulse" />
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="h-11 bg-white/10 rounded-xl w-64 animate-pulse" />
          <div className="h-11 bg-white/10 rounded-xl w-40 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonSubjectCard key={i} />)}
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center"
      >
        <div className="rounded-2xl bg-gradient-to-br from-rose-500/10 to-rose-600/5 border border-rose-500/20 p-10 max-w-md">
          <FaExclamationTriangle size={48} className="mx-auto mb-4 text-rose-400" />
          <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-medium hover:shadow-lg hover:shadow-primary/25 transition-all"
          >
            <FaSync /> Try Again
          </button>
        </div>
      </motion.div>
    );
  }

  if (!user?.group) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Subjects</h1>
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-12 max-w-md">
            <FaBookOpen size={48} className="mx-auto mb-4 text-gray-600" />
            <h3 className="text-lg font-semibold text-white mb-2">Complete Your Academic Profile</h3>
            <p className="text-gray-400 mb-6">Set up your education type and group to see your subjects.</p>
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-medium hover:shadow-lg hover:shadow-primary/25 transition-all"
            >
              <FaGraduationCap /> Complete Profile
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Subjects</h1>
          <p className="mt-1 text-sm text-gray-400 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1"><FaGraduationCap className="text-primary" /> {user.educationType || 'Education'}</span>
            {user.group?.name && (
              <span className="flex items-center gap-1"><FaUniversity className="text-secondary" /> {user.group.name}</span>
            )}
            <span className="text-gray-600">|</span>
            <span>{subjects.length} subject{subjects.length !== 1 ? 's' : ''}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-gray-300 text-sm font-medium hover:bg-white/10 transition-all"
          >
            <FaSync size={12} /> Refresh
          </button>
          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-white text-sm font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all"
          >
            <FaPlus size={12} /> Add Subject
          </button>
        </div>
      </motion.div>

      {/* Search & Filters */}
      <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4">
        <div className="relative flex-[2] min-w-[200px] max-w-md">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={13} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subjects..."
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-white text-sm outline-none focus:border-primary transition-colors"
          />
        </div>

        {semesters.length > 0 && (
          <div className="relative min-w-[180px]">
            <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10" size={12} />
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-4 text-white text-sm outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
            >
              <option value="">All Semesters</option>
              {semesters.map((sem) => (
                <option key={sem._id} value={sem._id}>{sem.label}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSort('name')}
            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs font-medium transition-all ${
              sortBy === 'name'
                ? 'border-primary/40 bg-primary/20 text-primary'
                : 'border-white/10 bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <FaSortAmountDown size={10} /> Name
          </button>
          <button
            onClick={() => handleSort('progress')}
            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs font-medium transition-all ${
              sortBy === 'progress'
                ? 'border-primary/40 bg-primary/20 text-primary'
                : 'border-white/10 bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <FaSortAmountDown size={10} /> Progress
          </button>
          <button
            onClick={toggleSortDir}
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:text-white transition-all"
            title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortDir === 'asc' ? <FaSortAmountUp size={12} /> : <FaSortAmountDown size={12} />}
          </button>
        </div>
      </motion.div>

      {/* Subject Grid */}
      <AnimatePresence mode="wait">
        {filteredSubjects.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center min-h-[40vh] text-center"
          >
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-12 max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
                <FaBookOpen className="text-primary" size={28} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {search || selectedSemester ? 'No subjects found' : 'No subjects yet'}
              </h3>
              <p className="text-gray-400 text-sm mb-6">
                {search || selectedSemester
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Add your first subject to start tracking your studies.'}
              </p>
              <button
                onClick={openCreateForm}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-medium hover:shadow-lg hover:shadow-primary/25 transition-all"
              >
                <FaPlus /> Add Subject
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence>
              {filteredSubjects.map((subject) => {
                const counts = taskCounts[subject._id] || { total: 0, completed: 0, pending: 0 };
                const progressPct = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;

                return (
                  <motion.div
                    key={subject._id}
                    layout
                    variants={itemVariants}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -3, transition: { type: 'spring', stiffness: 300 } }}
                    className="group relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-md p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all"
                  >
                    {/* Color accent */}
                    <div
                      className="absolute right-0 top-0 h-24 w-24 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity"
                      style={{ backgroundColor: subject.color || '#7c3aed' }}
                    />

                    <div className="relative z-10">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
                            style={{ backgroundColor: subject.color || '#7c3aed' }}
                          >
                            {getIcon(subject.icon)}
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-bold text-white">{subject.name}</h3>
                            <p className="text-xs text-gray-500">
                              {subject.targetHours || 40}h target
                              {subject.semester && semesters.find((s) => {
                                const semId = s._id;
                                const subSemId = subject.semester?._id || subject.semester;
                                return semId === subSemId;
                              }) ? ` · ${semesters.find((s) => {
                                const semId = s._id;
                                const subSemId = subject.semester?._id || subject.semester;
                                return semId === subSemId;
                              })?.label}` : ''}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditForm(subject)}
                            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                            title="Edit"
                          >
                            <FaEdit size={12} />
                          </button>
                          <button
                            onClick={() => handleDelete(subject._id, subject.name)}
                            className="p-2 rounded-lg hover:bg-rose-500/10 text-gray-400 hover:text-rose-400 transition-all"
                            title="Delete"
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {counts.total > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-gray-500">{progressPct}% complete</span>
                            <span className="text-gray-500">{counts.completed}/{counts.total} tasks</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progressPct}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                            />
                          </div>
                        </div>
                      )}

                      {/* Stats Row */}
                      <div className="flex items-center gap-4 text-xs">
                        <span className={`flex items-center gap-1 ${counts.pending > 0 ? 'text-amber-400' : 'text-gray-600'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${counts.pending > 0 ? 'bg-amber-400' : 'bg-gray-600'}`} />
                          {counts.pending} pending
                        </span>
                        <span className={`flex items-center gap-1 ${counts.completed > 0 ? 'text-green-400' : 'text-gray-600'}`}>
                          <FaCheckCircle size={10} />
                          {counts.completed} done
                        </span>
                        {subject.completed && (
                          <span className="flex items-center gap-1 text-green-400">
                            <FaCheckCircle size={10} />
                            Completed
                          </span>
                        )}
                      </div>

                      {counts.pending > 0 && (
                        <p className="mt-2 text-xs text-gray-600">
                          {counts.pending} task{counts.pending !== 1 ? 's' : ''} remaining
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Summary */}
      <motion.div variants={itemVariants} className="text-xs text-gray-600 text-center">
        {filteredSubjects.length} subject{filteredSubjects.length !== 1 ? 's' : ''} shown
        {(search || selectedSemester) && subjects.length !== filteredSubjects.length && (
          <span> (filtered from {subjects.length})</span>
        )}
      </motion.div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/50"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-900 p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">
                  {editingSubject ? 'Edit Subject' : 'Add Subject'}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                >
                  <FaTimes size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Subject Name</label>
                  <input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Mathematics"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white text-sm outline-none focus:border-primary transition-colors"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Color</label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-10 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer"
                      />
                      <span className="text-sm text-gray-400">{formData.color}</span>
                    </div>
                    <div className="flex gap-2">
                      {['#7c3aed', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#ec4899'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setFormData({ ...formData, color: c })}
                          className={`w-7 h-7 rounded-lg border-2 transition-all ${
                            formData.color === c ? 'border-white scale-110' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Target Hours</label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={formData.targetHours}
                    onChange={(e) => setFormData({ ...formData, targetHours: parseInt(e.target.value) || 40 })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white text-sm outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-gray-300 font-medium text-sm hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !formData.name.trim()}
                    className="flex-1 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-2.5 text-white font-semibold text-sm hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? <FaSpinner className="animate-spin" /> : null}
                    {editingSubject ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Subjects;
