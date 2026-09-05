'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    // No monitoring service wired up yet -- this is the hook point for one
    // later. For now, at least it's visible in server/browser logs instead
    // of silently vanishing.
    console.error('Unhandled error:', error);
  }, [error]);

  return (
    <div className="max-w-md mx-auto p-6 text-center">
      <h1 className="font-display text-xl font-bold mb-2">Something went wrong</h1>
      <p className="text-ink-soft text-sm mb-6">
        That's on us, not something you did. Try again, or come back in a moment.
      </p>
      <button
        onClick={() => reset()}
        className="bg-ink text-paper rounded-lg px-4 py-2 text-sm font-medium hover:bg-brass-dark transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
