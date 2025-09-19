import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NFL Fantasy Trends - Executive Dashboard",
  description: "Análisis ejecutivo de tendencias de jugadores de NFL en fantasía",
  keywords: ["NFL", "Fantasy Football", "Analytics", "Dashboard", "Sports"],
  authors: [{ name: "NFL Analytics Team" }],
  openGraph: {
    title: "NFL Fantasy Trends Dashboard",
    description: "Dashboard ejecutivo para análisis de tendencias de NFL Fantasy",
    url: "https://chat.z.ai",
    siteName: "NFL Analytics",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NFL Fantasy Trends Dashboard",
    description: "Dashboard ejecutivo para análisis de tendencias de NFL Fantasy",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
