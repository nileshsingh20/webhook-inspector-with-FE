require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const WebhookEvent = require('./models/WebhookEvent');
const WebhookEndpoint = require('./models/WebhookEndpoint');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

const MAX_ENDPOINTS = 10;

function getISTDateString(date = new Date()) {
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffsetMs);
  return istDate.toISOString().split('T')[0];
}




app.get('/api/endpoints', async (req, res) => {
  try {
    const endpoints = await WebhookEndpoint.find().sort({ createdAt: 1 });
    const counts = await WebhookEvent.aggregate([
      { $group: { _id: '$endpointId', count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));

    res.json(endpoints.map((e) => ({
      _id: e._id,
      label: e.label,
      createdAt: e.createdAt,
      eventCount: countMap[String(e._id)] || 0,
    })));
  } catch (err) {
    console.error('Error fetching endpoints:', err);
    res.status(500).json({ error: 'Failed to fetch endpoints' });
  }
});



app.post('/api/endpoints', async (req, res) => {
  try {
    const count = await WebhookEndpoint.countDocuments();
    if (count >= MAX_ENDPOINTS) {
      return res.status(400).json({ error: `Maximum of ${MAX_ENDPOINTS} webhook URLs reached. Delete one first.` });
    }
    const { label } = req.body;
    const endpoint = await WebhookEndpoint.create({ label: label || `Webhook ${count + 1}` });
    res.status(201).json(endpoint);
  } catch (err) {
    console.error('Error creating endpoint:', err);
    res.status(500).json({ error: 'Failed to create endpoint' });
  }
});



app.delete('/api/endpoints/:id', async (req, res) => {
  try {
    await WebhookEndpoint.findByIdAndDelete(req.params.id);
    await WebhookEvent.deleteMany({ endpointId: req.params.id });
    res.json({ deleted: true });
  } catch (err) {
    console.error('Error deleting endpoint:', err);
    res.status(500).json({ error: 'Failed to delete endpoint' });
  }
});



app.post('/webhook/:endpointId', async (req, res) => {
  try {
    const { endpointId } = req.params;
    const endpoint = await WebhookEndpoint.findById(endpointId).catch(() => null);
    if (!endpoint) {
      return res.status(404).json({ error: 'Unknown webhook URL' });
    }

    const now = new Date();
    const event = new WebhookEvent({
      endpointId,
      headers: req.headers,
      body: req.body,
      receivedAt: now,
      dateIST: getISTDateString(now),
    });
    await event.save();
    console.log(`Webhook saved for endpoint ${endpointId}:`, event._id);
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Error saving webhook:', err);
    res.status(500).json({ error: 'Failed to save event' });
  }
});



app.get('/api/events', async (req, res) => {
  try {
    const { date, search, eventType, endpointId } = req.query;
    const query = {};
    if (date) query.dateIST = date;
    if (eventType) query['body.event'] = eventType;
    if (endpointId) query.endpointId = endpointId;

    let events = await WebhookEvent.find(query).sort({ receivedAt: -1 }).limit(300);

    if (search) {
      const term = search.toLowerCase();
      events = events.filter((e) =>
        JSON.stringify(e.body).toLowerCase().includes(term)
      );
    }

    res.json(events);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});



app.get('/api/dates', async (req, res) => {
  try {
    const { endpointId } = req.query;
    const dates = await WebhookEvent.distinct('dateIST', endpointId ? { endpointId } : {});
    res.json(dates.sort().reverse());
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dates' });
  }
});



app.get('/api/event-types', async (req, res) => {
  try {
    const { endpointId } = req.query;
    const types = await WebhookEvent.distinct('body.event', endpointId ? { endpointId } : {});
    res.json(types.filter(Boolean).sort());
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch event types' });
  }
});



app.delete('/api/events', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array required' });
    }
    const result = await WebhookEvent.deleteMany({ _id: { $in: ids } });
    res.json({ deletedCount: result.deletedCount });
  } catch (err) {
    console.error('Error deleting events:', err);
    res.status(500).json({ error: 'Failed to delete events' });
  }
});



app.delete('/api/events/all', async (req, res) => {
  try {
    const { endpointId } = req.query;
    const result = await WebhookEvent.deleteMany(endpointId ? { endpointId } : {});
    res.json({ deletedCount: result.deletedCount });
  } catch (err) {
    console.error('Error clearing events:', err);
    res.status(500).json({ error: 'Failed to clear events' });
  }
});

app.get('/', (req, res) => {
  res.send('Webhook API is running. Generate a webhook URL from the dashboard, or POST to /webhook/:endpointId.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));