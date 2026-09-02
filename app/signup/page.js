'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import { createShopForOwner } from '../../lib/shop';

const supabase = createClient();

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [category, setCategory] = useState('barbershop');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) {
        setError(authError.message);
        return;
      }

      // Supabase deliberately does NOT return an error for an email that's
      // already registered (with "Confirm email" on, which is the default) --
      // it returns a fake-looking success response instead, to stop attackers
      // probing which emails exist. Without this check, that person would see
      // "Check your email" and wait forever for a confirmation link that's
      // never actually sent. identities staying empty is the one reliable
      // way to tell a real new signup from this obfuscated one -- documented
      // Supabase behavior, not a guess.
      if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
        setError('An account with this email already exists. Try logging in, or use "Forgot password" if you need to reset it.');
        return;
      }

      if (!authData.session) {
        // Supabase project has "confirm email" on — no active session until they click the link.
        // Their account exists but has no shop yet; logging in after confirming will
        // land them on the dashboard's own "finish setting up" step.
        setNeedsConfirm(true);
        return;
      }

      const { error: shopError } = await createShopForOwner({ name: shopName, category });
      if (shopError) {
        // Their account exists either way — send them to log in, where the dashboard
        // will offer to finish shop setup instead of a dead end.
        setError('Account created, but the shop didn\u2019t save. Log in and you can finish setting it up there.');
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Something went wrong — check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  if (needsConfirm) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <h1 className="font-display text-xl font-bold mb-2">Check your email</h1>
        <p className="text-ink-soft">
          We sent a confirmation link to {email}. Click it, then{' '}
          <a href="/login" className="underline text-brass-dark">log in</a> to finish setting up your shop.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="font-display text-xl font-bold mb-1">Create your shop</h1>
      <p className="text-ink-soft mb-6">Takes about 2 minutes.</p>
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
          minLength={6}
          className="border border-line rounded-lg p-3 w-full text-base bg-paper focus:outline-none focus:ring-2 focus:ring-brass/40 focus:border-brass"
        />
        <input
          type="text"
          placeholder="Shop name"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          required
          className="border border-line rounded-lg p-3 w-full text-base bg-paper focus:outline-none focus:ring-2 focus:ring-brass/40 focus:border-brass"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-line rounded-lg p-3 w-full text-base bg-paper focus:outline-none focus:ring-2 focus:ring-brass/40 focus:border-brass"
        >
          <option value="barbershop">Barbershop</option>
          <option value="beauty_salon">Beauty Salon</option>
          <option value="nail_studio">Nail Studio</option>
          <option value="massage_spa">Massage &amp; Spa</option>
          <option value="tutor">Tutor</option>
          <option value="photographer">Photographer</option>
          <option value="other">Other</option>
        </select>
        <label className="flex items-start gap-2 text-xs text-ink-soft">
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
            required
            className="mt-0.5 accent-brass"
          />
          <span>
            I agree to my account and shop data being stored to provide this
            service. See the{' '}
            <a href="/privacy" target="_blank" className="underline">Privacy Policy</a>.
          </span>
        </label>
        {error && <p className="text-rust text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading || !consentGiven}
          className="w-full bg-ink text-paper rounded-xl py-3 font-medium hover:bg-brass-dark transition-colors disabled:opacity-30 disabled:hover:bg-ink"
        >
          {loading ? 'Creating…' : 'Create shop'}
        </button>
      </form>
      <p className="text-sm text-ink-soft mt-4 text-center">
        Already have a shop? <a href="/login" className="underline text-brass-dark">Log in</a>
      </p>
    </div>
  );
}
