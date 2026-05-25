import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { Subscription, WebhookEvent, Delivery } from './models';
import { startWorker } from './worker';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/webhook_db';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    startWorker(); // Start the delivery worker
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// --- API ROUTES ---

// Create a subscription
app.post('/api/subscriptions', async (req, res) => {
  try {
    const { url, secret, eventTypes } = req.body;
    const sub = new Subscription({ url, secret, eventTypes });
    await sub.save();
    res.status(201).json(sub);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create subscription', details: err });
  }
});

// List subscriptions
app.get('/api/subscriptions', async (req, res) => {
  try {
    const subs = await Subscription.find().sort({ createdAt: -1 });
    res.json(subs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// Simple regex matching for event types (e.g. user.* matches user.created)
const matchesFilter = (eventType: string, filter: string) => {
  if (filter === '*' || filter === eventType) return true;
  if (filter.endsWith('.*')) {
    const prefix = filter.slice(0, -2);
    return eventType.startsWith(prefix);
  }
  return false;
};

// Ingest an event
app.post('/api/events', async (req, res) => {
  try {
    const { type, payload } = req.body;
    
    // Save event
    const event = new WebhookEvent({ type, payload });
    await event.save();

    // Fan-out: find matching subscriptions
    const allSubs = await Subscription.find();
    const matchingSubs = allSubs.filter(sub => 
      sub.eventTypes.some(filter => matchesFilter(type, filter))
    );

    // Create pending deliveries
    const deliveries = matchingSubs.map(sub => ({
      eventId: event._id,
      subscriptionId: sub._id,
      status: 'pending',
      attempts: 0,
      nextAttemptAt: new Date()
    }));

    if (deliveries.length > 0) {
      await Delivery.insertMany(deliveries);
    }

    res.status(202).json({ message: 'Event accepted', eventId: event._id, deliveriesCreated: deliveries.length });
  } catch (err) {
    res.status(400).json({ error: 'Failed to ingest event', details: err });
  }
});

// List recent events
app.get('/api/events', async (req, res) => {
  try {
    const events = await WebhookEvent.find().sort({ createdAt: -1 }).limit(100);
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get deliveries for an event
app.get('/api/events/:eventId/deliveries', async (req, res) => {
  try {
    const deliveries = await Delivery.find({ eventId: req.params.eventId }).populate('subscriptionId');
    res.json(deliveries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch deliveries' });
  }
});

// Manual retry of a delivery
app.post('/api/deliveries/:id/retry', async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });

    delivery.status = 'pending';
    delivery.nextAttemptAt = new Date();
    // we don't reset attempts, just schedule immediately
    await delivery.save();
    
    res.json({ message: 'Delivery queued for retry', delivery });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retry delivery' });
  }
});

// Serve frontend in production
app.use(express.static(path.join(__dirname, '../../client/dist')));
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
