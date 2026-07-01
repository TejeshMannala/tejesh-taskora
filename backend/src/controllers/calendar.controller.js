import Event from '../models/event.model.js';
import Task from '../models/task.model.js';
import Schedule from '../models/schedule.model.js';

export const getEvents = async (req, res) => {
  try {
    const { start, end, type } = req.query;
    const query = { user: req.user._id };

    if (start && end) {
      query.$or = [
        { startDate: { $gte: new Date(start), $lte: new Date(end) } },
        { endDate: { $gte: new Date(start), $lte: new Date(end) } },
      ];
    }
    if (type) query.type = type;

    const events = await Event.find(query).sort({ startDate: 1 });
    res.json({ success: true, events });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createEvent = async (req, res) => {
  try {
    const { title, description, type, startDate, endDate, allDay, color } = req.body;
    const event = await Event.create({ user: req.user._id, title, description, type, startDate, endDate, allDay, color });
    res.status(201).json({ success: true, event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    let event = await Event.findOne({ _id: req.params.id, user: req.user._id });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    event = await Event.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.json({ success: true, event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, message: 'Event deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getConsolidatedCalendar = async (req, res) => {
  try {
    const { start, end } = req.query;
    const dateQuery = start && end ? { date: { $gte: new Date(start), $lte: new Date(end) } } : {};

    const events = await Event.find({ user: req.user._id, ...dateQuery }).sort({ startDate: 1 });
    const tasks = await Task.find({ user: req.user._id, ...dateQuery }).sort({ date: 1, priority: -1 });
    const schedules = await Schedule.find({ user: req.user._id, ...dateQuery }).populate('tasks').sort({ date: 1 });

    res.json({ success: true, events, tasks, schedules });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
