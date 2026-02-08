import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ScratchingsProvider } from './providers/ScratchingsProvider';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Trading the Races",
  description: "Horse racing ratings and analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ScratchingsProvider>
          <Navbar />
          {children}
        </ScratchingsProvider>
      </body>
    </html>
  );
}