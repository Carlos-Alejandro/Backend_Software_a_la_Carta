const AdminAudit = require('../models/adminAudit.model');
const logger = require('../utils/logger');

async function logAdminAction({ action, resource, actorId, targetId, before, after, ip, userAgent, reqId }) {
  try {
    await AdminAudit.create({ action, resource, actorId, targetId, before, after, ip, userAgent, reqId });
  } catch (e) {
    logger.warn('audit_write_failed', { action, resource, targetId, err: e.message, reqId });
  }
}

module.exports = { logAdminAction };
