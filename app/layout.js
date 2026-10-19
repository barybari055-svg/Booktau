import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const display = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-display',
});
const body = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
});
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});

export const metadata = {
  title: {
    default: 'Booktau — simpler appointment booking',
    template: '%s | Booktau',
  },
  description:
    'An early-stage appointment-booking prototype for independent barbershops and salons in Kazakhstan, exploring reliable scheduling and database-backed booking rules.',
  applicationName: 'Booktau',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="bg-paper text-ink font-sans">{children}</body>
    </html>
  );
}
