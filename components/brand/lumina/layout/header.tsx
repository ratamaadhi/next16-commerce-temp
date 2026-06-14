"use client";

import Link from "next/link";
import { Menu, UserRound, Package, LogOut } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CartDrawer } from "@/components/cart/cart-drawer";
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
import { useRouter } from "next/navigation";
import { SearchBar } from "@/components/common/search-bar";

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6 flex h-16 items-center justify-between gap-6">
        <Link
          href="/"
          className="font-bold text-xl flex-shrink-0 tracking-tight font-[family-name:var(--font-heading)]"
        >
          Lumina
        </Link>

        <div className="hidden md:flex flex-1 max-w-lg mx-4">
          <SearchBar />
        </div>

        <nav className="flex items-center gap-2">
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
