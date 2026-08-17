'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

const supabase = createClient();

export default function ResetPasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // A valid password-reset link briefly signs the visitor in and fires
    // this specific event -- that's how we know this is a real recovery
    // visit, not just someone landing on this URL some other way.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
        setChecking(false);
      }
    });

    // Fallback in case the event already fired before this listener
    // attached (e.g. a very fast page load).
    const timeout = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setReady(true);
      setChecking(false);
    }, 2000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.push('/dashboard');
  }

  if (checking) {
    return (
      <div className="max-w-md mx-auto p-6">
        <p className="text-gray-500 text-sm">Verifying your reset link…</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-xl font-bold mb-2">Link expired or invalid</h1>
        <p className="text-gray-500 text-sm mb-4">
          This password reset link is no longer valid — links expire after a while
          and only work once.
        </p>
        <a href="/forgot-password" className="underline text-sm">Request a new link</a>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-bold mb-6">Set a new password</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border rounded-lg p-3 w-full text-base"
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="border rounded-lg p-3 w-full text-base"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white rounded-lg py-3 disabled:opacity-30"
        >
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}
