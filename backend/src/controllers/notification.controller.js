import Notification from '../models/notification.model.js';

export const getNotifications = async (req, res) => {
  try {
    const { read, type, page = 1, limit = 20 } = req.query;
    const query = { user: req.user._id };
    if (read !== undefined) query.read = read === 'true';
    if (type) query.type = type;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });

    res.json({ success: true, notifications, total, unreadCount, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { returnDocument: 'after' }
    );
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, notification });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ user: req.user._id, read: false });
    res.json({ success: true, count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
