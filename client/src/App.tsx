import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useLocation } from 'react-router-dom';

const API_BASE = '/api';

function Subscriptions() {
  const [subs, setSubs] = useState<any[]>([]);
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [eventTypes, setEventTypes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/subscriptions`)
      .then(res => res.json())
      .then(setSubs)
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await fetch(`${API_BASE}/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        secret,
        eventTypes: eventTypes.split(',').map(s => s.trim())
      })
    });
    if (res.ok) {
      const newSub = await res.json();
      setSubs([newSub, ...subs]);
      setUrl('');
      setSecret('');
      setEventTypes('');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Subscriptions</h2>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/50">
          <h3 className="text-base font-semibold leading-6 text-gray-900">Add New Subscription</h3>
          <p className="mt-1 text-sm text-gray-500">Register a new webhook endpoint to receive real-time events.</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            <div className="md:col-span-4">
              <label htmlFor="url" className="block text-sm font-medium leading-6 text-gray-900">Target URL</label>
              <div className="mt-2">
                <input
                  type="url"
                  id="url"
                  className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all"
                  placeholder="https://your-api.com/webhook"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="secret" className="block text-sm font-medium leading-6 text-gray-900">Secret <span className="text-gray-400 font-normal">(Optional)</span></label>
              <div className="mt-2">
                <input
                  type="text"
                  id="secret"
                  className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all"
                  placeholder="Your signing secret"
                  value={secret}
                  onChange={e => setSecret(e.target.value)}
                />
              </div>
            </div>

            <div className="md:col-span-6">
              <label htmlFor="events" className="block text-sm font-medium leading-6 text-gray-900">Event Types</label>
              <div className="mt-2">
                <input
                  type="text"
                  id="events"
                  className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all"
                  placeholder="e.g. user.*, order.created"
                  value={eventTypes}
                  onChange={e => setEventTypes(e.target.value)}
                  required
                />
              </div>
              <p className="mt-2 text-sm text-gray-500" id="events-description">Separate multiple events with a comma.</p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Subscription'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">URL</th>
                <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Event Types</th>
                <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {subs.map(sub => (
                <tr key={sub._id} className="hover:bg-gray-50 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{sub.url}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex flex-wrap gap-2">
                      {sub.eventTypes.map((t: string) => (
                        <span key={t} className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{new Date(sub.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {subs.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-sm text-gray-500">No subscriptions found. Create one above!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Events() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/events`)
      .then(res => res.json())
      .then(setEvents)
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Recent Events</h2>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Event Type</th>
                <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Created At</th>
                <th scope="col" className="px-6 py-3.5 text-right text-sm font-semibold text-gray-900">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {events.map(event => (
                <tr key={event._id} className="hover:bg-gray-50 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                      {event.type}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{new Date(event.createdAt).toLocaleString()}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-right">
                    <Link to={`/events/${event._id}`} className="text-blue-600 hover:text-blue-900 font-medium transition-colors">
                      View Deliveries
                    </Link>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-sm text-gray-500">No events found in the system yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EventDetails() {
  const { id } = useParams();
  const [deliveries, setDeliveries] = useState<any[]>([]);

  const fetchDeliveries = () => {
    fetch(`${API_BASE}/events/${id}/deliveries`)
      .then(res => res.json())
      .then(setDeliveries)
      .catch(console.error);
  };

  useEffect(() => {
    fetchDeliveries();
  }, [id]);

  const handleRetry = async (deliveryId: string) => {
    const res = await fetch(`${API_BASE}/deliveries/${deliveryId}/retry`, { method: 'POST' });
    if (res.ok) {
      fetchDeliveries();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Link to="/events" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-4">
          <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Events
        </Link>
        <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Delivery Attempts</h2>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Subscriber URL</th>
                <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Attempts</th>
                <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Response</th>
                <th scope="col" className="px-6 py-3.5 text-right text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {deliveries.map(del => (
                <tr key={del._id} className="hover:bg-gray-50 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{del.subscriptionId?.url || 'Unknown'}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${del.status === 'success' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                      del.status === 'failed' ? 'bg-red-50 text-red-700 ring-red-600/10' :
                        'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                      }`}>
                      {del.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {del.attempts} / 5
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-sm truncate">
                    {del.lastResponseCode ? <span className="font-mono bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs mr-2 border border-gray-200">[{del.lastResponseCode}]</span> : null}
                    {del.lastResponseBody || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-right">
                    {del.status === 'failed' && (
                      <button onClick={() => handleRetry(del._id)} className="text-blue-600 hover:text-blue-900 font-medium transition-colors">
                        Retry
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {deliveries.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">No deliveries found for this event.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-blue-100">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <h1 className="text-xl font-bold tracking-tight text-gray-900">WebhookHub</h1>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                <Link
                  to="/"
                  className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors ${location.pathname === '/'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                >
                  Subscriptions
                </Link>
                <Link
                  to="/events"
                  className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors ${location.pathname === '/events' || location.pathname.startsWith('/events/')
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                >
                  Events
                </Link>
              </div>
            </div>

            {/* Mobile nav simple setup */}
            <div className="flex items-center sm:hidden gap-4">
              <Link to="/" className={`text-sm font-medium ${location.pathname === '/' ? 'text-blue-600' : 'text-gray-500'}`}>Subs</Link>
              <Link to="/events" className={`text-sm font-medium ${location.pathname.startsWith('/events') ? 'text-blue-600' : 'text-gray-500'}`}>Events</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        <Routes>
          <Route path="/" element={<Subscriptions />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetails />} />
        </Routes>
      </main>
    </div>
  );
}

// Wrapper to provide useLocation context correctly
export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}
