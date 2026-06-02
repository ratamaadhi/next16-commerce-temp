"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold mb-4">Terjadi Kesalahan</h1>
      <p className="text-muted-foreground mb-6">
        Maaf, terjadi kesalahan saat memuat halaman.
      </p>
      <Button onClick={reset}>Coba Lagi</Button>
    </main>
  );
}
