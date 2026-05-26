import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = '/api';

export default function Events() {
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
