import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import OnlineHeartbeat from "@/components/OnlineHeartbeat";

export const metadata: Metadata = {
  title: "היכל הניגון | שירים חסידיים וחרדיים",
  description:
    "קטלוג שירים חסידיים וחרדיים לפי נושאים — צפייה בקליפים והורדה, מתעדכן אוטומטית.",
  manifest: "/manifest.webmanifest",
  themeColor: "#1B2430",
  openGraph: {
    title: "היכל הניגון | שירים חסידיים וחרדיים",
    description: "אלפי שירים חסידיים לפי נושאים — צפייה בקליפ, הורדה וטופ 100.",
    type: "website",
    locale: "he_IL",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@500;700;900&family=Heebo:wght@300;400;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body min-h-screen flex flex-col">
        <Providers>
          <OnlineHeartbeat />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
