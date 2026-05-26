import React, { useState, useEffect } from 'react';

const API_BASE = '/api';

export default function Subscriptions() {
  const [subs, setSubs] = useState<any[]>([]);
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [eventTypes, setEventTypes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/subscriptions`)
      .then(res => res.json())
      .then(setSubs)
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          secret: secret || undefined,
          eventTypes: eventTypes.split(',').map(s => s.trim()).filter(Boolean)
        })
      });
      if (res.ok) {
        const newSub = await res.json();
        setSubs([newSub, ...subs]);
        setUrl('');
        setSecret('');
        setEventTypes('');
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to create subscription');
      }
    } catch {
      setError('Network error — could not reach the server.');
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
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 ring-1 ring-inset ring-red-600/10">
              {error}
            </div>
          )}
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
