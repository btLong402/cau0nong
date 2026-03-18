import type { Metadata } from "next";
import { Be_Vietnam_Pro, Space_Grotesk } from "next/font/google";
import "./globals.css";

const bodyFont = Be_Vietnam_Pro({
  variable: "--font-body",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

const headingFont = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "CLB Cau Long | Quan Ly Van Hanh",
  description: "He thong quan ly CLB cau long: thanh vien, buoi tap, ky va quyet toan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${bodyFont.variable} ${headingFont.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
