"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";
import { AddressCard } from "@/components/addresses/address-card";
import { AddressSheet } from "@/components/addresses/address-sheet";
import { useAddresses } from "@/hooks/use-addresses";
import type { Address } from "@/types/address";

export function AddressList() {
  const { addresses, isLoading, deleteAddress, setDefaultAddress } = useAddresses();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deletingAddress, setDeletingAddress] = useState<Address | null>(null);

  const sorted = [...addresses].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return 0;
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Memuat alamat...
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 rounded-full bg-secondary p-4">
            <Plus className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">Belum ada alamat tersimpan</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tambahkan alamat untuk memudahkan checkout
          </p>
          <Button
            className="mt-4"
            onClick={() => {
              setEditingAddress(null);
              setSheetOpen(true);
            }}
          >
            <Plus className="mr-2 size-4" />
            Tambah Alamat
          </Button>
        </div>
        <AddressSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          address={editingAddress}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {addresses.length} alamat tersimpan
        </p>
        <Button
          size="sm"
          onClick={() => {
            setEditingAddress(null);
            setSheetOpen(true);
          }}
        >
          <Plus className="mr-2 size-4" />
          Tambah Alamat
        </Button>
      </div>

      <div className="space-y-3">
        {sorted.map((addr) => (
          <AddressCard
            key={addr.documentId}
            address={addr}
            onEdit={() => {
              setEditingAddress(addr);
              setSheetOpen(true);
            }}
            onDelete={() => setDeletingAddress(addr)}
            onSetDefault={
              addr.isDefault ? undefined : () => setDefaultAddress(addr.documentId)
            }
          />
        ))}
      </div>

      <AddressSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        address={editingAddress}
      />

      <Dialog
        open={!!deletingAddress}
        onOpenChange={(open) => {
          if (!open) setDeletingAddress(null);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Hapus Alamat</DialogTitle>
            <DialogDescription>
              Yakin ingin menghapus alamat ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingAddress(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deletingAddress) {
                  deleteAddress(deletingAddress.documentId);
                  setDeletingAddress(null);
                }
              }}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
