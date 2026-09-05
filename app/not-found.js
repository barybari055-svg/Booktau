export default function NotFound() {
  return (
    <div className="max-w-md mx-auto p-6 text-center">
      <h1 className="font-display text-xl font-bold mb-2">Page not found</h1>
      <p className="text-ink-soft text-sm mb-6">
        Nothing here — double check the link, or head back home.
      </p>
      <a href="/" className="inline-block bg-ink text-paper rounded-lg px-4 py-2 text-sm font-medium hover:bg-brass-dark transition-colors">
        Go home
      </a>
    </div>
  );
}
