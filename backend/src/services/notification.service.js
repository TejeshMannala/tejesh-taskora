import Notification from '../models/notification.model.js';

let io = null;

export const setSocketIO = (socketIO) => {
  io = socketIO;
};

export const createNotification = async ({ userId, title, message, type, priority, link, metadata }) => {
  try {
    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type: type || 'system',
      priority: priority || 'medium',
      link,
      metadata,
    });

    if (io) {
      io.to(userId.toString()).emit('notification', notification);
    }

    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
};

export const notifyAchievement = async (userId, achievement) => {
  return createNotification({
    userId,
    title: 'Achievement Unlocked!',
    message: `You earned "${achievement.name}" - ${achievement.description}`,
    type: 'achievement',
    priority: 'high',
    metadata: { achievementId: achievement._id, icon: achievement.icon },
  });
};

export const notifyTaskReminder = async (userId, task) => {
  return createNotification({
    userId,
    title: 'Task Reminder',
    message: `Don't forget to complete: "${task.title}"`,
    type: 'reminder',
    priority: 'high',
    link: '/tasks',
    metadata: { taskId: task._id },
  });
};

export const notifyScheduleUpdate = async (userId, schedule) => {
  return createNotification({
    userId,
    title: 'Schedule Update',
    message: 'Your study schedule has been updated.',
    type: 'schedule',
    priority: 'medium',
    link: '/tasks',
  });
};

export const notifyExamAlert = async (userId, exam) => {
  return createNotification({
    userId,
    title: 'Exam Alert',
    message: `${exam.title} is coming up! Start preparing.`,
    type: 'exam',
    priority: 'critical',
    link: '/reminders',
    metadata: { examId: exam._id },
  });
};
