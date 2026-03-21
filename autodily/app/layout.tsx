import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoDíly — Váš dodavatel autodílů",
  description: "Hledejte autodíly podle vozidla, OEM kódu nebo názvu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs" className="h-full antialiased">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
