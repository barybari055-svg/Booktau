'use client';

import { useState } from 'react';
import { createClient } from '../../lib/supabase/client';

const supabase = createClient();

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setSent(true);
    } catch {
      setError('Something went wrong — check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto p-6">
        <h1 className="font-display text-xl font-bold mb-2">Check your email</h1>
        <p className="text-ink-soft text-sm">
          If an account exists for {email}, a password reset link is on its way.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="font-display text-xl font-bold mb-2">Reset your password</h1>
      <p className="text-ink-soft text-sm mb-6">
        Enter your email and we'll send you a link to set a new password.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border border-line rounded-lg p-3 w-full text-base bg-paper focus:outline-none focus:ring-2 focus:ring-brass/40 focus:border-brass"
        />
        {error && <p className="text-rust text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ink text-paper rounded-xl py-3 font-medium hover:bg-brass-dark transition-colors disabled:opacity-30 disabled:hover:bg-ink"
        >
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
      <p className="text-sm text-ink-soft mt-4 text-center">
        <a href="/login" className="underline text-brass-dark">Back to log in</a>
      </p>
    </div>
  );
}
