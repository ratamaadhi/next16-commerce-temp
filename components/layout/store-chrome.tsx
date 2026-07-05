"use client";

import { usePathname } from "next/navigation";
import { Header } from "./header";
import { Footer } from "./footer";

// Renders the storefront chrome (Header/Footer) for every route except the
// internal dashboard, which supplies its own shell. Keeps storefront and
// dashboard layouts separate without touching Header/Footer themselves.
export function StoreChrome({ children }: { children: React.ReactNode }) {
  const isDashboard = usePathname()?.startsWith("/dashboard");

  return (
    <>
      {!isDashboard && <Header />}
      <main className="flex-1">{children}</main>
      {!isDashboard && <Footer />}
    </>
  );
}
