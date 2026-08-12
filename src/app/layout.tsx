import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#F5C518",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://sportssphere.fun"),
  title: "SportSphere - The World's Biggest Sports Community",
  description: "Connect with fans, players, teams, leagues and communities through one sports-first social platform.",
  manifest: "/sportsphere/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SportSphere",
  },
  icons: {
    icon: "/sportsphere/favicon.svg",
    apple: "/sportsphere/favicon.svg",
  },
  openGraph: {
    title: "SportSphere",
    description: "The World's Biggest Sports Community",
    url: "https://sportssphere.fun",
    siteName: "SportSphere",
    images: [
      {
        url: "/sportsphere/logo.svg",
        width: 800,
        height: 600,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SportSphere",
    description: "The World's Biggest Sports Community",
    images: ["/sportsphere/logo.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* crypto.randomUUID polyfill — required on plain-HTTP deployments */}
        <script dangerouslySetInnerHTML={{ __html: `
          if (typeof crypto !== 'undefined' && typeof crypto.randomUUID !== 'function') {
            crypto.randomUUID = function() {
              return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, function(c) {
                return (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16);
              });
            };
          }
        `}} />
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/sportsphere/icons/icon-192x192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased bg-background text-foreground font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
