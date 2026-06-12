"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { AddressFormData } from "@/types/address";

interface AddressFormProps {
  initialData?: Partial<AddressFormData>;
  onSubmit: (data: AddressFormData) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function AddressForm({
  initialData,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Simpan",
}: AddressFormProps) {
  const id = useId();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formEls = form.elements as unknown as Record<string, HTMLInputElement>;
    const get = (name: string) => formEls[name]?.value ?? "";
    const data: AddressFormData = {
      label: get("label"),
      firstName: get("firstName"),
      lastName: get("lastName"),
      phone: get("phone"),
      addressLine1: get("addressLine1"),
      city: get("city"),
      state: get("state"),
      postalCode: get("postalCode"),
      country: "Indonesia",
      isDefault: formEls["isDefault"]?.checked ?? false,
    };
    await onSubmit(data);
  };

  return (
    <form id={id} onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs" htmlFor={`${id}-label`}>
          Label (opsional)
        </Label>
        <Input
          id={`${id}-label`}
          name="label"
          defaultValue={initialData?.label ?? ""}
          placeholder="Contoh: Rumah, Kantor"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor={`${id}-firstName`}>
            Nama Depan
          </Label>
          <Input
            id={`${id}-firstName`}
            name="firstName"
            required
            defaultValue={initialData?.firstName ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor={`${id}-lastName`}>
            Nama Belakang
          </Label>
          <Input
            id={`${id}-lastName`}
            name="lastName"
            required
            defaultValue={initialData?.lastName ?? ""}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs" htmlFor={`${id}-phone`}>
          Telepon
        </Label>
        <Input
          id={`${id}-phone`}
          name="phone"
          type="tel"
          required
          defaultValue={initialData?.phone ?? ""}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs" htmlFor={`${id}-addressLine1`}>
          Alamat
        </Label>
        <Input
          id={`${id}-addressLine1`}
          name="addressLine1"
          required
          defaultValue={initialData?.addressLine1 ?? ""}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor={`${id}-city`}>
            Kota
          </Label>
          <Input
            id={`${id}-city`}
            name="city"
            defaultValue={initialData?.city ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor={`${id}-state`}>
            Provinsi
          </Label>
          <Input
            id={`${id}-state`}
            name="state"
            defaultValue={initialData?.state ?? ""}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor={`${id}-postalCode`}>
            Kode Pos
          </Label>
          <Input
            id={`${id}-postalCode`}
            name="postalCode"
            defaultValue={initialData?.postalCode ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor={`${id}-country-display`}>
            Negara
          </Label>
          <Input id={`${id}-country-display`} value="Indonesia" disabled />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          name="isDefault"
          defaultChecked={initialData?.isDefault ?? false}
          className="size-4 rounded border-border accent-primary"
        />
        <span>Jadikan alamat utama</span>
      </label>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Menyimpan...
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
}
