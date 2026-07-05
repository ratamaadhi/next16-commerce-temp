import { AlertTriangle, Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

export function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
            </CardHeader>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-56 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export function DashboardError({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="border-destructive/40">
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <AlertTriangle className="size-8 text-destructive" />
        <div>
          <p className="font-medium">Gagal memuat data analytics</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {message || "Terjadi kesalahan saat mengambil data."}
          </p>
        </div>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Coba lagi
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardEmpty() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <Inbox className="size-8 text-muted-foreground" />
        <div>
          <p className="font-medium">Belum ada data</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tidak ada aktivitas pada rentang tanggal dan filter ini.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
