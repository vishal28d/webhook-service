import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

const API_BASE = '/api';

export default function EventDetails() {
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
