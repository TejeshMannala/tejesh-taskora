import Task from '../models/task.model.js';
import Subject from '../models/subject.model.js';
import Event from '../models/event.model.js';
import Schedule from '../models/schedule.model.js';

export const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ success: true, results: [] });

    const regex = new RegExp(q, 'i');

    const [tasks, subjects, events, schedules] = await Promise.all([
      Task.find({ user: req.user._id, title: regex }).select('title subject status priority date').limit(5),
      Subject.find({ user: req.user._id, name: regex }).select('name color icon').limit(5),
      Event.find({ user: req.user._id, title: regex }).select('title type startDate color').limit(5),
      Schedule.find({ user: req.user._id }).populate({ path: 'tasks', match: { title: regex }, select: 'title' }).limit(5),
    ]);

    const results = [
      ...tasks.map(t => ({ id: t._id, type: 'task', title: t.title, subtitle: t.subject || t.status, link: '/tasks', meta: t.priority })),
      ...subjects.map(s => ({ id: s._id, type: 'subject', title: s.name, subtitle: 'Subject', link: '/subjects', color: s.color })),
      ...events.map(e => ({ id: e._id, type: 'event', title: e.title, subtitle: e.type, link: '/calendar', color: e.color })),
    ];

    res.json({ success: true, results, total: results.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
