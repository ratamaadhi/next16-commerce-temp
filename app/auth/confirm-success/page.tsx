import Link from "next/link"
import { CircleCheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function ConfirmSuccessPage() {
  return (
    <main className="relative container mx-auto max-w-md px-4 py-16">
      <form>
        <Card className="relative overflow-hidden border-border/60 shadow-xl shadow-primary/5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--primary)_0%,transparent_70%)] opacity-[0.04]" />

          <CardHeader className="relative text-center pb-2">
            <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/5">
              <CircleCheckIcon
                className="size-10 text-primary animate-[confirm-pop_0.5s_cubic-bezier(0.34,1.56,0.64,1)]"
                strokeWidth={2.5}
              />
            </div>
            <CardTitle className="text-2xl">
              Email berhasil dikonfirmasi!
            </CardTitle>
          </CardHeader>

          <CardContent className="relative text-center space-y-3 pb-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Akun kamu sudah aktif. Selamat datang — kamu sekarang bisa masuk
              dan mulai berbelanja.
            </p>

            <div className="flex items-center justify-center gap-2 pt-2">
              <span className="inline-flex size-1.5 rounded-full bg-primary/60" />
              <span className="inline-flex size-1.5 rounded-full bg-primary/40" />
              <span className="inline-flex size-1.5 rounded-full bg-primary/20" />
            </div>
          </CardContent>

          <CardFooter className="relative flex-col gap-4 pb-8">
            <Button
              render={<Link href="/auth/login" />}
              nativeButton={false}
              className="w-full"
            >
              Masuk ke akun
            </Button>
          </CardFooter>
        </Card>
      </form>
    </main>
  )
}
