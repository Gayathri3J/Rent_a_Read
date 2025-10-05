import mongoose from 'mongoose';

const adminLogSchema = mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'users',
    },
    action: { type: String, required: true },
    details: { type: mongoose.Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

const AdminLog = mongoose.model('AdminLog', adminLogSchema);

export default AdminLog;
