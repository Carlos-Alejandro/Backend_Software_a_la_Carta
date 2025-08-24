const mongoose = require('mongoose');

const adminAuditSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },         // 'user.role.changed' | 'order.status.changed'
    resource: { type: String, required: true },       // 'user' | 'order'
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    before: { type: mongoose.Schema.Types.Mixed, default: null },
    after: { type: mongoose.Schema.Types.Mixed, default: null },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
    reqId: { type: String, default: null },
  },
  { timestamps: { createdAt: 'at', updatedAt: false }, minimize: true }
);

adminAuditSchema.index({ at: -1 });
adminAuditSchema.index({ resource: 1, targetId: 1, at: -1 });
adminAuditSchema.index({ actorId: 1, at: -1 });

module.exports = mongoose.model('AdminAudit', adminAuditSchema, 'admin_audit');
