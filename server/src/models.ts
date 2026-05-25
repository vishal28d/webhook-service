import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  url: string;
  secret?: string;
  eventTypes: string[]; // e.g., ["user.created", "order.*"]
  createdAt: Date;
}

const SubscriptionSchema = new Schema({
  url: { type: String, required: true },
  secret: { type: String, required: false },
  eventTypes: { type: [String], required: true },
  createdAt: { type: Date, default: Date.now }
});

export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);

export interface IEvent extends Document {
  type: string;
  payload: any;
  createdAt: Date;
}

const EventSchema = new Schema({
  type: { type: String, required: true, index: true },
  payload: { type: Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const WebhookEvent = mongoose.model<IEvent>('Event', EventSchema);

export interface IDelivery extends Document {
  eventId: mongoose.Types.ObjectId;
  subscriptionId: mongoose.Types.ObjectId;
  status: 'pending' | 'success' | 'failed';
  attempts: number;
  nextAttemptAt?: Date;
  lastResponseCode?: number;
  lastResponseBody?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DeliverySchema = new Schema({
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription', required: true },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending', index: true },
  attempts: { type: Number, default: 0 },
  nextAttemptAt: { type: Date, default: Date.now, index: true },
  lastResponseCode: { type: Number },
  lastResponseBody: { type: String },
}, { timestamps: true });

export const Delivery = mongoose.model<IDelivery>('Delivery', DeliverySchema);
