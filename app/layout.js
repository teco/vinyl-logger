export const metadata = {
  title: 'Vinyl Logger',
  description: 'Personal OS — Vinyl Collection',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0e0d0c' }}>{children}</body>
    </html>
  );
}
