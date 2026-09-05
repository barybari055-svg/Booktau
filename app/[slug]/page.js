'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import { getAvailableSlots, localDateStr } from '../../lib/availability';
import { bookingErrorMessage } from '../../lib/booking-errors';

const supabase = createClient();

export default function BookingPage() {
  const { slug } = useParams();

  const [shop, setShop] = useState(null);
  const [hours, setHours] = useState([]);
  const [services, setServices] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [confirmed, setConfirmed] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    async function load() {
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (shopError || !shopData) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setShop(shopData);

      const [hoursRes, servicesRes, blockedRes, bookingsRes] = await Promise.all([
        supabase.from('shop_hours').select('*').eq('shop_id', shopData.id),
        supabase.from('services').select('*').eq('shop_id', shopData.id),
        supabase.from('blocked_dates').select('date').eq('shop_id', shopData.id),
        supabase.rpc('get_shop_booking_slots', { p_shop_id: shopData.id }),
      ]);

      setHours(hoursRes.data || []);
      setServices(servicesRes.data || []);
      setBlockedDates((blockedRes.data || []).map((b) => b.date));
      setBookings(bookingsRes.data || []);
      setLoading(false);
    }
    load();
  }, [slug]);

  const service = services.find((s) => s.id === serviceId);

  const availableSlots = useMemo(() => {
    if (!date || !service) return [];
    if (blockedDates.includes(date)) return [];
    return getAvailableSlots({
      hours,
      existingBookings: bookings,
      dateStr: date,
      durationMinutes: service.duration_minutes,
    });
  }, [date, service, hours, bookings, blockedDates]);

  async function handleConfirm() {
    setSubmitting(true);
    setSubmitError('');
    const { data, error } = await supabase.rpc('create_booking', {
      p_shop_id: shop.id,
      p_service_id: service.id,
      p_booking_date: date,
      p_booking_time: time,
      p_customer_name: name.trim(),
      p_customer_phone: phone.trim(),
    });
    setSubmitting(false);
    if (error) {
      setSubmitError(bookingErrorMessage(error));
      return;
    }
    setConfirmed(data);
    setBookings((prev) => [...prev, {
      booking_date: data.booking_date,
      booking_time: data.booking_time,
      duration_minutes: data.duration_minutes,
    }]);
  }

  if (loading) {
    return <div className="max-w-md mx-auto p-6 text-center text-ink-soft">Loading…</div>;
  }

  if (notFound) {
    return (
      <div className="max-w-md mx-auto p-6 text-center text-ink-soft">
        This shop doesn&apos;t exist yet.
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="max-w-md mx-auto min-h-screen flex flex-col justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-moss/10 border border-moss/30 flex items-center justify-center mx-auto mb-4">
          <span className="text-moss text-xl">✓</span>
        </div>
        <h1 className="font-display text-2xl font-bold mb-1">Booked</h1>
        <p className="text-ink-soft mb-6">{shop.name} will be expecting you.</p>
        <div className="border border-line rounded-2xl p-5 text-left bg-paper-dim">
          <div className="space-y-2.5 font-mono text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-ink-soft font-sans">Service</span>
              <span className="text-right">{confirmed.service_name}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-ink-soft font-sans">Date</span>
              <span>{confirmed.booking_date}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-ink-soft font-sans">Time</span>
              <span>{confirmed.booking_time}</span>
            </div>
            <div className="border-t border-dashed border-line my-2" />
            <div className="flex justify-between gap-2 font-medium">
              <span className="text-ink-soft font-sans">Price</span>
              <span>{confirmed.price} ₸</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="font-display text-xl font-bold mb-1">{shop.name}</h1>
      <p className="text-ink-soft mb-6 capitalize text-sm">{shop.category.replace('_', ' ')}</p>

      <div className="flex gap-1.5 mb-6">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className={`h-1 flex-1 rounded-full ${n <= step ? 'bg-brass' : 'bg-line'}`} />
        ))}
      </div>

      {step > 1 && (
        <button onClick={() => setStep(step - 1)} className="text-sm text-ink-soft mb-4 hover:text-ink transition-colors">
          ← Back
        </button>
      )}

      {step === 1 && (
        <div>
          <h2 className="font-semibold mb-3">Choose a service</h2>
          {services.length === 0 && <p className="text-ink-soft text-sm">No services listed yet.</p>}
          <div className="space-y-2">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => { setServiceId(s.id); setStep(2); }}
                className="w-full border border-line rounded-xl p-3 text-left flex justify-between items-center hover:border-brass transition-colors"
              >
                <span>
                  {s.name}
                  <span className="text-ink-soft text-sm"> · {s.duration_minutes} min</span>
                </span>
                <span className="font-mono font-medium text-brass-dark">{s.price} ₸</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="font-semibold mb-3">Pick a date</h2>
          <input
            type="date"
            value={date}
            min={localDateStr(new Date())}
            onChange={(e) => setDate(e.target.value)}
            className="border border-line rounded-lg p-3 w-full mb-4 text-base bg-paper focus:outline-none focus:ring-2 focus:ring-brass/40 focus:border-brass"
          />
          <button
            disabled={!date}
            onClick={() => setStep(3)}
            className="w-full bg-ink text-paper rounded-xl py-3 font-medium hover:bg-brass-dark transition-colors disabled:opacity-30 disabled:hover:bg-ink"
          >
            Continue
          </button>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="font-semibold mb-3">Pick a time</h2>
          {availableSlots.length === 0 ? (
            <p className="text-ink-soft text-sm">No times left this day — go back and try another date.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {availableSlots.map((t) => (
                <button
                  key={t}
                  onClick={() => { setTime(t); setStep(4); }}
                  className="border border-line rounded-lg py-3 font-mono text-sm hover:border-brass hover:bg-brass/5 transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 4 && (
        <div>
          <h2 className="font-semibold mb-3">Your details</h2>
          <p className="text-ink-soft text-sm mb-4">{service?.name} · {date} · {time}</p>
          <input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-line rounded-lg p-3 w-full mb-2 text-base bg-paper focus:outline-none focus:ring-2 focus:ring-brass/40 focus:border-brass"
            autoComplete="name"
          />
          <input
            placeholder="+7 700 000 0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className="border border-line rounded-lg p-3 w-full mb-4 text-base font-mono bg-paper focus:outline-none focus:ring-2 focus:ring-brass/40 focus:border-brass"
          />
          <label className="flex items-start gap-2 text-xs text-ink-soft mb-4">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="mt-0.5 accent-brass"
            />
            <span>
              I agree to my name, phone number, and booking details being stored
              to complete this booking. See the{' '}
              <a href="/privacy" target="_blank" className="underline">Privacy Policy</a>.
            </span>
          </label>
          {submitError && <p className="text-rust text-sm mb-2">{submitError}</p>}
          <button
            disabled={!name.trim() || phone.trim().length < 6 || !consentGiven || submitting}
            onClick={handleConfirm}
            className="w-full bg-ink text-paper rounded-xl py-3 font-medium hover:bg-brass-dark transition-colors disabled:opacity-30 disabled:hover:bg-ink"
          >
            {submitting ? 'Booking…' : 'Confirm booking'}
          </button>
        </div>
      )}
    </div>
  );
}
