import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'INK | Organic visibility intelligence',
  description:
    'Understand your company. Find your next content opportunity. Build visibility across search and AI.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
