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
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-xl font-bold mb-2">Check your email</h1>
        <p className="text-gray-500 text-sm">
          If an account exists for {email}, a password reset link is on its way.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-bold mb-2">Reset your password</h1>
      <p className="text-gray-500 text-sm mb-6">
        Enter your email and we'll send you a link to set a new password.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border rounded-lg p-3 w-full text-base"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white rounded-lg py-3 disabled:opacity-30"
        >
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
      <p className="text-sm text-gray-500 mt-4 text-center">
        <a href="/login" className="underline">Back to log in</a>
      </p>
    </div>
  );
}
