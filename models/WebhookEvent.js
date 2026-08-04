const mongoose = require('mongoose');

const WebhookEventSchema = new mongoose.Schema({
  headers: { type: Object },
  body: { type: Object },
  receivedAt: { type: Date, default: Date.now },
  dateIST: { type: String }, 
});

WebhookEventSchema.index({ receivedAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

module.exports = mongoose.model('WebhookEvent', WebhookEventSchema);
