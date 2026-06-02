import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import { dehydrate, QueryClient } from "@tanstack/react-query";
import { Providers } from "@/providers/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const STRAPI_URL = process.env.STRAPI_URL!;

export const metadata: Metadata = {
  title: {
    default: "E-Commerce Store",
    template: "%s | E-Commerce Store",
  },
  description: "E-Commerce store built with Next.js and Strapi",
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
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Providers dehydratedState={dehydrate(queryClient)}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
