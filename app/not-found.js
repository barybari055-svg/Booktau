export default function NotFound() {
  return (
    <div className="max-w-md mx-auto p-6 text-center">
      <h1 className="text-xl font-bold mb-2">Page not found</h1>
      <p className="text-gray-500 text-sm mb-6">
        Nothing here — double check the link, or head back home.
      </p>
      <a href="/" className="inline-block bg-black text-white rounded-lg px-4 py-2 text-sm">
        Go home
      </a>
    </div>
  );
}
