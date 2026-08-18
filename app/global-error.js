'use client';

import { useEffect } from 'react';
import './globals.css';

// Only fires if the root layout itself throws -- rare, but without this the
// fallback is Next's raw unstyled crash screen instead of something a real
// customer or shop owner could make sense of. Has to render its own
// <html>/<body> and import globals.css directly: this file replaces the
// root layout when it's active, so it doesn't inherit either from it.
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Unhandled root error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="max-w-md mx-auto p-6 text-center">
          <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
          <p className="text-gray-500 text-sm mb-6">
            That's on us, not something you did. Try refreshing the page.
          </p>
          <button
            onClick={() => reset()}
            className="bg-black text-white rounded-lg px-4 py-2 text-sm"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
