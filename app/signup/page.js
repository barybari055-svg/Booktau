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

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!authData.session) {
      // Supabase project has "confirm email" on — no active session until they click the link.
      // Their account exists but has no shop yet; logging in after confirming will
      // land them on the dashboard's own "finish setting up" step.
      setNeedsConfirm(true);
      setLoading(false);
      return;
    }

    const { error: shopError } = await createShopForOwner(authData.user.id, { name: shopName, category });
    setLoading(false);

    if (shopError) {
      // Their account exists either way — send them to log in, where the dashboard
      // will offer to finish shop setup instead of a dead end.
      setError('Account created, but the shop didn\u2019t save. Log in and you can finish setting it up there.');
      return;
    }

    router.push('/dashboard');
  }

  if (needsConfirm) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <h1 className="text-xl font-bold mb-2">Check your email</h1>
        <p className="text-gray-600">
          We sent a confirmation link to {email}. Click it, then{' '}
          <a href="/login" className="underline">log in</a> to finish setting up your shop.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-bold mb-1">Create your shop</h1>
      <p className="text-gray-500 mb-6">Takes about 2 minutes.</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border rounded-lg p-3 w-full text-base"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="border rounded-lg p-3 w-full text-base"
        />
        <input
          type="text"
          placeholder="Shop name"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          required
          className="border rounded-lg p-3 w-full text-base"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border rounded-lg p-3 w-full text-base"
        >
          <option value="barbershop">Barbershop</option>
          <option value="beauty_salon">Beauty Salon</option>
          <option value="nail_studio">Nail Studio</option>
          <option value="massage_spa">Massage &amp; Spa</option>
          <option value="tutor">Tutor</option>
          <option value="photographer">Photographer</option>
          <option value="other">Other</option>
        </select>
        <label className="flex items-start gap-2 text-xs text-gray-500">
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
            required
            className="mt-0.5"
          />
          <span>
            I agree to my account and shop data being stored to provide this
            service. See the{' '}
            <a href="/privacy" target="_blank" className="underline">Privacy Policy</a>.
          </span>
        </label>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading || !consentGiven}
          className="w-full bg-black text-white rounded-lg py-3 disabled:opacity-30"
        >
          {loading ? 'Creating…' : 'Create shop'}
        </button>
      </form>
      <p className="text-sm text-gray-500 mt-4 text-center">
        Already have a shop? <a href="/login" className="underline">Log in</a>
      </p>
    </div>
  );
}
