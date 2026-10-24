import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      required: true,
      trim: true
    },
    room: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    time: {
      type: String,
      required: true
    },
    isSystem: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Optional: Auto-expire messages after 30 days to prevent database bloat
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

export const Message = mongoose.model('Message', messageSchema);
