import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { getStaffUser, isStaff } from "@/lib/analytics";
import { LogoutButton } from "@/components/auth/logout-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = (await cookies()).get("token")?.value;
  if (!token) redirect("/auth/login?redirect=/dashboard");

  const user = await getStaffUser(token);
  if (!user) redirect("/auth/login?redirect=/dashboard");

  if (!isStaff(user)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="text-xl font-semibold">Akses ditolak</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Akun ini tidak punya akses ke dashboard analytics internal. Hubungi
          admin untuk mendapat peran staff.
        </p>
        <Link href="/" className="text-sm underline underline-offset-4">
          Kembali ke beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <BarChart3 className="size-5" />
            <span>Analytics Internal</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground hidden sm:inline">
              {user.email ?? user.username}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
