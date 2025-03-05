const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true, // User ID for who the notification is intended for
  },
  consultantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'consultant', // Consultant ID for notifications related to consultant activities
    required: true,
  },
  notificationType: {
    type: String,
    enum: ['booking', 'cancel', 'wallet_add', 'complete'], // Notification types
    required: true,
  },
  message: {
    type: String,
    required: true, // Message for the notification
  },
  isRead: {
    type: Boolean,
    default: false, // Track whether the notification has been read
  },
  createdAt: {
    type: Date,
    default: Date.now, // Automatically set the timestamp
  },
});

module.exports = mongoose.model('Notification', notificationSchema);
