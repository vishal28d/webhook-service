import { Delivery, WebhookEvent, Subscription } from './models';
import axios from 'axios';
import crypto from 'crypto';

const MAX_ATTEMPTS = 5;
const BASE_BACKOFF_MS = 1000;
const POLL_INTERVAL_MS = 2000;

export function startWorker() {
  console.log('Starting webhook delivery worker...');
  
  // Start the polling loop
  setInterval(processDeliveries, POLL_INTERVAL_MS);
}

async function processDeliveries() {
  try {
    // Find deliveries that are pending and due
    const dueDeliveries = await Delivery.find({
      status: 'pending',
      nextAttemptAt: { $lte: new Date() }
    }).limit(50); // Process in batches

    if (dueDeliveries.length === 0) return;

    console.log(`Processing ${dueDeliveries.length} due deliveries...`);

    for (const delivery of dueDeliveries) {
      await attemptDelivery(delivery);
    }
  } catch (err) {
    console.error('Error in processDeliveries loop:', err);
  }
}

function generateSignature(payloadStr: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
}

async function attemptDelivery(delivery: any) {
  try {
    const event = await WebhookEvent.findById(delivery.eventId);
    const sub = await Subscription.findById(delivery.subscriptionId);

    if (!event || !sub) {
      console.error(`Missing event or sub for delivery ${delivery._id}`);
      delivery.status = 'failed';
      await delivery.save();
      return;
    }

    delivery.attempts += 1;
    
    const payloadStr = JSON.stringify(event.payload);
    const headers: any = {
      'Content-Type': 'application/json'
    };

    if (sub.secret) {
      headers['X-Webhook-Signature'] = generateSignature(payloadStr, sub.secret);
    }

    const start = Date.now();
    try {
      const response = await axios.post(sub.url, event.payload, {
        headers,
        timeout: 5000 // 5 second timeout
      });

      // Success
      delivery.status = 'success';
      delivery.lastResponseCode = response.status;
      delivery.lastResponseBody = typeof response.data === 'string' ? response.data.slice(0, 500) : JSON.stringify(response.data).slice(0, 500);
      
    } catch (httpErr: any) {
      // Failure
      delivery.lastResponseCode = httpErr.response?.status || 0;
      delivery.lastResponseBody = httpErr.message;
      
      if (delivery.attempts >= MAX_ATTEMPTS) {
        delivery.status = 'failed';
      } else {
        // Calculate next backoff with jitter
        // Exponential backoff: base * 2^(attempt-1) + jitter
        const backoff = BASE_BACKOFF_MS * Math.pow(2, delivery.attempts - 1);
        const jitter = Math.floor(Math.random() * 1000);
        delivery.nextAttemptAt = new Date(Date.now() + backoff + jitter);
        delivery.status = 'pending';
      }
    }

    await delivery.save();
    console.log(`Delivery ${delivery._id} attempt ${delivery.attempts} -> ${delivery.status}`);
  } catch (err) {
    console.error(`Error attempting delivery ${delivery._id}:`, err);
  }
}
