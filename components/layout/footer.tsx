import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-3">Store</h3>
            <p className="text-sm text-muted-foreground">
              E-commerce store built with Next.js 16 and Strapi v5.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Menu</h3>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/products" className="hover:text-foreground transition-colors">
                Semua Produk
              </Link>
              <Link href="/categories" className="hover:text-foreground transition-colors">
                Kategori
              </Link>
              <Link href="/cart" className="hover:text-foreground transition-colors">
                Keranjang
              </Link>
            </nav>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Akun</h3>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/auth/login" className="hover:text-foreground transition-colors">
                Masuk
              </Link>
              <Link href="/auth/register" className="hover:text-foreground transition-colors">
                Daftar
              </Link>
              <Link href="/orders" className="hover:text-foreground transition-colors">
                Pesanan Saya
              </Link>
            </nav>
          </div>
        </div>
        <div className="border-t mt-8 pt-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Store. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
