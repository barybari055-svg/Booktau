'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

const supabase = createClient();

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      router.push('/dashboard');
    } catch {
      setError('Something went wrong — check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="font-display text-xl font-bold mb-6">Log in</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border border-line rounded-lg p-3 w-full text-base bg-paper focus:outline-none focus:ring-2 focus:ring-brass/40 focus:border-brass"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border border-line rounded-lg p-3 w-full text-base bg-paper focus:outline-none focus:ring-2 focus:ring-brass/40 focus:border-brass"
        />
        <p className="text-right">
          <a href="/forgot-password" className="text-sm text-ink-soft underline">Forgot password?</a>
        </p>
        {error && <p className="text-rust text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ink text-paper rounded-xl py-3 font-medium hover:bg-brass-dark transition-colors disabled:opacity-30 disabled:hover:bg-ink"
        >
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="text-sm text-ink-soft mt-4 text-center">
        No shop yet? <a href="/signup" className="underline text-brass-dark">Create one</a>
      </p>
    </div>
  );
}
