"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { SubdistrictSearch } from "@/components/checkout/subdistrict-search";
import type { SubdistrictResult } from "@/lib/shipping";
import type { AddressFormData } from "@/types/address";

interface AddressFormProps {
  initialData?: Partial<AddressFormData>;
  onSubmit: (data: AddressFormData) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
}

function buildInitialSubdistrict(data?: Partial<AddressFormData>): SubdistrictResult | null {
  if (data?.subdistrictId) {
    return {
      id: Number(data.subdistrictId),
      name: [data.city, data.state].filter(Boolean).join(", ") || "Alamat tersimpan",
      sub_district_name: "",
      city_name: data.city ?? "",
      province_name: data.state ?? "",
      postal_code: data.postalCode ?? "",
    };
  }
  return null;
}

export function AddressForm({
  initialData,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Simpan",
}: AddressFormProps) {
  const [selectedSubdistrict, setSelectedSubdistrict] = useState<SubdistrictResult | null>(
    buildInitialSubdistrict(initialData),
  );

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
      city: selectedSubdistrict?.city_name ?? initialData?.city ?? "",
      state: selectedSubdistrict?.province_name ?? initialData?.state ?? "",
      postalCode: selectedSubdistrict?.postal_code ?? initialData?.postalCode ?? "",
      country: "Indonesia",
      isDefault: formEls["isDefault"]?.checked ?? false,
      subdistrictId: selectedSubdistrict?.id.toString() ?? initialData?.subdistrictId ?? "",
    };
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs" htmlFor="addr-label">
          Label (opsional)
        </Label>
        <Input
          id="addr-label"
          name="label"
          defaultValue={initialData?.label ?? ""}
          placeholder="Contoh: Rumah, Kantor"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="addr-firstName">
            Nama Depan
          </Label>
          <Input
            id="addr-firstName"
            name="firstName"
            required
            defaultValue={initialData?.firstName ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="addr-lastName">
            Nama Belakang
          </Label>
          <Input
            id="addr-lastName"
            name="lastName"
            required
            defaultValue={initialData?.lastName ?? ""}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs" htmlFor="addr-phone">
          Telepon
        </Label>
        <Input
          id="addr-phone"
          name="phone"
          type="tel"
          required
          defaultValue={initialData?.phone ?? ""}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs" htmlFor="addr-addressLine1">
          Alamat
        </Label>
        <Input
          id="addr-addressLine1"
          name="addressLine1"
          required
          defaultValue={initialData?.addressLine1 ?? ""}
        />
      </div>

      <SubdistrictSearch
        initialSubdistrict={selectedSubdistrict}
        onSelect={(subdistrict) =>
          setSelectedSubdistrict(subdistrict?.id ? subdistrict : null)
        }
      />

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
