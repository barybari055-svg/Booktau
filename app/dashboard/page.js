'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import { createShopForOwner } from '../../lib/shop';
import { localDateStr } from '../../lib/availability';

const supabase = createClient();

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };

function BookingRow({ booking, onCancel }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="border rounded-xl p-3 text-sm">
      <div className="flex justify-between">
        <div>
          <p className="font-medium">{booking.customer_name}</p>
          <p className="text-gray-500">{booking.service_name} · {booking.customer_phone}</p>
        </div>
        <div className="text-right font-mono">
          <p>{booking.booking_date}</p>
          <p>{booking.booking_time}</p>
        </div>
      </div>
      {confirming ? (
        <div className="flex gap-2 mt-2">
          <button onClick={onCancel} className="flex-1 bg-red-600 text-white rounded-lg py-1.5 text-xs font-medium">
            Yes, cancel
          </button>
          <button onClick={() => setConfirming(false)} className="flex-1 text-gray-500 text-xs">
            Keep it
          </button>
        </div>
      ) : (
        <button onClick={() => setConfirming(true)} className="text-red-600 text-xs underline mt-2">
          Cancel booking
        </button>
      )}
    </div>
  );
}

// Shown when someone is logged in but has no shop yet — either a first sign-up
// that never made it past the account step, or a shop-creation failure that left
// them stuck otherwise. Fixes the dead end where /dashboard used to bounce them
// to /signup, which rejects an already-registered email.
function FinishSetup({ userId, onDone }) {
  const [shopName, setShopName] = useState('');
  const [category, setCategory] = useState('barbershop');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { shop, error: shopError } = await createShopForOwner({ name: shopName, category });
    setLoading(false);
    if (shopError) {
      setError('Could not save your shop: ' + shopError.message);
      return;
    }
    onDone(shop);
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-bold mb-1">Finish setting up</h1>
      <p className="text-gray-500 mb-6">Your account exists — just needs a shop attached to it.</p>
      <form onSubmit={handleSubmit} className="space-y-3">
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
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white rounded-lg py-3 disabled:opacity-30"
        >
          {loading ? 'Creating…' : 'Create shop'}
        </button>
      </form>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [shop, setShop] = useState(null);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [hours, setHours] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('30');
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [origin, setOrigin] = useState('');

  async function loadShopData(shopData) {
    setShop(shopData);
    const [servicesRes, bookingsRes, hoursRes, blockedRes] = await Promise.all([
      supabase.from('services').select('*').eq('shop_id', shopData.id),
      supabase
        .from('bookings')
        .select('*')
        .eq('shop_id', shopData.id)
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true }),
      supabase.from('shop_hours').select('*').eq('shop_id', shopData.id),
      supabase.from('blocked_dates').select('*').eq('shop_id', shopData.id).order('date', { ascending: true }),
    ]);
    setServices(servicesRes.data || []);
    setBookings(bookingsRes.data || []);
    setHours(hoursRes.data || []);
    setBlockedDates(blockedRes.data || []);
    setNeedsSetup(false);
    setLoading(false);
  }

  useEffect(() => {
    setOrigin(window.location.origin);

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

      const { data: shopData } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (!shopData) {
        setNeedsSetup(true);
        setLoading(false);
        return;
      }

      await loadShopData(shopData);
    }
    load();
  }, [router]);

  async function addService(e) {
    e.preventDefault();
    if (!newServiceName.trim() || !newServicePrice) return;
    const { data, error } = await supabase
      .from('services')
      .insert({
        shop_id: shop.id,
        name: newServiceName.trim(),
        price: Number(newServicePrice),
        duration_minutes: Number(newServiceDuration),
      })
      .select()
      .single();
    if (!error) {
      setServices((prev) => [...prev, data]);
      setNewServiceName('');
      setNewServicePrice('');
      setNewServiceDuration('30');
    }
  }

  async function removeService(id) {
    await supabase.from('services').delete().eq('id', id);
    setServices((prev) => prev.filter((s) => s.id !== id));
  }

  async function cancelBooking(id) {
    await supabase.from('bookings').delete().eq('id', id);
    setBookings((prev) => prev.filter((b) => b.id !== id));
  }

  async function updateHour(dayKey, patch) {
    const existing = hours.find((h) => h.day_key === dayKey);
    if (!existing) return;
    setHours((prev) => prev.map((h) => (h.day_key === dayKey ? { ...h, ...patch } : h)));
    const { error } = await supabase.from('shop_hours').update(patch).eq('id', existing.id);
    if (error) {
      setHours((prev) => prev.map((h) => (h.day_key === dayKey ? existing : h)));
    }
  }

  const [repairingHours, setRepairingHours] = useState(false);

  // Recovery path for a shop that ended up with zero hours rows -- possible
  // for any shop created before create_shop_with_defaults() existed. Every
  // day would otherwise show as permanently closed with no way to fix it.
  async function repairMissingHours() {
    setRepairingHours(true);
    const { data, error } = await supabase.rpc('add_default_hours_if_missing', { p_shop_id: shop.id });
    setRepairingHours(false);
    if (!error && data) {
      setHours(data);
    }
  }

  async function addBlockedDate() {
    if (!newBlockedDate) return;
    const { data, error } = await supabase
      .from('blocked_dates')
      .insert({ shop_id: shop.id, date: newBlockedDate })
      .select()
      .single();
    if (!error) {
      setBlockedDates((prev) => [...prev, data].sort((a, b) => a.date.localeCompare(b.date)));
      setNewBlockedDate('');
    }
  }

  async function removeBlockedDate(id) {
    await supabase.from('blocked_dates').delete().eq('id', id);
    setBlockedDates((prev) => prev.filter((b) => b.id !== id));
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (loading) {
    return <div className="max-w-md mx-auto p-6 text-center text-gray-500">Loading…</div>;
  }

  if (needsSetup) {
    return <FinishSetup userId={userId} onDone={loadShopData} />;
  }

  const today = localDateStr(new Date());
  const upcoming = bookings.filter((b) => b.booking_date >= today);

  return (
    <div className="max-w-md mx-auto p-6 pb-16">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold">{shop.name}</h1>
          <p className="text-gray-500 text-sm capitalize">{shop.category.replace('_', ' ')}</p>
        </div>
        <button onClick={handleSignOut} className="text-sm text-gray-500 underline">
          Sign out
        </button>
      </div>

      <div className="bg-gray-50 border rounded-xl p-3 mb-6">
        <p className="text-sm text-gray-500 mb-1">Your booking link</p>
        <p className="font-mono text-sm break-all">{origin}/{shop.slug}</p>
      </div>

      <h2 className="font-semibold mb-3">Upcoming bookings</h2>
      {upcoming.length === 0 ? (
        <p className="text-gray-500 text-sm mb-6">No bookings yet.</p>
      ) : (
        <div className="space-y-2 mb-6">
          {upcoming.map((b) => (
            <BookingRow key={b.id} booking={b} onCancel={() => cancelBooking(b.id)} />
          ))}
        </div>
      )}

      <h2 className="font-semibold mb-3">Services</h2>
      <div className="space-y-2 mb-3">
        {services.map((s) => (
          <div key={s.id} className="border rounded-xl p-3 flex justify-between items-center text-sm">
            <span>{s.name} · {s.duration_minutes} min · {s.price} ₸</span>
            <button onClick={() => removeService(s.id)} className="text-red-600 text-xs underline shrink-0 ml-2">
              Remove
            </button>
          </div>
        ))}
      </div>
      <form onSubmit={addService} className="border rounded-xl p-3 space-y-2 mb-6">
        <input
          placeholder="Service name"
          value={newServiceName}
          onChange={(e) => setNewServiceName(e.target.value)}
          className="border rounded-lg p-2 w-full text-sm"
        />
        <div className="flex gap-2">
          <input
            placeholder="Price ₸"
            type="number"
            value={newServicePrice}
            onChange={(e) => setNewServicePrice(e.target.value)}
            className="border rounded-lg p-2 w-full text-sm"
          />
          <input
            placeholder="Minutes"
            type="number"
            value={newServiceDuration}
            onChange={(e) => setNewServiceDuration(e.target.value)}
            className="border rounded-lg p-2 w-full text-sm"
          />
        </div>
        <button type="submit" className="w-full bg-black text-white rounded-lg py-2 text-sm">
          Add service
        </button>
      </form>

      <h2 className="font-semibold mb-3">Working hours</h2>
      {hours.length === 0 ? (
        <div className="border rounded-xl p-4 mb-6 text-sm">
          <p className="text-gray-500 mb-3">
            Working hours aren't set up yet, so every day currently shows as closed
            to customers.
          </p>
          <button
            onClick={repairMissingHours}
            disabled={repairingHours}
            className="bg-black text-white rounded-lg px-4 py-2 text-sm disabled:opacity-30"
          >
            {repairingHours ? 'Setting up…' : 'Set up default hours'}
          </button>
        </div>
      ) : (
      <div className="border rounded-xl divide-y mb-6">
        {DAY_KEYS.map((dayKey) => {
          const h = hours.find((x) => x.day_key === dayKey);
          if (!h) return null;
          return (
            <div key={dayKey} className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{DAY_LABELS[dayKey]}</span>
                <button
                  onClick={() => updateHour(dayKey, { closed: !h.closed })}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    h.closed ? 'bg-gray-200 text-gray-500' : 'bg-green-100 text-green-700'
                  }`}
                >
                  {h.closed ? 'Closed' : 'Open'}
                </button>
              </div>
              {!h.closed && (
                <>
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <input
                      type="time"
                      value={h.open_time || ''}
                      onChange={(e) => updateHour(dayKey, { open_time: e.target.value })}
                      className="border rounded-lg p-2 flex-1 min-w-0 text-base"
                    />
                    <span className="text-gray-400">–</span>
                    <input
                      type="time"
                      value={h.close_time || ''}
                      onChange={(e) => updateHour(dayKey, { close_time: e.target.value })}
                      className="border rounded-lg p-2 flex-1 min-w-0 text-base"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-gray-500">
                    <input
                      type="checkbox"
                      checked={!!h.lunch_start}
                      onChange={(e) =>
                        updateHour(
                          dayKey,
                          e.target.checked
                            ? { lunch_start: '13:00', lunch_end: '14:00' }
                            : { lunch_start: null, lunch_end: null }
                        )
                      }
                    />
                    Lunch break{h.lunch_start ? ` · ${h.lunch_start}–${h.lunch_end}` : ''}
                  </label>
                </>
              )}
            </div>
          );
        })}
      </div>
      )}

      <h2 className="font-semibold mb-3">Days off</h2>
      <div className="space-y-2 mb-3">
        {blockedDates.length === 0 && <p className="text-gray-500 text-sm">No days blocked.</p>}
        {blockedDates.map((b) => (
          <div key={b.id} className="border rounded-xl p-3 flex justify-between items-center text-sm">
            <span className="font-mono">{b.date}</span>
            <button onClick={() => removeBlockedDate(b.id)} className="text-red-600 text-xs underline">
              Remove
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="date"
          value={newBlockedDate}
          onChange={(e) => setNewBlockedDate(e.target.value)}
          className="border rounded-lg p-2 flex-1 min-w-0 text-base"
        />
        <button onClick={addBlockedDate} className="bg-black text-white rounded-lg px-4 text-sm shrink-0">
          Block
        </button>
      </div>
    </div>
  );
}
