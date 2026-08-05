const mongoose = require('mongoose');

const WebhookEndpointSchema = new mongoose.Schema({
  label: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('WebhookEndpoint', WebhookEndpointSchema);