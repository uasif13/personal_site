import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Asif Uddin — Software Engineer",
  description: "MS Computer Science @ NJIT. Former data engineer at Bloomberg LP. Building at the intersection of distributed systems, full-stack development, and AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
