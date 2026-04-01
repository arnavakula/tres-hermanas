import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import AuthSessionProvider from "@/components/providers/session-provider";
import Navbar from "@/components/navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Tres Hermanas",
  description: "Restaurant scheduling and operations hub",
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
          <main>{children}</main>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
