export const metadata = {
  title: 'Vinyl Logger',
  description: 'Personal OS — Vinyl Collection',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0e0d0c' }}>{children}</body>
    </html>
  );
}
