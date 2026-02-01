import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2563eb',
};

export const metadata: Metadata = {
  title: 'HearMeOuttt - Share Your Thoughts Anonymously',
  description: 'HearMeOuttt is a safe and anonymous platform to share your thoughts, feelings, and daily experiences without registration.',
  keywords: 'HearMeOuttt, anonymous posts, share thoughts, anonymous social, mental health, venting',
  authors: [{ name: 'Harsh Vardhan Shukla', url: 'https://github.com/Harshvdev' }],
  creator: 'Harsh Vardhan Shukla',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'HearMeOuttt - Share Your Thoughts Anonymously',
    description: 'A judgment-free space to share your thoughts, feelings, and daily experiences without needing an account.',
    url: 'https://hearmeouttt.netlify.app',
    siteName: 'HearMeOuttt',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HearMeOuttt - Share Your Thoughts Anonymously',
    description: 'A judgment-free space to share your thoughts, feelings, and daily experiences without needing an account.',
  },
  verification: {
    google: 'Dkr6begNrbMXCeyhxMlNqEljHa1aoNQ4AGjN5QlbUAc',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={poppins.className}>
      {/* suppressHydrationWarning:
        Tells React to ignore attribute mismatches on the body tag 
        (like those injected by Grammarly, LastPass, or ad blockers).
      */}
      <body suppressHydrationWarning={true}>{children}</body>
    </html>
  );
}