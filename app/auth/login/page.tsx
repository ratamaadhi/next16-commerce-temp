"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { user, isAuthenticated, login, isLoggingIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user) {
      router.push("/");
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const identifier = data.get("email") as string;
    const password = data.get("password") as string;
    login({ identifier, password });
  };

  return (
    <main className="container mx-auto max-w-md px-4 py-16">
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Masuk</CardTitle>
            <CardDescription>Masuk ke akun kamu untuk melanjutkan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="email@contoh.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                name="password"
                placeholder="••••••••"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoggingIn}>
              {isLoggingIn ? "Memproses..." : "Masuk"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Belum punya akun?{" "}
              <Link href="/auth/register" className="text-primary hover:underline">
                Daftar
              </Link>
            </p>
          </CardFooter>
        </Card>
      </form>
    </main>
  );
}
