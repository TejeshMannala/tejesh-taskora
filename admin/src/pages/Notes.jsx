import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaEdit, FaTrash, FaStickyNote, FaDownload, FaTag, FaFilePdf } from 'react-icons/fa';
import { adminApi } from '../services/adminApi';
import toast from 'react-hot-toast';

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editNote, setEditNote] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', courseId: '', groupId: '', subjectId: '',
    semester: '', tags: '', file: null,
  });
  const [selectedCourseForGroup, setSelectedCourseForGroup] = useState('');

  const load = async () => {
    try {
      const [nData, cData] = await Promise.all([adminApi.getNotes(), adminApi.getCourses()]);
      setNotes(nData.notes);
      setCourses(cData.courses);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (form.courseId || selectedCourseForGroup) {
      const courseId = form.courseId || selectedCourseForGroup;
      adminApi.getGroups(courseId).then((d) => setGroups(d.groups)).catch(() => {});
    } else {
      setGroups([]);
    }
  }, [form.courseId, selectedCourseForGroup]);

  useEffect(() => {
    if (form.groupId) {
      adminApi.getSubjects({ groupId: form.groupId }).then((d) => setSubjects(d.subjects)).catch(() => {});
    } else {
      setSubjects([]);
    }
  }, [form.groupId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description || '');
      fd.append('courseId', form.courseId);
      fd.append('groupId', form.groupId);
      fd.append('subjectId', form.subjectId);
      fd.append('semester', form.semester);
      fd.append('tags', form.tags ? form.tags.split(',').map(t => t.trim()) : []);
      if (form.file) fd.append('file', form.file);

      if (editNote) {
        await adminApi.updateNote(editNote._id, fd);
        toast.success('Note updated');
      } else {
        await adminApi.createNote(fd);
        toast.success('Note created');
      }
      setShowModal(false);
      setEditNote(null);
      setForm({ title: '', description: '', courseId: '', groupId: '', subjectId: '', semester: '', tags: '', file: null });
      setSelectedCourseForGroup('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this note?')) return;
    try { await adminApi.deleteNote(id); toast.success('Note deleted'); load(); } catch { toast.error('Delete failed'); }
  };

  const openEdit = (note) => {
    setEditNote(note);
    setForm({
      title: note.title,
      description: note.description || '',
      courseId: note.courseId?._id || '',
      groupId: note.groupId?._id || '',
      subjectId: note.subjectId?._id || '',
      semester: note.semester || '',
      tags: (note.tags || []).join(', '),
      file: null,
    });
    setSelectedCourseForGroup(note.courseId?._id || '');
    setShowModal(true);
  };

  if (loading) return <div className="text-white p-8">Loading...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Notes</h1>
          <p className="text-gray-400 mt-1">Manage study notes per course, group, and subject</p>
        </div>
        <button onClick={() => {
          setEditNote(null);
          setForm({ title: '', description: '', courseId: '', groupId: '', subjectId: '', semester: '', tags: '', file: null });
          setSelectedCourseForGroup('');
          setShowModal(true);
        }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-accent text-white transition-all"
        ><FaPlus /> Add Note</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes.map((note) => (
          <motion.div key={note._id} whileHover={{ y: -2 }} className="glass-card p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-secondary/20 text-secondary"><FaStickyNote size={20} /></div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-lg truncate">{note.title}</h3>
                <p className="text-gray-500 text-xs">
                  {note.courseId?.name} / {note.groupId?.name} / {note.subjectId?.name}
                </p>
                <p className="text-gray-500 text-xs">Semester {note.semester}</p>
              </div>
            </div>
            {note.description && (
              <p className="text-gray-400 text-sm mt-3 line-clamp-2">{note.description}</p>
            )}
            {note.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {note.tags.map((tag, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full bg-white/5 text-gray-400 text-xs flex items-center gap-1">
                    <FaTag size={8} /> {tag}
                  </span>
                ))}
              </div>
            )}
            {note.fileUrl && (
              <a href={note.fileUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 mt-3 text-sm text-primary hover:text-accent transition-colors"
              ><FaFilePdf /> <FaDownload /> View File</a>
            )}
            <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
              <button onClick={() => openEdit(note)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-all text-sm"
              ><FaEdit /> Edit</button>
              <button onClick={() => handleDelete(note._id)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-danger/10 hover:bg-danger/20 text-danger transition-all text-sm"
              ><FaTrash /> Delete</button>
            </div>
          </motion.div>
        ))}
      </div>

      {notes.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <FaStickyNote className="text-5xl text-gray-600 mx-auto mb-4" />
          <p>No notes yet. Create your first note!</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-6">{editNote ? 'Edit Note' : 'Add Note'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Note Title *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary" required />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Course *</label>
                <select value={form.courseId} onChange={(e) => setForm({...form, courseId: e.target.value, groupId: '', subjectId: ''})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary" required>
                  <option value="">Select course</option>
                  {courses.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Group *</label>
                <select value={form.groupId} onChange={(e) => setForm({...form, groupId: e.target.value, subjectId: ''})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary" required disabled={!form.courseId}>
                  <option value="">Select group</option>
                  {groups.map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Subject *</label>
                <select value={form.subjectId} onChange={(e) => setForm({...form, subjectId: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary" required disabled={!form.groupId}>
                  <option value="">Select subject</option>
                  {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Semester *</label>
                <input type="number" min={1} max={8} value={form.semester} onChange={(e) => setForm({...form, semester: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary" required />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary" rows={3} />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Tags (comma separated)</label>
                <input type="text" value={form.tags} onChange={(e) => setForm({...form, tags: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                  placeholder="java, collections, framework" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">PDF / File</label>
                <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={(e) => setForm({...form, file: e.target.files[0]})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-white file:text-xs" />
                {editNote?.fileUrl && <p className="text-xs text-gray-500 mt-1">Current file: {editNote.fileUrl}</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all">Cancel</button>
                <button type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary hover:bg-accent text-white transition-all">{editNote ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Notes;
