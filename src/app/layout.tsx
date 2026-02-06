import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { TooltipProvider } from "@/components/ui/tooltip";

const sans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Decivue - Decision Intelligence System",
  description: "Track decisions, detect drift, and maintain awareness over time",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark" style={{ colorScheme: 'dark' }}>
      <head>
        <meta name="theme-color" content="#0a0a0a" />
      </head>
      <body className={`${sans.variable} ${mono.variable} ${spaceGrotesk.variable} antialiased flex flex-col min-h-screen`}>
        <TooltipProvider delayDuration={200}>
          <SiteHeader />
          <div className="flex-1">
            {children}
          </div>
          <SiteFooter />
        </TooltipProvider>
      </body>
    </html>
  );
}
