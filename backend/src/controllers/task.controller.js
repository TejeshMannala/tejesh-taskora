import Task from '../models/task.model.js';

export const getTasks = async (req, res) => {
  try {
    const { status, priority, subject, date, search, page = 1, limit = 20 } = req.query;
    const query = { user: req.user._id };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (subject) query.subject = subject;
    if (date) {
      const d = new Date(date);
      query.date = { $gte: new Date(d.setHours(0,0,0,0)), $lte: new Date(d.setHours(23,59,59,999)) };
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }

    const tasks = await Task.find(query)
      .sort({ date: -1, priority: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(query);

    res.json({ success: true, tasks, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTask = async (req, res) => {
  try {
    const { title, subject, category, durationMinutes, priority, date, dueDate, reminders, reminderEnabled, notes } = req.body;
    const task = await Task.create({
      user: req.user._id, title, subject, category, durationMinutes, priority, date, dueDate,
      reminders, reminderEnabled, notes,
      completed: false,
    });
    res.status(201).json({ success: true, task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    let task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const { completed, ...updateData } = req.body;
    if (completed === true) {
      updateData.completed = true;
      updateData.completedAt = new Date();
      updateData.alarmTriggered = false;
      updateData.alarmActive = false;
      updateData.status = 'Completed';
    }

    task = await Task.findByIdAndUpdate(req.params.id, updateData, { returnDocument: 'after', runValidators: true });
    res.json({ success: true, task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const wasCompleted = task.status === 'Completed';
    task.status = wasCompleted ? 'Pending' : 'Completed';
    task.completed = !wasCompleted;
    task.completedAt = wasCompleted ? null : new Date();
    if (!wasCompleted) {
      task.alarmTriggered = false;
      task.alarmActive = false;
    }
    await task.save();

    res.json({ success: true, task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTaskStats = async (req, res) => {
  try {
    const stats = await Task.aggregate([
      { $match: { user: req.user._id } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalDuration: { $sum: '$durationMinutes' },
      }},
    ]);

    const total = stats.reduce((acc, s) => acc + s.count, 0);
    const completed = stats.find(s => s._id === 'Completed')?.count || 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    res.json({ success: true, stats, total, completed, completionRate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
