import type { Metadata } from "next";
import { DM_Sans, Fraunces, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { ResumeProvider } from "@/context/ResumeContext";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const uiSans = DM_Sans({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Forge Resume — AI Resume Builder",
  description: "Guided AI resume builder with a live editable preview",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${uiSans.variable} ${display.variable} ${geistMono.variable} min-h-full antialiased`}
    >
      <body className="min-h-dvh flex flex-col antialiased" suppressHydrationWarning>
        <AuthProvider>
          <ResumeProvider>{children}</ResumeProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
