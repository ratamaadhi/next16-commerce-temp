"use client";

import Link from "next/link";
import { Menu, UserRound, Package, LogOut } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { MobileSearch } from "@/components/common/mobile-search";
import { SearchBar } from "@/components/common/search-bar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouter, usePathname } from "next/navigation";

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const navLinkClass = (href: string) =>
    cn(
      "px-3 py-1.5 text-sm font-medium transition-colors duration-200 whitespace-nowrap",
      pathname === href || pathname.startsWith(href + "/")
        ? "text-primary"
        : "text-foreground hover:text-primary",
    );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 items-center gap-6 relative">
        <div className="flex flex-1 items-center gap-6 min-w-0">
          <Link href="/" className="font-bold text-xl font-[family-name:var(--font-playfair)]">
            Cyra
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link href="/products" className={navLinkClass("/products")}>
              Semua Produk
            </Link>
            <Link href="/categories" className={navLinkClass("/categories")}>
              Kategori
            </Link>
          </div>
        </div>

        <div className="hidden md:flex w-full max-w-md shrink-0">
          <SearchBar />
        </div>

        <nav className="flex flex-1 items-center justify-end gap-1">
          <MobileSearch />

          <CartDrawer />

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", size: "icon" })}>
                <Avatar size="sm">
                  <AvatarFallback>{user?.username?.charAt(0)?.toUpperCase()}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="flex items-center gap-3 p-2 font-normal">
                    <Avatar size="default">
                      <AvatarFallback>{user?.username?.charAt(0)?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{user?.username}</span>
                      <span className="text-xs text-muted-foreground">{user?.email}</span>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/account")}>
                  <UserRound className="h-4 w-4" />
                  Akun Saya
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/orders")}>
                  <Package className="h-4 w-4" />
                  Pesanan Saya
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => logout()}>
                  <LogOut className="h-4 w-4" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex"
              onClick={() => router.push("/auth/login")}
            >
              Masuk
            </Button>
          )}

          <Sheet>
            <SheetTrigger
              className={buttonVariants({
                variant: "ghost",
                size: "icon",
                className: "md:hidden min-h-[44px] min-w-[44px]",
              })}
              aria-label="Buka menu navigasi"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </SheetTrigger>
            <SheetContent side="left" className="bg-background flex flex-col">
              <SheetTitle className="sr-only">Menu navigasi</SheetTitle>
              <SheetDescription className="sr-only">Link navigasi utama dan akun</SheetDescription>

              <div className="px-6 pt-10 pb-5 border-b border-border">
                <span className="text-xl font-bold font-[family-name:var(--font-playfair)]">
                  Cyra
                </span>
                <p className="text-xs text-muted-foreground mt-1">Preloved Beauty Pilihan</p>
              </div>

              <nav className="flex flex-col px-4 pt-4 flex-1">
                <Link
                  href="/products"
                  className={cn(
                    "py-3 px-2 text-base font-medium transition-colors duration-200",
                    pathname === "/products" || pathname.startsWith("/products/")
                      ? "text-primary"
                      : "text-foreground hover:text-primary",
                  )}
                >
                  Semua Produk
                </Link>
                <Link
                  href="/categories"
                  className={cn(
                    "py-3 px-2 text-base font-medium transition-colors duration-200",
                    pathname === "/categories" || pathname.startsWith("/categories/")
                      ? "text-primary"
                      : "text-foreground hover:text-primary",
                  )}
                >
                  Kategori
                </Link>

                {isAuthenticated ? (
                  <div className="mt-6 pt-6 border-t border-border flex flex-col">
                    <Link
                      href="/orders"
                      className={cn(
                        "py-3 px-2 text-base font-medium transition-colors duration-200",
                        pathname === "/orders"
                          ? "text-primary"
                          : "text-foreground hover:text-primary",
                      )}
                    >
                      Pesanan Saya
                    </Link>
                    <Link
                      href="/account"
                      className={cn(
                        "py-3 px-2 text-base font-medium transition-colors duration-200",
                        pathname === "/account"
                          ? "text-primary"
                          : "text-foreground hover:text-primary",
                      )}
                    >
                      Akun
                    </Link>
                    <button
                      onClick={() => logout()}
                      className="mt-6 py-3 px-2 w-full text-base font-medium text-left text-destructive hover:text-destructive/80 transition-colors duration-200"
                    >
                      Keluar
                    </button>
                  </div>
                ) : (
                  <div className="mt-6 pt-6 border-t border-border">
                    <Link
                      href="/auth/login"
                      className="py-3 px-2 text-base font-medium text-primary hover:text-primary/80 transition-colors duration-200"
                    >
                      Masuk / Daftar
                    </Link>
                  </div>
                )}
              </nav>

              <div className="px-6 py-6">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Temukan koleksi preloved terpilih — fashion & kecantikan berkualitas untuk Anda.
                </p>
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </header>
  );
}
