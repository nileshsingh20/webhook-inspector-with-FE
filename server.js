require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const WebhookEvent = require('./models/WebhookEvent');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

function getISTDateString(date = new Date()) {
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffsetMs);
  return istDate.toISOString().split('T')[0];
}


app.post('/webhook', async (req, res) => {
  try {
    const now = new Date();
    const event = new WebhookEvent({
      headers: req.headers,
      body: req.body,
      receivedAt: now,
      dateIST: getISTDateString(now),
    });
    await event.save();
    console.log('Webhook saved:', event._id);
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Error saving webhook:', err);
    res.status(500).json({ error: 'Failed to save event' });
  }
});

app.get('/api/events', async (req, res) => {
  try {
    const { date, search } = req.query;
    let events = await WebhookEvent.find(date ? { dateIST: date } : {})
      .sort({ receivedAt: -1 })
      .limit(300);

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
    const dates = await WebhookEvent.distinct('dateIST');
    res.json(dates.sort().reverse());
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dates' });
  }
});

app.get('/', (req, res) => {
  res.send('Webhook API is running. POST to /webhook, or use the frontend dashboard.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));