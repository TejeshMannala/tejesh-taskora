import cron from 'node-cron';
import Task from '../models/task.model.js';
import Notification from '../models/notification.model.js';
import AlarmHistory from '../models/alarmHistory.model.js';
import { getIO } from '../sockets/index.js';

// Run every minute to check for tasks that need reminders
export const startReminderCron = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      // Find tasks with reminders enabled that are due
      const tasks = await Task.find({
        'reminders.enabled': true,
        status: { $ne: 'Completed' },
        date: { $lte: now },
      });

      for (const task of tasks) {
        const existingReminder = await Notification.findOne({
          user: task.user,
          'metadata.taskId': task._id,
          type: 'reminder',
          createdAt: { $gte: fiveMinutesAgo },
        });

        if (!existingReminder) {
          await Notification.create({
            user: task.user,
            title: 'Task Reminder',
            message: `Don't forget: "${task.title}" is still pending!`,
            type: 'reminder',
            priority: 'high',
            link: '/tasks',
            metadata: { taskId: task._id },
          });
        }
      }
    } catch (error) {
      console.error('Reminder cron error:', error.message);
    }
  });

  // Overdue alarm checker - every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      const overdueTasks = await Task.find({
        completed: false,
        reminderEnabled: true,
        dueDate: { $lte: now, $ne: null },
        $or: [
          { alarmTriggered: false },
          { alarmTriggered: { $exists: false } },
        ],
      }).populate('user', 'name email');

      const io = getIO();

      for (const task of overdueTasks) {
        task.alarmTriggered = true;
        task.alarmActive = true;
        task.alarmStartedAt = now;
        await task.save();

        await AlarmHistory.create({
          user: task.user._id,
          task: task._id,
          triggeredAt: now,
        });

        if (io) {
          io.to(task.user._id.toString()).emit('alarm:triggered', {
            taskId: task._id,
            title: task.title,
            dueDate: task.dueDate,
            alarmStartedAt: now,
            priority: task.priority,
          });
        }

        await Notification.create({
          user: task.user._id,
          title: '⚠️ Task Overdue!',
          message: `"${task.title}" is overdue. Please complete immediately!`,
          type: 'reminder',
          priority: 'critical',
          link: '/tasks',
          metadata: { taskId: task._id, alarmTriggered: true },
        });
      }
    } catch (error) {
      console.error('Alarm cron error:', error.message);
    }
  });

  // Re-alarm checker - every minute for already triggered alarms (keep reminding)
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      const activeAlarms = await Task.find({
        completed: false,
        alarmTriggered: true,
        dueDate: { $lte: now, $ne: null },
      });

      const io = getIO();

      for (const task of activeAlarms) {
        if (io) {
          const overdueMs = now - new Date(task.dueDate);
          const overdueMinutes = Math.floor(overdueMs / 60000);
          const overdueHours = Math.floor(overdueMinutes / 60);
          const overdueMins = overdueMinutes % 60;

          io.to(task.user.toString()).emit('alarm:persistent', {
            taskId: task._id,
            title: task.title,
            dueDate: task.dueDate,
            overdue: `${overdueHours > 0 ? `${overdueHours}h ` : ''}${overdueMins}m`,
            priority: task.priority,
          });
        }
      }
    } catch (error) {
      console.error('Re-alarm cron error:', error.message);
    }
  });

  // Midnight cron to update streaks
  cron.schedule('0 0 * * *', async () => {
    try {
      const { default: User } = await import('../models/user.model.js');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(23, 59, 59, 999);

      const users = await User.find({ lastActive: { $lt: yesterday } });
      for (const user of users) {
        user.studyStreak = 0;
        await user.save();
      }
    } catch (error) {
      console.error('Streak reset cron error:', error.message);
    }
  });

  console.log('Reminder and alarm cron jobs started');
};
