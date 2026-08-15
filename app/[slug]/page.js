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
    return <div className="max-w-md mx-auto p-6 text-center text-gray-500">Loading…</div>;
  }

  if (notFound) {
    return (
      <div className="max-w-md mx-auto p-6 text-center text-gray-500">
        This shop doesn&apos;t exist yet.
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <h1 className="text-xl font-bold mb-2">Booked!</h1>
        <p className="text-gray-600 mb-4">{shop.name} will be expecting you.</p>
        <div className="border rounded-xl p-4 text-left text-sm space-y-1">
          <p><span className="text-gray-500">Service:</span> {confirmed.service_name}</p>
          <p><span className="text-gray-500">Date:</span> {confirmed.booking_date}</p>
          <p><span className="text-gray-500">Time:</span> {confirmed.booking_time}</p>
          <p><span className="text-gray-500">Price:</span> {confirmed.price} ₸</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-bold mb-1">{shop.name}</h1>
      <p className="text-gray-500 mb-6 capitalize">{shop.category.replace('_', ' ')}</p>

      {step > 1 && (
        <button onClick={() => setStep(step - 1)} className="text-sm text-gray-500 mb-4">
          ← Back
        </button>
      )}

      {step === 1 && (
        <div>
          <h2 className="font-semibold mb-3">Choose a service</h2>
          {services.length === 0 && <p className="text-gray-500 text-sm">No services listed yet.</p>}
          <div className="space-y-2">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => { setServiceId(s.id); setStep(2); }}
                className="w-full border rounded-xl p-3 text-left flex justify-between items-center"
              >
                <span>
                  {s.name}
                  <span className="text-gray-500 text-sm"> · {s.duration_minutes} min</span>
                </span>
                <span className="font-medium">{s.price} ₸</span>
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
            className="border rounded-lg p-3 w-full mb-4 text-base"
          />
          <button
            disabled={!date}
            onClick={() => setStep(3)}
            className="w-full bg-black text-white rounded-lg py-3 disabled:opacity-30"
          >
            Continue
          </button>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="font-semibold mb-3">Pick a time</h2>
          {availableSlots.length === 0 ? (
            <p className="text-gray-500 text-sm">No times left this day — go back and try another date.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {availableSlots.map((t) => (
                <button
                  key={t}
                  onClick={() => { setTime(t); setStep(4); }}
                  className="border rounded-lg py-2.5 font-mono text-sm"
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
          <p className="text-gray-500 text-sm mb-4">{service?.name} · {date} · {time}</p>
          <input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border rounded-lg p-3 w-full mb-2 text-base"
            autoComplete="name"
          />
          <input
            placeholder="+7 700 000 0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className="border rounded-lg p-3 w-full mb-4 text-base font-mono"
          />
          <label className="flex items-start gap-2 text-xs text-gray-500 mb-4">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              I agree to my name, phone number, and booking details being stored
              to complete this booking. See the{' '}
              <a href="/privacy" target="_blank" className="underline">Privacy Policy</a>.
            </span>
          </label>
          {submitError && <p className="text-red-600 text-sm mb-2">{submitError}</p>}
          <button
            disabled={!name.trim() || phone.trim().length < 6 || !consentGiven || submitting}
            onClick={handleConfirm}
            className="w-full bg-black text-white rounded-lg py-3 disabled:opacity-30"
          >
            {submitting ? 'Booking…' : 'Confirm booking'}
          </button>
        </div>
      )}
    </div>
  );
}
