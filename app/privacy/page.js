export const metadata = {
  title: 'Privacy Policy — Booktau',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-md mx-auto p-6 text-sm leading-relaxed">
      <h1 className="font-display text-xl font-bold mb-1">Privacy Policy</h1>
      <p className="text-ink-soft mb-6">
        Last updated: [DATE — fill in before publishing]
      </p>

      <p className="mb-4">
        This policy explains what personal data [BUSINESS/LEGAL NAME] ("we", "us")
        collects through this booking service, why, and what rights you have over
        it. It applies to both shop owners using this service to manage their
        business and customers booking appointments through it.
      </p>

      <h2 className="font-display font-semibold mt-6 mb-2">1. What we collect</h2>
      <p className="mb-2"><strong>If you create a shop (owner):</strong></p>
      <ul className="list-disc pl-5 mb-4 space-y-1">
        <li>Email address and password (password is never stored in readable form)</li>
        <li>Shop name, category, working hours, services, and prices you enter</li>
      </ul>
      <p className="mb-2"><strong>If you book an appointment (customer):</strong></p>
      <ul className="list-disc pl-5 mb-4 space-y-1">
        <li>Name and phone number</li>
        <li>The service, date, and time you booked</li>
      </ul>

      <h2 className="font-display font-semibold mt-6 mb-2">2. Why we collect it</h2>
      <p className="mb-4">
        Solely to operate the booking service: to create and manage appointments,
        let a shop owner see and manage their own shop's bookings, and — once
        enabled — to send booking confirmations. We do not use this data for
        advertising, and we do not sell it to third parties.
      </p>

      <h2 className="font-display font-semibold mt-6 mb-2">3. Your consent</h2>
      <p className="mb-4">
        By creating a shop or booking an appointment, you consent to the
        collection and use of the data described above for that purpose. You can
        withdraw consent at any time by requesting deletion of your data (see
        section 6).
      </p>

      <h2 className="font-display font-semibold mt-6 mb-2">4. Where data is stored</h2>
      <p className="mb-4">
        Data is currently stored using Supabase, a third-party database provider.
        <strong> [PLACEHOLDER — confirm and state the actual hosting region here
        once decided; this is a legal question, not just a technical one — see the
        note your developer/AI assistant gave you about Kazakhstan's data
        residency requirements before finalizing this section.]</strong>
      </p>

      <h2 className="font-display font-semibold mt-6 mb-2">5. Who has access</h2>
      <p className="mb-4">
        A shop owner can see the bookings, names, and phone numbers of customers
        who booked with their shop only — not any other shop's data. [BUSINESS
        NAME] staff may access data as needed for support and maintenance of the
        service.
      </p>

      <h2 className="font-display font-semibold mt-6 mb-2">6. Your rights</h2>
      <p className="mb-4">
        You can request access to, correction of, or deletion of your personal
        data by contacting us at [CONTACT EMAIL]. We will respond within
        [PLACEHOLDER — set a response timeframe].
      </p>

      <h2 className="font-display font-semibold mt-6 mb-2">7. Data breaches</h2>
      <p className="mb-4">
        If a security incident affecting your personal data occurs, we will
        notify affected users and comply with applicable legal notification
        requirements. [PLACEHOLDER — confirm the specific notification process
        and timeline with legal counsel.]
      </p>

      <h2 className="font-display font-semibold mt-6 mb-2">8. Changes to this policy</h2>
      <p className="mb-4">
        We may update this policy as the service changes. Material changes will
        be reflected here with an updated date at the top of this page.
      </p>

      <h2 className="font-display font-semibold mt-6 mb-2">9. Contact</h2>
      <p className="mb-4">
        Questions about this policy or your data: [CONTACT EMAIL].
      </p>

      <p className="text-xs text-ink-soft/70 mt-8">
        This is a starting draft, not a substitute for legal review. Every
        [PLACEHOLDER] above needs a real answer before this should be treated as
        your actual policy — particularly section 4, given Kazakhstan's data
        residency requirements.
      </p>
    </div>
  );
}
