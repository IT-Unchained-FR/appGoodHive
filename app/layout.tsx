import "./globals.css";

import "@rainbow-me/rainbowkit/styles.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <footer className="mx-5 text-sm">Powered by GoodHive</footer>
      </body>
    </html>
  );
}
