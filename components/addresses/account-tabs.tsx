"use client";

import type { ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { User, MapPin } from "lucide-react";

interface AccountTabsProps {
  profileContent: ReactNode;
  addressesContent: ReactNode;
}

export function AccountTabs({ profileContent, addressesContent }: AccountTabsProps) {
  return (
    <Tabs defaultValue="profile" orientation="horizontal" className="flex-col w-full">
      <TabsList className="mb-2">
        <TabsTrigger value="profile">
          <User className="size-4" />
          Profil
        </TabsTrigger>
        <TabsTrigger value="addresses">
          <MapPin className="size-4" />
          Alamat
        </TabsTrigger>
      </TabsList>
      <TabsContent value="profile">{profileContent}</TabsContent>
      <TabsContent value="addresses">{addressesContent}</TabsContent>
    </Tabs>
  );
}
