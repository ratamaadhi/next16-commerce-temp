import { headers } from "next/headers";
import {
  Inter,
  Playfair_Display,
  Plus_Jakarta_Sans,
  Cormorant_Garamond,
} from "next/font/google";
import { cookies } from "next/headers";
import { dehydrate, QueryClient } from "@tanstack/react-query";
import { Providers } from "@/providers/providers";
import { BrandProvider } from "@/lib/brand-context";
import { BrandHeader } from "@/components/layout/brand-header";
import { BrandFooter } from "@/components/layout/brand-footer";
import { brandConfigs } from "@/lib/brand-config";
import type { BrandId } from "@/types/brand";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
});

const STRAPI_URL = process.env.STRAPI_URL!;

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

  const headersList = await headers();
  const rawBrand = headersList.get("x-brand-id") || "cyra";
  const brand: BrandId =
    rawBrand in brandConfigs ? (rawBrand as BrandId) : "cyra";

  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} ${jakarta.variable} ${cormorant.variable} min-h-screen flex flex-col`}
      >
        <Providers dehydratedState={dehydrate(queryClient)}>
          <BrandProvider brand={brand}>
            <div className={`brand-${brand}`}>
              <BrandHeader brand={brand} />
              <main className="flex-1">{children}</main>
              <BrandFooter brand={brand} />
            </div>
          </BrandProvider>
        </Providers>
      </body>
    </html>
  );
}
