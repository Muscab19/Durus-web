import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <h1 className="text-4xl font-bold text-primary-500">404</h1>
      <p className="mt-2 text-gray-600">Page not found.</p>
      <Link
        to="/"
        className="mt-6 inline-block px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600"
      >
        Back home
      </Link>
    </div>
  );
}