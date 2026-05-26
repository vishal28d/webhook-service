import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './App.css';
import Subscriptions from './components/Subscriptions';
import Events from './components/Events';
import EventDetails from './components/EventDetails';

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

            {/* Mobile nav */}
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
