import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import AuthSessionProvider from "@/components/providers/session-provider";
import Navbar from "@/components/navbar";
import { Toaster } from "sonner";
import ServiceWorkerRegister from "@/components/sw-register";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Tres Hermanas",
  description: "Restaurant scheduling and operations hub",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tres Hermanas",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#b5502b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn("font-sans antialiased", inter.variable)}>
        <AuthSessionProvider>
          <Navbar />
          <main className="pb-20 md:pb-0">{children}</main>
          <Toaster position="top-right" richColors />
          <ServiceWorkerRegister />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
