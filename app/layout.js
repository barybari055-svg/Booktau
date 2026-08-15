import './globals.css';

export const metadata = {
  title: 'Booktau',
  description: 'Book appointments without the WhatsApp back-and-forth',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
