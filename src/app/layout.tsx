import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "getshitdone - Habit Tracker",
  description: "Track your habits, build streaks, get shit done.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
