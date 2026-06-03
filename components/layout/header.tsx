"use client";

import Link from "next/link";
import { User, Search, Menu } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function Header() {
  const { isAuthenticated, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between gap-4">
        <Link href="/" className="font-bold text-xl flex-shrink-0 font-[family-name:var(--font-playfair)]">
          Cyra
        </Link>

        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari produk..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        <nav className="flex items-center gap-2">
          <CartDrawer />

          {isAuthenticated ? (
            <Button variant="ghost" size="icon" onClick={() => router.push("/account")}>
              <User className="h-5 w-5" />
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => router.push("/auth/login")}>
              Masuk
            </Button>
          )}

          <Sheet>
            <SheetTrigger
              className={buttonVariants({ variant: "ghost", size: "icon", className: "md:hidden" })}
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left">
              <nav className="flex flex-col gap-4 mt-8">
                <Link href="/products" className="text-lg font-medium">
                  Semua Produk
                </Link>
                <Link href="/categories" className="text-lg font-medium">
                  Kategori
                </Link>
                {isAuthenticated ? (
                  <>
                    <Link href="/orders" className="text-lg font-medium">
                      Pesanan Saya
                    </Link>
                    <Link href="/account" className="text-lg font-medium">
                      Akun
                    </Link>
                    <button
                      onClick={() => logout()}
                      className="text-lg font-medium text-left text-destructive"
                    >
                      Keluar
                    </button>
                  </>
                ) : (
                  <Link href="/auth/login" className="text-lg font-medium">
                    Masuk / Daftar
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </header>
  );
}
