import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-6">Halaman tidak ditemukan</p>
      <Link href="/" className={buttonVariants()}>
        Kembali ke Beranda
      </Link>
    </main>
  );
}
