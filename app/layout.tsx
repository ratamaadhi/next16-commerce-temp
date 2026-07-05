import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { cookies } from "next/headers";
import { dehydrate, QueryClient } from "@tanstack/react-query";
import { Providers } from "@/providers/providers";
import { StoreChrome } from "@/components/layout/store-chrome";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const STRAPI_URL = process.env.STRAPI_URL!;

export const metadata: Metadata = {
  title: {
    default: "Cyra — Preloved Beauty",
    template: "%s | Cyra",
  },
  description: "Temukan produk kecantikan preloved terpilih dari koleksi pribadi Cyra. Asli, terjamin, dan berkualitas.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  let user = null;

  if (token) {
    try {
      const res = await fetch(`${STRAPI_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) user = await res.json();
    } catch {
      // token invalid/expired, user stays null
    }
  }

  const queryClient = new QueryClient();
  queryClient.setQueryData(["auth-user"], user);

  return (
    <html lang="id">
      <body className={`${inter.variable} ${playfair.variable} min-h-screen flex flex-col`}>
        <Providers dehydratedState={dehydrate(queryClient)}>
          <StoreChrome>{children}</StoreChrome>
        </Providers>
      </body>
    </html>
  );
}
