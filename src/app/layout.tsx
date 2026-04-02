import './globals.css';

export const metadata = {
  title: 'RouteFinder',
  description: 'AI Traffic & Route Finder',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {children}
      </body>
    </html>
  );
}
