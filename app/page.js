export default function Home() {
  return (
    <div className="max-w-md mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold mb-2">Booktau</h1>
      <p className="text-gray-500 mb-6">Book appointments without the WhatsApp back-and-forth.</p>
      <div className="space-y-2">
        <a href="/signup" className="block w-full bg-black text-white rounded-lg py-3">
          Create your shop
        </a>
        <a href="/login" className="block w-full border rounded-lg py-3">
          Log in
        </a>
      </div>
      <a href="/privacy" className="block text-xs text-gray-400 mt-6 underline">
        Privacy Policy
      </a>
    </div>
  );
}
