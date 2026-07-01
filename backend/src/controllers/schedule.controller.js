import Schedule from '../models/schedule.model.js';
import Task from '../models/task.model.js';

export const getSchedules = async (req, res) => {
  try {
    const { type, date } = req.query;
    const query = { user: req.user._id };
    if (type) query.type = type;
    if (date) {
      const d = new Date(date);
      query.date = { $gte: new Date(d.setHours(0,0,0,0)), $lte: new Date(d.setHours(23,59,59,999)) };
    }

    const schedules = await Schedule.find(query).populate('tasks').sort({ date: -1 });
    res.json({ success: true, schedules });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSchedule = async (req, res) => {
  try {
    const { type, date, tasks } = req.body;
    const schedule = await Schedule.create({ user: req.user._id, type, date, tasks });
    const populated = await schedule.populate('tasks');
    res.status(201).json({ success: true, schedule: populated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSchedule = async (req, res) => {
  try {
    let schedule = await Schedule.findOne({ _id: req.params.id, user: req.user._id });
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });

    schedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' }).populate('tasks');
    res.json({ success: true, schedule });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
    res.json({ success: true, message: 'Schedule deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTodaySchedule = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const schedules = await Schedule.find({
      user: req.user._id,
      date: { $gte: today, $lt: tomorrow },
    }).populate('tasks');

    const tasks = await Task.find({
      user: req.user._id,
      date: { $gte: today, $lt: tomorrow },
    }).sort({ priority: -1, createdAt: -1 });

    res.json({ success: true, schedules, tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getWeeklySchedule = async (req, res) => {
  try {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const schedules = await Schedule.find({
      user: req.user._id,
      date: { $gte: startOfWeek, $lt: endOfWeek },
    }).populate('tasks').sort({ date: 1 });

    const tasks = await Task.find({
      user: req.user._id,
      date: { $gte: startOfWeek, $lt: endOfWeek },
    }).sort({ date: 1, priority: -1 });

    res.json({ success: true, schedules, tasks, startOfWeek, endOfWeek });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
