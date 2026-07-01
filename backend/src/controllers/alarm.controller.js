import Task from '../models/task.model.js';
import AlarmHistory from '../models/alarmHistory.model.js';
import { getIO } from '../sockets/index.js';

export const getActiveAlarms = async (req, res) => {
  try {
    const alarms = await Task.find({
      user: req.user._id,
      completed: false,
      dueDate: { $lte: new Date() },
      alarmTriggered: true,
    }).sort({ dueDate: 1 });

    res.json({ success: true, alarms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const acknowledgeAlarm = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findOne({ _id: taskId, user: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    await AlarmHistory.findOneAndUpdate(
      { user: req.user._id, task: taskId, acknowledgedAt: null },
      { acknowledgedAt: new Date() },
    );

    res.json({ success: true, message: 'Alarm acknowledged' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const completeTaskAndStopAlarm = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findOne({ _id: taskId, user: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    task.completed = true;
    task.completedAt = new Date();
    task.status = 'Completed';
    task.alarmTriggered = false;
    task.alarmActive = false;
    await task.save();

    await AlarmHistory.findOneAndUpdate(
      { user: req.user._id, task: taskId, resolvedAt: null },
      { resolvedAt: new Date() },
    );

    const io = getIO();
    if (io) {
      io.to(req.user._id.toString()).emit('alarm:stopped', { taskId, task });
    }

    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAlarmState = async (req, res) => {
  try {
    const activeAlarms = await Task.find({
      user: req.user._id,
      completed: false,
      alarmTriggered: true,
      dueDate: { $lte: new Date() },
    }).sort({ dueDate: 1 });

    res.json({ success: true, alarms: activeAlarms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAlarmHistory = async (req, res) => {
  try {
    const history = await AlarmHistory.find({ user: req.user._id })
      .populate('task', 'title dueDate')
      .sort({ triggeredAt: -1 })
      .limit(50);

    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
