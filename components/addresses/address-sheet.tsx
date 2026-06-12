"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { AddressForm } from "@/components/addresses/address-form";
import { useAddresses } from "@/hooks/use-addresses";
import type { Address, AddressFormData } from "@/types/address";

interface AddressSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address?: Address | null;
}

export function AddressSheet({ open, onOpenChange, address }: AddressSheetProps) {
  const { createAddress, updateAddress, isCreating, isUpdating } = useAddresses();
  const isEditing = !!address;
  const isSubmitting = isCreating || isUpdating;

  const handleSubmit = async (data: AddressFormData) => {
    if (isEditing && address) {
      await updateAddress({ id: address.documentId, data });
    } else {
      await createAddress(data);
    }
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-6 overflow-y-auto">
        <SheetHeader className="space-y-2">
          <SheetTitle className="text-lg font-semibold">
            {isEditing ? "Edit Alamat" : "Tambah Alamat"}
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            {isEditing
              ? "Perbarui detail alamat pengiriman"
              : "Isi detail alamat pengiriman baru"}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 min-h-0 px-4 pb-4">
          <AddressForm
            initialData={
              address
                ? {
                    label: address.label,
                    firstName: address.firstName,
                    lastName: address.lastName,
                    phone: address.phone,
                    addressLine1: address.addressLine1,
                    city: address.city,
                    state: address.state,
                    postalCode: address.postalCode,
                    country: address.country,
                    isDefault: address.isDefault,
                    subdistrictId: address.subdistrictId,
                  }
                : undefined
            }
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitLabel={isEditing ? "Perbarui" : "Simpan"}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
