const features = [
  {
    number: '01',
    title: 'One link for appointments',
    description: 'Give customers a clear place to explore services and request a time.',
  },
  {
    number: '02',
    title: 'Hours that reflect real life',
    description: 'Model working days, breaks, and dates when a shop is unavailable.',
  },
  {
    number: '03',
    title: 'Booking rules at the database',
    description: 'Treat validation and access control as system rules—not just UI behavior.',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <a href="/" className="font-display text-xl font-bold tracking-tight" aria-label="Booktau home">
          booktau<span className="text-brass">.</span>
        </a>
        <nav className="flex items-center gap-3 text-sm">
          <a href="/login" className="rounded-full px-4 py-2 font-medium text-ink-soft transition hover:text-ink">
            Log in
          </a>
          <a href="/signup" className="rounded-full bg-ink px-4 py-2.5 font-medium text-paper transition hover:bg-brass-dark">
            Get started <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>

      <section className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-12 sm:px-8 sm:pb-24 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div className="relative z-10">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-white/60 px-3.5 py-2 text-xs font-medium tracking-wide text-ink-soft">
            <span className="h-2 w-2 rounded-full bg-moss" />
            MADE FOR LOCAL SERVICE BUSINESSES
          </p>
          <h1 className="max-w-2xl font-display text-5xl font-bold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">
            Less messaging.
            <br />
            <span className="text-brass">More making time.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-ink-soft sm:text-lg sm:leading-8">
            A simpler way for independent barbershops and salons in Kazakhstan to manage appointment requests—without the endless “Is 3pm free?” conversation.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="/signup" className="inline-flex items-center justify-center gap-3 rounded-xl bg-ink px-6 py-4 text-sm font-semibold text-paper shadow-sm transition hover:-translate-y-0.5 hover:bg-brass-dark">
              Create your shop <span aria-hidden="true">→</span>
            </a>
            <a href="#how-it-works" className="inline-flex items-center justify-center rounded-xl border border-line bg-white/50 px-6 py-4 text-sm font-semibold transition hover:border-brass">
              Explore the idea
            </a>
          </div>
          <p className="mt-4 text-xs leading-5 text-ink-soft">
            Early-stage prototype · Not yet validated with real shop customers
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-lg">
          <div className="absolute -right-12 -top-10 h-48 w-48 rounded-full bg-paper-dim blur-3xl" />
          <div className="relative rounded-[2rem] border border-line bg-white p-4 shadow-[0_28px_80px_-35px_rgba(34,31,27,0.28)] sm:p-6">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <p className="font-display text-lg font-bold">Your booking day</p>
                <p className="mt-1 text-xs text-ink-soft">A concept preview</p>
              </div>
              <span className="rounded-full bg-paper-dim px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-soft">Preview</span>
            </div>
            <div className="mt-5 rounded-2xl bg-paper p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-ink-soft">SERVICE BUSINESS</p>
                  <p className="mt-1 font-display text-xl font-bold">The daily flow</p>
                </div>
                <span className="rounded-lg bg-white px-2.5 py-2 text-xs font-medium text-moss">One link</span>
              </div>
              <div className="mt-5 space-y-3">
                <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-paper-dim text-lg" aria-hidden="true">↗</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">Customer chooses a service</p>
                    <p className="mt-1 text-xs text-ink-soft">Services and available times</p>
                  </div>
                  <span className="text-moss" aria-hidden="true">✓</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-paper-dim text-lg" aria-hidden="true">◷</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">The schedule sets the rules</p>
                    <p className="mt-1 text-xs text-ink-soft">Hours, breaks, blocked dates</p>
                  </div>
                  <span className="text-moss" aria-hidden="true">✓</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-paper-dim text-lg" aria-hidden="true">◇</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">Database checks the booking</p>
                    <p className="mt-1 text-xs text-ink-soft">Validation beyond the browser</p>
                  </div>
                  <span className="text-moss" aria-hidden="true">✓</span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-line px-4 py-3">
              <div>
                <p className="text-sm font-semibold">Designed around reliability</p>
                <p className="mt-1 text-xs text-ink-soft">A product idea with real engineering constraints</p>
              </div>
              <span className="font-mono text-xs text-brass">KZ / 01</span>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-ink-soft">Illustrative preview—not a live calendar or customer data.</p>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-line bg-white/50">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">The product idea</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">Simple on the surface. Careful underneath.</h2>
            <p className="mt-4 leading-7 text-ink-soft">
              A booking interface is only useful if the rules behind it hold up when people make mistakes or two customers request the same time.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.number} className="rounded-2xl border border-line bg-paper p-6 sm:p-7">
                <p className="font-mono text-xs text-brass">{feature.number} / BOOKTAU</p>
                <h3 className="mt-7 font-display text-xl font-bold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-ink-soft">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-14 sm:px-8 sm:py-16 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">Built in Kazakhstan, for Kazakhstan</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight">A small-business problem worth solving well.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">
            Booktau is an evolving prototype. The next milestone is to validate the experience with shop owners and improve it from their feedback.
          </p>
        </div>
        <a href="/signup" className="inline-flex shrink-0 items-center justify-center gap-3 self-start rounded-xl bg-ink px-6 py-4 text-sm font-semibold text-paper transition hover:bg-brass-dark md:self-center">
          Try the setup flow <span aria-hidden="true">→</span>
        </a>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-6 text-xs text-ink-soft sm:px-8 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Booktau · Appointment booking prototype</p>
          <div className="flex gap-5">
            <a href="/privacy" className="underline underline-offset-4 hover:text-ink">Privacy</a>
            <a href="https://github.com/barybari055-svg/Booktau" className="underline underline-offset-4 hover:text-ink" target="_blank" rel="noreferrer">Source code</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
