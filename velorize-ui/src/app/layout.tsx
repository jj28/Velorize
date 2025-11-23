import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Velorize - Demand Planning for SMEs',
  description: 'Democratizing S&OP for Malaysian SMEs',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
