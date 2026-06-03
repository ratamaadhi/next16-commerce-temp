"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const { logout } = useAuth();

  return (
    <Button variant="outline" onClick={() => logout()}>
      <LogOut className="h-4 w-4" />
      Keluar
    </Button>
  );
}
