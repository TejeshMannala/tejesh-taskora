import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FaBook, FaBookOpen, FaEdit, FaGraduationCap, FaPlus, FaSpinner, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { adminApi } from '../services/adminApi';

const emptyForms = {
  degree: { name: '', description: '' },
  course: { name: '', description: '', degree: '' },
  subject: { name: '', description: '', course: '', color: '#7c3aed' },
};

const Courses = () => {
  const [degrees, setDegrees] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForms.degree);

  const load = async () => {
    setLoading(true);
    try {
      const [degreeData, courseData, subjectData] = await Promise.all([
        adminApi.getDegrees(),
        adminApi.getCourses(),
        adminApi.getSubjects(),
      ]);
      setDegrees(degreeData.degrees || []);
      setCourses(courseData.courses || []);
      setSubjects(subjectData.subjects || []);
    } catch {
      toast.error('Failed to load education catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const courseCountByDegree = useMemo(() => courses.reduce((acc, course) => {
    const degreeId = course.degree?._id || course.degree;
    acc[degreeId] = (acc[degreeId] || 0) + 1;
    return acc;
  }, {}), [courses]);

  const subjectCountByCourse = useMemo(() => subjects.reduce((acc, subject) => {
    const courseId = subject.course?._id || subject.course;
    acc[courseId] = (acc[courseId] || 0) + 1;
    return acc;
  }, {}), [subjects]);

  const openCreate = (type) => {
    setModal({ type, item: null });
    setForm(emptyForms[type]);
  };

  const openEdit = (type, item) => {
    setModal({ type, item });
    if (type === 'degree') setForm({ name: item.name, description: item.description || '' });
    if (type === 'course') setForm({ name: item.name, description: item.description || '', degree: item.degree?._id || item.degree || '' });
    if (type === 'subject') setForm({ name: item.name, description: item.description || '', course: item.course?._id || item.course || '', color: item.color || '#7c3aed' });
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      const { type, item } = modal;
      const capitalized = type[0].toUpperCase() + type.slice(1);
      if (item) await adminApi[`update${capitalized}`](item._id, form);
      else await adminApi[`create${capitalized}`](form);
      toast.success(`${capitalized} saved`);
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
  };

  const remove = async (type, item) => {
    if (!confirm(`Delete ${item.name}? Related child records may also be deleted.`)) return;
    try {
      const capitalized = type[0].toUpperCase() + type.slice(1);
      await adminApi[`delete${capitalized}`](item._id);
      toast.success(`${capitalized} deleted`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  if (loading) {
    return <div className="flex items-center gap-2 p-8 text-white"><FaSpinner className="animate-spin" /> Loading education catalog...</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Education Management</h1>
          <p className="mt-1 text-gray-400">Manage degrees, courses, and subjects.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionButton onClick={() => openCreate('degree')} icon={<FaPlus />} label="Add Degree" />
          <ActionButton onClick={() => openCreate('course')} icon={<FaPlus />} label="Add Course" />
          <ActionButton onClick={() => openCreate('subject')} icon={<FaPlus />} label="Add Subject" />
        </div>
      </div>

      <Section title="Degrees" icon={<FaGraduationCap />} items={degrees} empty="No degrees yet.">
        {(degree) => (
          <CatalogCard
            key={degree._id}
            title={degree.name}
            subtitle={`${courseCountByDegree[degree._id] || 0} courses`}
            description={degree.description}
            onEdit={() => openEdit('degree', degree)}
            onDelete={() => remove('degree', degree)}
          />
        )}
      </Section>

      <Section title="Courses" icon={<FaBook />} items={courses} empty="No courses yet.">
        {(course) => (
          <CatalogCard
            key={course._id}
            title={course.name}
            subtitle={`${course.degree?.name || 'No degree'} / ${subjectCountByCourse[course._id] || 0} subjects`}
            description={course.description}
            onEdit={() => openEdit('course', course)}
            onDelete={() => remove('course', course)}
          />
        )}
      </Section>

      <Section title="Subjects" icon={<FaBookOpen />} items={subjects} empty="No subjects yet.">
        {(subject) => (
          <CatalogCard
            key={subject._id}
            title={subject.name}
            subtitle={`${subject.course?.degree?.name || ''}${subject.course?.degree?.name ? ' / ' : ''}${subject.course?.name || 'No course'}`}
            description={subject.description}
            color={subject.color}
            onEdit={() => openEdit('subject', subject)}
            onDelete={() => remove('subject', subject)}
          />
        )}
      </Section>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setModal(null)}>
          <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-6 text-xl font-bold text-white">{modal.item ? 'Edit' : 'Add'} {modal.type}</h2>
            <form onSubmit={save} className="space-y-4">
              <Input label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
              {modal.type === 'course' && (
                <Select label="Degree" value={form.degree} onChange={(value) => setForm({ ...form, degree: value })} required>
                  <option value="">Select degree</option>
                  {degrees.map((degree) => <option key={degree._id} value={degree._id}>{degree.name}</option>)}
                </Select>
              )}
              {modal.type === 'subject' && (
                <>
                  <Select label="Course" value={form.course} onChange={(value) => setForm({ ...form, course: value })} required>
                    <option value="">Select course</option>
                    {courses.map((course) => <option key={course._id} value={course._id}>{course.degree?.name} / {course.name}</option>)}
                  </Select>
                  <label className="block">
                    <span className="mb-2 block text-sm text-gray-300">Color</span>
                    <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5" />
                  </label>
                </>
              )}
              <label className="block">
                <span className="mb-2 block text-sm text-gray-300">Description</span>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-primary" />
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="flex-1 rounded-lg bg-white/10 px-4 py-2.5 text-white transition hover:bg-white/20">Cancel</button>
                <button type="submit" className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-white transition hover:bg-accent">Save</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

const ActionButton = ({ onClick, icon, label }) => (
  <button onClick={onClick} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent">
    {icon} {label}
  </button>
);

const Section = ({ title, icon, items, empty, children }) => (
  <section>
    <div className="mb-4 flex items-center gap-2 text-white">
      <span className="text-primary">{icon}</span>
      <h2 className="text-xl font-semibold">{title}</h2>
      <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-gray-300">{items.length}</span>
    </div>
    {items.length ? <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map(children)}</div> : <p className="rounded-xl border border-white/10 bg-white/5 p-6 text-gray-400">{empty}</p>}
  </section>
);

const CatalogCard = ({ title, subtitle, description, color, onEdit, onDelete }) => (
  <div className="glass-card p-5">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h3 className="truncate text-lg font-semibold text-white">{title}</h3>
        <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
        {description && <p className="mt-2 line-clamp-2 text-sm text-gray-400">{description}</p>}
      </div>
      {color && <span className="h-5 w-5 rounded-full border border-white/20" style={{ backgroundColor: color }} />}
    </div>
    <div className="mt-4 flex gap-2 border-t border-white/10 pt-4">
      <button onClick={onEdit} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-gray-300 transition hover:bg-white/10"><FaEdit /> Edit</button>
      <button onClick={onDelete} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger transition hover:bg-danger/20"><FaTrash /> Delete</button>
    </div>
  </div>
);

const Input = ({ label, value, onChange, required }) => (
  <label className="block">
    <span className="mb-2 block text-sm text-gray-300">{label}</span>
    <input value={value} onChange={(e) => onChange(e.target.value)} required={required} className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-primary" />
  </label>
);

const Select = ({ label, value, onChange, required, children }) => (
  <label className="block">
    <span className="mb-2 block text-sm text-gray-300">{label}</span>
    <select value={value} onChange={(e) => onChange(e.target.value)} required={required} className="w-full rounded-lg border border-white/10 bg-[#18181b] px-4 py-2.5 text-white outline-none focus:border-primary">
      {children}
    </select>
  </label>
);

export default Courses;
