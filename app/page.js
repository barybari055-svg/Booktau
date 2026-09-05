export default function Home() {
  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col justify-center p-6 text-center">
      <h1 className="font-display text-3xl font-bold tracking-tight mb-2">Booktau</h1>
      <p className="text-ink-soft mb-8">Book appointments without the WhatsApp back-and-forth.</p>
      <div className="space-y-3">
        <a
          href="/signup"
          className="block w-full bg-ink text-paper rounded-xl py-3.5 font-medium hover:bg-brass-dark transition-colors"
        >
          Create your shop
        </a>
        <a
          href="/login"
          className="block w-full border border-line rounded-xl py-3.5 font-medium hover:border-brass transition-colors"
        >
          Log in
        </a>
      </div>
      <a href="/privacy" className="block text-xs text-ink-soft mt-8 underline underline-offset-2">
        Privacy Policy
      </a>
    </div>
  );
}
