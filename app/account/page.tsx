import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Package } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { AccountTabs } from "@/components/addresses/account-tabs";
import { AddressList } from "@/components/addresses/address-list";

const STRAPI_URL = process.env.STRAPI_URL!;

export default async function AccountPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) redirect("/auth/login");

  const res = await fetch(`${STRAPI_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) redirect("/auth/login");

  const user = await res.json();

  const profileContent = (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>
            <span className="text-muted-foreground">Username:</span>{" "}
            {user.username}
          </p>
          <p>
            <span className="text-muted-foreground">Email:</span>{" "}
            {user.email}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <Package className="h-8 w-8 mb-3 text-primary" />
            <h3 className="font-semibold mb-1">Pesanan Saya</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Lihat riwayat pesanan
            </p>
            <Link
              href="/orders"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Lihat Pesanan
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="pt-6 border-t">
        <LogoutButton />
      </div>
    </div>
  );

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Akun Saya</h1>
      <AccountTabs
        profileContent={profileContent}
        addressesContent={<AddressList />}
      />
    </main>
  );
}
