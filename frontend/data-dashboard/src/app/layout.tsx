import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./modules/common/navbar";
import TutorialTour from "./modules/common/tutorial-tour";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dynamic Data Explorer",
  description: "Upload your data and get instant insights with AI-powered analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TutorialTour page="home">
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
        </TutorialTour>
      </body>
    </html>
  );
}
