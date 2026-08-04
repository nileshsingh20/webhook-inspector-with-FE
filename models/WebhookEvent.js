const mongoose = require('mongoose');

const WebhookEventSchema = new mongoose.Schema({
  headers: { type: Object },
  body: { type: Object },
  receivedAt: { type: Date, default: Date.now }, // used for TTL expiry
  dateIST: { type: String }, // e.g. "2026-08-04" — for grouping/filtering
});

// TTL index: MongoDB automatically deletes documents 7 days after receivedAt.
// The background TTL sweep runs roughly every 60s, so deletion isn't instant
// to the second, but documents are reliably removed shortly after 7 days.
WebhookEventSchema.index({ receivedAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

module.exports = mongoose.model('WebhookEvent', WebhookEventSchema);
