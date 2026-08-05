const mongoose = require('mongoose');

const WebhookEventSchema = new mongoose.Schema({
  endpointId: { type: mongoose.Schema.Types.ObjectId, ref: 'WebhookEndpoint', index: true },
  headers: { type: Object },
  body: { type: Object },
  receivedAt: { type: Date, default: Date.now },
  dateIST: { type: String },
});

WebhookEventSchema.index({ receivedAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

module.exports = mongoose.model('WebhookEvent', WebhookEventSchema);