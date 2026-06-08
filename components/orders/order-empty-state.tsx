import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ClipboardList, AlertCircle, Search } from "lucide-react";

interface OrderEmptyStateProps {
  type: "empty" | "error" | "filter-empty";
  onRetry?: () => void;
}

const configs = {
  empty: {
    Icon: ClipboardList,
    title: "Belum Ada Pesanan",
    description: "Kamu belum memiliki pesanan. Yuk mulai belanja dan temukan produk favoritmu!",
  },
  error: {
    Icon: AlertCircle,
    title: "Gagal Memuat Pesanan",
    description: "Terjadi kesalahan saat mengambil data. Coba lagi dalam beberapa saat.",
  },
  "filter-empty": {
    Icon: Search,
    title: "Tidak Ditemukan",
    description: "Tidak ada pesanan dengan filter yang dipilih. Coba filter lain.",
  },
};

export function OrderEmptyState({ type, onRetry }: OrderEmptyStateProps) {
  const config = configs[type];
  const Icon = config.Icon;

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border bg-card px-6 py-16 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">{config.title}</h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">{config.description}</p>
      <div className="flex gap-3">
        {type === "empty" && (
          <Link href="/products" className={buttonVariants()}>
            Mulai Belanja
          </Link>
        )}
        {type === "error" && (
          <>
            {onRetry && (
              <button onClick={onRetry} className={buttonVariants()}>
                Coba Lagi
              </button>
            )}
            <Link href="/" className={buttonVariants({ variant: "outline" })}>
              Kembali ke Beranda
            </Link>
          </>
        )}
        {type === "filter-empty" && onRetry && (
          <button onClick={onRetry} className={buttonVariants({ variant: "outline" })}>
            Reset Filter
          </button>
        )}
      </div>
    </div>
  );
}
