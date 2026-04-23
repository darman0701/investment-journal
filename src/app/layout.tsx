import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "投資ジャーナル",
  description: "投資記録・振り返りアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
