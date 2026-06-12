# Saved Addresses Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add user address book management in account page + checkout integration with saved address selection

**Architecture:** API route handlers proxy to Strapi `/users/me/addresses` endpoints. Client uses React Query for server state. Account page gets a tabbed layout with Address tab using shadcn Sheet for add/edit. Checkout page gets address cards above the inline form for quick selection.

**Tech Stack:** Next.js 16 App Router, React 19, @tanstack/react-query, @base-ui/react (tabs/sheet/dialog), Tailwind CSS 4, TypeScript

---

## File Map

```
Created:
  types/address.ts                       → Address type definitions
  app/api/addresses/route.ts            → GET (list) + POST (create)
  app/api/addresses/[id]/route.ts       → PUT (update) + DELETE (delete)
  app/api/addresses/[id]/default/route.ts → PATCH (make default)
  hooks/use-addresses.ts                → React Query hooks
  components/addresses/address-card.tsx  → Card display
  components/addresses/address-form.tsx  → Form (add/edit)
  components/addresses/address-sheet.tsx → Sheet wrapper
  components/addresses/address-list.tsx  → List with actions
  components/addresses/address-selector.tsx → Checkout selector

Modified:
  app/account/page.tsx                  → Tabbed layout with addresses
  app/checkout/page.tsx                 → Address selector + save checkbox
```

---

### Task 1: Address Types

**Files:**
- Create: `types/address.ts`

- [ ] **Step 1: Create the address type definitions**

```typescript
export interface Address {
  documentId: string;
  label: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface AddressFormData {
  label: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface AddressListResponse {
  data: Address[];
}

export interface AddressSingleResponse {
  data: Address;
}
```

- [ ] **Step 2: Verify types compile**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add types/address.ts
git commit -m "feat: add address type definitions"
```

---

### Task 2: Address API Routes - List/Create

**Files:**
- Create: `app/api/addresses/route.ts`

- [ ] **Step 1: Create GET + POST route handler**

```typescript
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const STRAPI_URL = process.env.STRAPI_URL!;

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = await fetch(`${STRAPI_URL}/api/users/me/addresses`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch addresses" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const res = await fetch(`${STRAPI_URL}/api/users/me/addresses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    return NextResponse.json(
      { error: errorData?.error?.message || "Failed to create address" },
      { status: res.status },
    );
  }

  const data = await res.json();
  return NextResponse.json(data, { status: 201 });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/addresses/route.ts
git commit -m "feat: add address list/create API routes"
```

---

### Task 3: Address API Routes - Update/Delete

**Files:**
- Create: `app/api/addresses/[id]/route.ts`

- [ ] **Step 1: Create PUT + DELETE route handler**

```typescript
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const STRAPI_URL = process.env.STRAPI_URL!;

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const res = await fetch(`${STRAPI_URL}/api/users/me/addresses/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to update address" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = await fetch(`${STRAPI_URL}/api/users/me/addresses/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to delete address" }, { status: res.status });
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/addresses/[id]/route.ts
git commit -m "feat: add address update/delete API routes"
```

---

### Task 4: Address API Route - Set Default

**Files:**
- Create: `app/api/addresses/[id]/default/route.ts`

- [ ] **Step 1: Create PATCH route handler**

```typescript
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const STRAPI_URL = process.env.STRAPI_URL!;

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = await fetch(`${STRAPI_URL}/api/users/me/addresses/${id}/make-default`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to set default address" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/addresses/[id]/default/route.ts
git commit -m "feat: add address set-default API route"
```

---

### Task 5: Address React Query Hooks

**Files:**
- Create: `hooks/use-addresses.ts`

- [ ] **Step 1: Create the hook**

```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Address, AddressFormData, AddressListResponse } from "@/types/address";

async function fetchAddresses(): Promise<Address[]> {
  const res = await fetch("/api/addresses");
  if (!res.ok) throw new Error("Failed to fetch addresses");
  const data: AddressListResponse = await res.json();
  return data.data;
}

async function createAddress(data: AddressFormData): Promise<Address> {
  const res = await fetch("/api/addresses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Gagal menyimpan alamat");
  }
  const result = await res.json();
  return result.data;
}

async function updateAddress(id: string, data: Partial<AddressFormData>): Promise<Address> {
  const res = await fetch(`/api/addresses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) throw new Error("Gagal mengupdate alamat");
  const result = await res.json();
  return result.data;
}

async function deleteAddress(id: string): Promise<void> {
  const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Gagal menghapus alamat");
}

async function setDefaultAddress(id: string): Promise<Address> {
  const res = await fetch(`/api/addresses/${id}/default`, { method: "PATCH" });
  if (!res.ok) throw new Error("Gagal mengubah alamat utama");
  const result = await res.json();
  return result.data;
}

export function useAddresses() {
  const queryClient = useQueryClient();
  const queryKey = ["addresses"];

  const { data: addresses = [], isLoading } = useQuery({
    queryKey,
    queryFn: fetchAddresses,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Alamat berhasil disimpan");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal menyimpan alamat");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AddressFormData> }) =>
      updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Alamat berhasil diperbarui");
    },
    onError: () => {
      toast.error("Gagal mengupdate alamat");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAddress,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<Address[]>(queryKey);
      queryClient.setQueryData<Address[]>(queryKey, (old) =>
        old ? old.filter((a) => a.documentId !== id) : [],
      );
      return { prev };
    },
    onError: (_err, _id, context) => {
      if (context?.prev) queryClient.setQueryData(queryKey, context.prev);
      toast.error("Gagal menghapus alamat");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: setDefaultAddress,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<Address[]>(queryKey);
      queryClient.setQueryData<Address[]>(queryKey, (old) =>
        old
          ? old.map((a) => ({ ...a, isDefault: a.documentId === id }))
          : [],
      );
      return { prev };
    },
    onError: (_err, _id, context) => {
      if (context?.prev) queryClient.setQueryData(queryKey, context.prev);
      toast.error("Gagal mengubah alamat utama");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    addresses,
    isLoading,
    createAddress: createMutation.mutateAsync,
    updateAddress: updateMutation.mutateAsync,
    deleteAddress: deleteMutation.mutate,
    setDefaultAddress: setDefaultMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
```

- [ ] **Step 2: Verify types compile**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add hooks/use-addresses.ts
git commit -m "feat: add address React Query hooks"
```

---

### Task 6: AddressCard Component

**Files:**
- Create: `components/addresses/address-card.tsx`

- [ ] **Step 1: Create AddressCard component**

```typescript
"use client";

import { MapPin, Pencil, Trash2, Star } from "lucide-react";
import type { Address } from "@/types/address";

interface AddressCardProps {
  address: Address;
  selected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
}

export function AddressCard({
  address,
  selected = false,
  onSelect,
  onEdit,
  onDelete,
  onSetDefault,
}: AddressCardProps) {
  const isClickable = !!onSelect;

  return (
    <div
      onClick={onSelect}
      className={`group relative rounded-lg border p-4 transition-all ${
        isClickable ? "cursor-pointer" : ""
      } ${
        selected
          ? "border-primary ring-2 ring-primary"
          : "border-border hover:shadow-md"
      }`}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onSelect?.();
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {address.label && (
                <span className="text-sm font-semibold text-foreground">
                  {address.label}
                </span>
              )}
              {address.isDefault && (
                <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                  <Star className="mr-1 size-2.5 fill-current" />
                  Utama
                </span>
              )}
            </div>
            <p className="mt-1 text-sm font-medium text-foreground">
              {address.firstName} {address.lastName}
            </p>
            <p className="text-sm text-muted-foreground">{address.phone}</p>
            <p className="text-sm text-muted-foreground">
              {address.addressLine1}
            </p>
            {address.city && (
              <p className="text-sm text-muted-foreground">
                {address.city}
                {address.state ? `, ${address.state}` : ""}
                {address.postalCode ? ` ${address.postalCode}` : ""}
              </p>
            )}
          </div>
        </div>

        {onEdit !== undefined ||
        onDelete !== undefined ||
        onSetDefault !== undefined ? (
          <div className="flex shrink-0 items-center gap-1">
            {!address.isDefault && onSetDefault && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSetDefault();
                }}
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Jadikan alamat utama"
              >
                <Star className="size-4" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Edit"
              >
                <Pencil className="size-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                title="Hapus"
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/addresses/address-card.tsx
git commit -m "feat: add AddressCard component"
```

---

### Task 7: AddressForm Component

**Files:**
- Create: `components/addresses/address-form.tsx`

- [ ] **Step 1: Create AddressForm component**

```typescript
"use client";

import { useEffect } from "react";
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

const EMPTY_FORM: AddressFormData = {
  label: "",
  firstName: "",
  lastName: "",
  phone: "",
  addressLine1: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Indonesia",
  isDefault: false,
};

export function AddressForm({
  initialData,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Simpan",
}: AddressFormProps) {
  const id = `address-form-${Math.random().toString(36).slice(2, 8)}`;

  useEffect(() => {
    const form = document.getElementById(id) as HTMLFormElement | null;
    if (!form) return;
    const data = initialData ?? EMPTY_FORM;
    const fields: Record<string, string> = {
      label: data.label ?? "",
      firstName: data.firstName ?? "",
      lastName: data.lastName ?? "",
      phone: data.phone ?? "",
      addressLine1: data.addressLine1 ?? "",
      city: data.city ?? "",
      state: data.state ?? "",
      postalCode: data.postalCode ?? "",
    };
    for (const [key, value] of Object.entries(fields)) {
      const el = form.querySelector(`[name="${key}"]`) as HTMLInputElement | null;
      if (el) el.value = value;
    }
  }, [initialData, id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data: AddressFormData = {
      label: (formData.get("label") as string) || "",
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      phone: formData.get("phone") as string,
      addressLine1: formData.get("addressLine1") as string,
      city: (formData.get("city") as string) || "",
      state: (formData.get("state") as string) || "",
      postalCode: (formData.get("postalCode") as string) || "",
      country: "Indonesia",
      isDefault: formData.get("isDefault") === "on",
    };
    await onSubmit(data);
  };

  return (
    <form id={id} onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs" htmlFor={`${id}-label`}>
          Label (opsional)
        </Label>
        <Input id={`${id}-label`} name="label" placeholder="Contoh: Rumah, Kantor" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor={`${id}-firstName`}>
            Nama Depan
          </Label>
          <Input id={`${id}-firstName`} name="firstName" required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor={`${id}-lastName`}>
            Nama Belakang
          </Label>
          <Input id={`${id}-lastName`} name="lastName" required />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs" htmlFor={`${id}-phone`}>
          Telepon
        </Label>
        <Input id={`${id}-phone`} name="phone" type="tel" required />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs" htmlFor={`${id}-addressLine1`}>
          Alamat
        </Label>
        <Input id={`${id}-addressLine1`} name="addressLine1" required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor={`${id}-city`}>
            Kota
          </Label>
          <Input id={`${id}-city`} name="city" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor={`${id}-state`}>
            Provinsi
          </Label>
          <Input id={`${id}-state`} name="state" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor={`${id}-postalCode`}>
            Kode Pos
          </Label>
          <Input id={`${id}-postalCode`} name="postalCode" />
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
```

- [ ] **Step 2: Commit**

```bash
git add components/addresses/address-form.tsx
git commit -m "feat: add AddressForm component"
```

---

### Task 8: AddressSheet Component

**Files:**
- Create: `components/addresses/address-sheet.tsx`

- [ ] **Step 1: Create AddressSheet component**

```typescript
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
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit Alamat" : "Tambah Alamat"}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Perbarui detail alamat pengiriman"
              : "Isi detail alamat pengiriman baru"}
          </SheetDescription>
        </SheetHeader>
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
                }
              : undefined
          }
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel={isEditing ? "Perbarui" : "Simpan"}
        />
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/addresses/address-sheet.tsx
git commit -m "feat: add AddressSheet component"
```

---

### Task 9: AddressList Component

**Files:**
- Create: `components/addresses/address-list.tsx`

- [ ] **Step 1: Create AddressList component**

```typescript
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
            onSetDefault={addr.isDefault ? undefined : () => setDefaultAddress(addr.documentId)}
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
```

- [ ] **Step 2: Commit**

```bash
git add components/addresses/address-list.tsx
git commit -m "feat: add AddressList component"
```

---

### Task 10: AddressSelector Component (Checkout)

**Files:**
- Create: `components/addresses/address-selector.tsx`

- [ ] **Step 1: Create AddressSelector component**

```typescript
"use client";

import { Plus } from "lucide-react";
import { AddressCard } from "@/components/addresses/address-card";
import type { Address } from "@/types/address";

interface AddressSelectorProps {
  addresses: Address[];
  selectedId: string | null;
  onSelect: (address: Address | null) => void;
  onAddNew: () => void;
}

export function AddressSelector({
  addresses,
  selectedId,
  onSelect,
  onAddNew,
}: AddressSelectorProps) {
  const sorted = [...addresses].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return 0;
  });

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((addr) => (
        <AddressCard
          key={addr.documentId}
          address={addr}
          selected={selectedId === addr.documentId}
          onSelect={() => onSelect(addr)}
        />
      ))}
      <div
        onClick={onAddNew}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border p-6 transition-all hover:border-primary hover:bg-muted/50 ${
          selectedId === null ? "border-primary ring-2 ring-primary bg-muted/30" : ""
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onAddNew();
        }}
      >
        <div className="mb-2 rounded-full bg-secondary p-2">
          <Plus className="size-5 text-muted-foreground" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          Tambah Alamat Baru
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/addresses/address-selector.tsx
git commit -m "feat: add AddressSelector component"
```

---

### Task 11: Update Account Page with Tabs

**Files:**
- Modify: `app/account/page.tsx`

- [ ] **Step 1: Rewrite account page with tabs**

The current account page is a server component. Since tabs require client-side state, we need to extract the tabs section into a client component wrapper. The page remains a server component for auth/user fetching.

Replace the entire file content:

```typescript
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

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Akun Saya</h1>

      <AccountTabs
        profileContent={
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
                  <Link href="/orders" className={buttonVariants({ variant: "outline", size: "sm" })}>
                    Lihat Pesanan
                  </Link>
                </CardContent>
              </Card>
            </div>

            <div className="pt-6 border-t">
              <LogoutButton />
            </div>
          </div>
        }
        addressesContent={<AddressList />}
      />
    </main>
  );
}
```

Wait — the `AccountTabs` component containing the tabs needs to be a client component since `Tabs` from @base-ui/react needs client-side state. But profile content is static server-rendered, and addresses are client-rendered. We should pass the profile content as children and keep it server-rendered, while wrapping the address tab content in a client boundary.

Actually, a better approach: create `AccountTabs` as a client component that uses the Tabs from @base-ui/react. The profile tab content can be passed as a ReactNode (server-rendered), and the address tab content is a client component (`AddressList`).

Let me update the plan with a separate `AccountTabs` client component. But wait — I already have `AddressList` as a client component. The `AccountTabs` wrapper just needs to be thin: it renders the tabs and uses children or slots for content.

Actually, looking at the @base-ui/react tabs API, it doesn't use `children` in the traditional way — the tabs are rendered via the components. Let me think about this...

The tabs component uses: `<Tabs> <TabsList> <TabsTrigger> <TabsContent>`. So I need a single client component that wraps everything. The profile content can be server-rendered as children of `TabsContent`.

Let me create `AccountTabs` as a new component in the `components/addresses/` directory, or maybe better in a shared location. Actually, it's account-specific, so let me put it alongside. Or even better, I can just write it inline in the account page as a client component extracted to a separate file.

Let me simplify: create `components/addresses/account-tabs.tsx` as a client component.<｜end▁of▁thinking｜>

<｜｜DSML｜｜tool_calls>
<｜｜DSML｜｜invoke name="write">
<｜｜DSML｜｜parameter name="content" string="true"># Saved Addresses Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add user address book management in account page + checkout integration with saved address selection

**Architecture:** API route handlers proxy to Strapi `/users/me/addresses` endpoints. Client uses React Query for server state. Account page gets a tabbed layout with Address tab using shadcn Sheet for add/edit. Checkout page gets address cards above the inline form for quick selection.

**Tech Stack:** Next.js 16 App Router, React 19, @tanstack/react-query, @base-ui/react (tabs/sheet/dialog), Tailwind CSS 4, TypeScript

---

## File Map

```
Created:
  types/address.ts                         → Address type definitions
  app/api/addresses/route.ts              → GET (list) + POST (create)
  app/api/addresses/[id]/route.ts         → PUT (update) + DELETE (delete)
  app/api/addresses/[id]/default/route.ts  → PATCH (make default)
  hooks/use-addresses.ts                  → React Query hooks
  components/addresses/address-card.tsx    → Card display
  components/addresses/address-form.tsx    → Form (add/edit)
  components/addresses/address-sheet.tsx   → Sheet wrapper
  components/addresses/address-list.tsx    → List with actions
  components/addresses/address-selector.tsx → Checkout selector
  components/addresses/account-tabs.tsx    → Tabs wrapper for account

Modified:
  app/account/page.tsx                    → Tabbed layout with addresses
  app/checkout/page.tsx                   → Address selector + save checkbox
```

---

### Task 1: Address Types

**Files:**
- Create: `types/address.ts`

- [ ] **Step 1: Create the address type definitions**

```typescript
export interface Address {
  documentId: string;
  label: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface AddressFormData {
  label: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface AddressListResponse {
  data: Address[];
}
```

- [ ] **Step 2: Verify types compile**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add types/address.ts
git commit -m "feat: add address type definitions"
```

---

### Task 2: Address API Routes - List/Create

**Files:**
- Create: `app/api/addresses/route.ts`

- [ ] **Step 1: Create GET + POST route handler**

```typescript
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const STRAPI_URL = process.env.STRAPI_URL!;

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = await fetch(`${STRAPI_URL}/api/users/me/addresses`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch addresses" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const res = await fetch(`${STRAPI_URL}/api/users/me/addresses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    return NextResponse.json(
      { error: errorData?.error?.message || "Failed to create address" },
      { status: res.status },
    );
  }

  const data = await res.json();
  return NextResponse.json(data, { status: 201 });
}
```

- [ ] **Step 2: Verify dev server compiles**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/api/addresses/route.ts
git commit -m "feat: add address list/create API routes"
```

---

### Task 3: Address API Routes - Update/Delete

**Files:**
- Create: `app/api/addresses/[id]/route.ts`

- [ ] **Step 1: Create PUT + DELETE route handler**

```typescript
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const STRAPI_URL = process.env.STRAPI_URL!;

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const res = await fetch(`${STRAPI_URL}/api/users/me/addresses/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to update address" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = await fetch(`${STRAPI_URL}/api/users/me/addresses/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to delete address" }, { status: res.status });
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/addresses/[id]/route.ts
git commit -m "feat: add address update/delete API routes"
```

---

### Task 4: Address API Route - Set Default

**Files:**
- Create: `app/api/addresses/[id]/default/route.ts`

- [ ] **Step 1: Create PATCH route handler**

```typescript
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const STRAPI_URL = process.env.STRAPI_URL!;

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = await fetch(`${STRAPI_URL}/api/users/me/addresses/${id}/make-default`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to set default address" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/addresses/[id]/default/route.ts
git commit -m "feat: add address set-default API route"
```

---

### Task 5: Address React Query Hooks

**Files:**
- Create: `hooks/use-addresses.ts`

- [ ] **Step 1: Create the hook**

```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Address, AddressFormData, AddressListResponse } from "@/types/address";

async function fetchAddresses(): Promise<Address[]> {
  const res = await fetch("/api/addresses");
  if (!res.ok) throw new Error("Failed to fetch addresses");
  const data: AddressListResponse = await res.json();
  return data.data;
}

async function createAddress(data: AddressFormData): Promise<Address> {
  const res = await fetch("/api/addresses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Gagal menyimpan alamat");
  }
  const result = await res.json();
  return result.data;
}

async function updateAddress(id: string, data: Partial<AddressFormData>): Promise<Address> {
  const res = await fetch(`/api/addresses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) throw new Error("Gagal mengupdate alamat");
  const result = await res.json();
  return result.data;
}

async function deleteAddress(id: string): Promise<void> {
  const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Gagal menghapus alamat");
}

async function setDefaultAddress(id: string): Promise<Address> {
  const res = await fetch(`/api/addresses/${id}/default`, { method: "PATCH" });
  if (!res.ok) throw new Error("Gagal mengubah alamat utama");
  const result = await res.json();
  return result.data;
}

export function useAddresses() {
  const queryClient = useQueryClient();
  const queryKey = ["addresses"];

  const { data: addresses = [], isLoading } = useQuery({
    queryKey,
    queryFn: fetchAddresses,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Alamat berhasil disimpan");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal menyimpan alamat");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AddressFormData> }) =>
      updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Alamat berhasil diperbarui");
    },
    onError: () => {
      toast.error("Gagal mengupdate alamat");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAddress,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<Address[]>(queryKey);
      queryClient.setQueryData<Address[]>(queryKey, (old) =>
        old ? old.filter((a) => a.documentId !== id) : [],
      );
      return { prev };
    },
    onError: (_err, _id, context) => {
      if (context?.prev) queryClient.setQueryData(queryKey, context.prev);
      toast.error("Gagal menghapus alamat");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: setDefaultAddress,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<Address[]>(queryKey);
      queryClient.setQueryData<Address[]>(queryKey, (old) =>
        old
          ? old.map((a) => ({ ...a, isDefault: a.documentId === id }))
          : [],
      );
      return { prev };
    },
    onError: (_err, _id, context) => {
      if (context?.prev) queryClient.setQueryData(queryKey, context.prev);
      toast.error("Gagal mengubah alamat utama");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    addresses,
    isLoading,
    createAddress: createMutation.mutateAsync,
    updateAddress: updateMutation.mutateAsync,
    deleteAddress: deleteMutation.mutate,
    setDefaultAddress: setDefaultMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
```

- [ ] **Step 2: Verify types compile**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add hooks/use-addresses.ts
git commit -m "feat: add address React Query hooks"
```

---

### Task 6: AddressCard Component

**Files:**
- Create: `components/addresses/address-card.tsx`

- [ ] **Step 1: Create AddressCard component**

```typescript
"use client";

import { MapPin, Pencil, Trash2, Star } from "lucide-react";
import type { Address } from "@/types/address";

interface AddressCardProps {
  address: Address;
  selected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
}

export function AddressCard({
  address,
  selected = false,
  onSelect,
  onEdit,
  onDelete,
  onSetDefault,
}: AddressCardProps) {
  const isClickable = !!onSelect;

  return (
    <div
      onClick={onSelect}
      className={`group relative rounded-lg border p-4 transition-all ${
        isClickable ? "cursor-pointer" : ""
      } ${
        selected
          ? "border-primary ring-2 ring-primary"
          : "border-border hover:shadow-md"
      }`}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onSelect?.();
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {address.label && (
                <span className="text-sm font-semibold text-foreground">
                  {address.label}
                </span>
              )}
              {address.isDefault && (
                <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                  <Star className="mr-1 size-2.5 fill-current" />
                  Utama
                </span>
              )}
            </div>
            <p className="mt-1 text-sm font-medium text-foreground">
              {address.firstName} {address.lastName}
            </p>
            <p className="text-sm text-muted-foreground">{address.phone}</p>
            <p className="text-sm text-muted-foreground">
              {address.addressLine1}
            </p>
            {address.city && (
              <p className="text-sm text-muted-foreground">
                {address.city}
                {address.state ? `, ${address.state}` : ""}
                {address.postalCode ? ` ${address.postalCode}` : ""}
              </p>
            )}
          </div>
        </div>

        {(onEdit || onDelete || onSetDefault) && (
          <div className="flex shrink-0 items-center gap-1">
            {!address.isDefault && onSetDefault && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSetDefault();
                }}
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Jadikan alamat utama"
              >
                <Star className="size-4" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Edit"
              >
                <Pencil className="size-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                title="Hapus"
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/addresses/address-card.tsx
git commit -m "feat: add AddressCard component"
```

---

### Task 7: AddressForm Component

**Files:**
- Create: `components/addresses/address-form.tsx`

- [ ] **Step 1: Create AddressForm component**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add components/addresses/address-form.tsx
git commit -m "feat: add AddressForm component"
```

---

### Task 8: AddressSheet Component

**Files:**
- Create: `components/addresses/address-sheet.tsx`

- [ ] **Step 1: Create AddressSheet component**

```typescript
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
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit Alamat" : "Tambah Alamat"}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Perbarui detail alamat pengiriman"
              : "Isi detail alamat pengiriman baru"}
          </SheetDescription>
        </SheetHeader>
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
                }
              : undefined
          }
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel={isEditing ? "Perbarui" : "Simpan"}
        />
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/addresses/address-sheet.tsx
git commit -m "feat: add AddressSheet component"
```

---

### Task 9: AddressList Component

**Files:**
- Create: `components/addresses/address-list.tsx`

- [ ] **Step 1: Create AddressList component**

```typescript
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
            onSetDefault={addr.isDefault ? undefined : () => setDefaultAddress(addr.documentId)}
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
```

- [ ] **Step 2: Commit**

```bash
git add components/addresses/address-list.tsx
git commit -m "feat: add AddressList component with empty state and delete confirm"
```

---

### Task 10: AddressSelector Component (Checkout)

**Files:**
- Create: `components/addresses/address-selector.tsx`

- [ ] **Step 1: Create AddressSelector component**

```typescript
"use client";

import { Plus } from "lucide-react";
import { AddressCard } from "@/components/addresses/address-card";
import type { Address } from "@/types/address";

interface AddressSelectorProps {
  addresses: Address[];
  selectedId: string | null;
  onSelect: (address: Address | null) => void;
  onAddNew: () => void;
}

export function AddressSelector({
  addresses,
  selectedId,
  onSelect,
  onAddNew,
}: AddressSelectorProps) {
  const sorted = [...addresses].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return 0;
  });

  const isAddNewSelected = selectedId === null && addresses.length > 0;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((addr) => (
        <AddressCard
          key={addr.documentId}
          address={addr}
          selected={selectedId === addr.documentId}
          onSelect={() => onSelect(addr)}
        />
      ))}
      <div
        onClick={onAddNew}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border p-6 transition-all hover:border-primary hover:bg-muted/50 ${
          isAddNewSelected ? "border-primary ring-2 ring-primary bg-muted/30" : ""
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onAddNew();
        }}
      >
        <div className="mb-2 rounded-full bg-secondary p-2">
          <Plus className="size-5 text-muted-foreground" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          Tambah Alamat Baru
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/addresses/address-selector.tsx
git commit -m "feat: add AddressSelector component for checkout"
```

---

### Task 11: AccountTabs Component

**Files:**
- Create: `components/addresses/account-tabs.tsx`

- [ ] **Step 1: Create AccountTabs client component**

```typescript
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
    <Tabs defaultValue="profile">
      <TabsList className="mb-6">
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
```

- [ ] **Step 2: Commit**

```bash
git add components/addresses/account-tabs.tsx
git commit -m "feat: add AccountTabs component"
```

---

### Task 12: Update Account Page

**Files:**
- Modify: `app/account/page.tsx`

- [ ] **Step 1: Rewrite account page to use tabs**

Replace the entire file. The existing profile content + orders link + logout go into the "Profil" tab via `profileContent` prop. The `AddressList` component goes in the "Alamat" tab. The existing imports `User` and `Package` stay. New imports for `AccountTabs` and `AddressList`.

```typescript
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
```

- [ ] **Step 2: Verify types compile**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/account/page.tsx
git commit -m "feat: add address tab to account page"
```

---

### Task 13: Update Checkout Page with Address Integration

**Files:**
- Modify: `app/checkout/page.tsx`

- [ ] **Step 1: Add address selector and save checkbox to checkout**

The checkout page needs these changes:
1. Import `useAddresses`, `AddressSelector`, and `Address` type
2. Fetch addresses if authenticated
3. Add address state (selectedAddressId)
4. Auto-select default address on mount
5. Add address cards above the shipping form
6. Add "Simpan alamat" checkbox below the form
7. On address select, auto-fill the form
8. On submit, if "Simpan" checked + logged in, create address

We need to wrap the checkout form section in a client component to use the address hooks. Since the whole checkout page is already a client component (`"use client"`), we can add everything inline.

The key changes to `app/checkout/page.tsx`:

**Added imports (after line 15):**
```typescript
import { useAddresses } from "@/hooks/use-addresses";
import { AddressSelector } from "@/components/addresses/address-selector";
import type { Address } from "@/types/address";
```

**Added state (after line 24):**
```typescript
const { addresses } = useAddresses();
const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
const [saveAddress, setSaveAddress] = useState(false);
```

**Added effect for auto-select default (after line 61):**
```typescript
useEffect(() => {
  if (addresses.length > 0 && selectedAddressId === null) {
    const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0];
    setSelectedAddressId(defaultAddr.documentId);
    setShippingAddress({
      firstName: defaultAddr.firstName,
      lastName: defaultAddr.lastName,
      phone: defaultAddr.phone,
      addressLine1: defaultAddr.addressLine1,
    });
  }
}, [addresses, selectedAddressId]);
```

**Added inside `handleInputChange` — when user types manually, deselect saved address:**
In the existing `handleInputChange` function, add:
```typescript
const handleInputChange = (field: string, value: string) => {
  setShippingAddress((prev) => ({ ...prev, [field]: value }));
  setSelectedAddressId(null);
};
```

Wait — actually this is tricky. The user said:
- User bisa pilih dari alamat yang tersimpan
- User bisa langsung isi form alamatnya
- User bisa simpan alamat yang baru di-isi di form checkout dengan mencentang "simpan alamat"
- Di atas form alamat pada checkout page ada option user pilih alamat default atau isi manual

So:
1. Address selector is above the form
2. Select an address → form fills, form IS still editable
3. If user edits the form after selecting, the "Simpan alamat" checkbox can appear
4. "Tambah Alamat Baru" clears the form and shows save checkbox

Let me restructure the handleInputChange:
- On select saved address → set selectedAddressId, fill form
- On manual edit → if fields differ from selected address, set selectedAddressId to null (indicates "new/edit" mode, show save checkbox)
- On select "Tambah Baru" → clear form, selectedAddressId = null, show save checkbox

The "Simpan alamat" checkbox logic:
- Show if: user is authenticated AND (selectedAddressId is null OR form differs from selected address)
- Actually simpler: show if user is authenticated, always. If they select a saved address and don't edit, it doesn't matter — we won't save. But the checkbox should only be there in "new" mode.

Simplified logic:
- `selectedId === null` means "new address" mode → show save checkbox
- `selectedId !== null` means "using saved address" → hide save checkbox (or show if form was edited)

Actually let me simplify further: always show the save checkbox if the user is logged in. The checkbox default state: unchecked when selecting a saved address, checked when adding new. Most intuitive.

Let me write the full updated checkout page:

Actually, looking at the current checkout page code again, I realize the changes are quite extensive. Let me be surgical and show exactly what changes need to be made, rather than rewriting the whole file.

Changes to `app/checkout/page.tsx`:

1. Add imports (2 lines)
2. Add state variables (3 lines)
3. Add useEffect for auto-select (1 block)
4. Modify handleInputChange to track selection
5. Add AddressSelector JSX before the Card
6. Add save checkbox after the form
7. Modify handleSubmit to optionally save address

This is too much for a plan step — let me write the full updated file in the plan.

Let me write the plan with the full checkout page as the final step.

Actually, for the plan, I should just show the diff/instructions. The agent implementing this will read the existing file and make the changes. Let me be specific about what to change.

Let me write the checkout changes as a series of edits:
- Edit 1: Add imports
- Edit 2: Add state + effect  
- Edit 3: Modify handleInputChange
- Edit 4: Add AddressSelector JSX
- Edit 5: Add save checkbox JSX
- Edit 6: Modify handleSubmit

Let me finalize the plan file.<｜end▁of▁thinking｜>Now let me finalize the complete plan with the checkout page changes.

<｜｜DSML｜｜tool_calls>
<｜｜DSML｜｜invoke name="write">
<｜｜DSML｜｜parameter name="content" string="true"># Saved Addresses Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add user address book management in account page + checkout integration with saved address selection

**Architecture:** API route handlers proxy to Strapi `/users/me/addresses` endpoints. Client uses React Query for server state. Account page gets a tabbed layout with Address tab using shadcn Sheet for add/edit. Checkout page gets address cards above the inline form for quick selection.

**Tech Stack:** Next.js 16 App Router, React 19, @tanstack/react-query, @base-ui/react (tabs/sheet/dialog), Tailwind CSS 4, TypeScript

---

## File Map

```
Created:
  types/address.ts                         → Address type definitions
  app/api/addresses/route.ts              → GET (list) + POST (create)
  app/api/addresses/[id]/route.ts         → PUT (update) + DELETE (delete)
  app/api/addresses/[id]/default/route.ts  → PATCH (make default)
  hooks/use-addresses.ts                  → React Query hooks
  components/addresses/address-card.tsx    → Card display
  components/addresses/address-form.tsx    → Form (add/edit)
  components/addresses/address-sheet.tsx   → Sheet wrapper
  components/addresses/address-list.tsx    → List with actions
  components/addresses/address-selector.tsx → Checkout selector
  components/addresses/account-tabs.tsx    → Tabs wrapper for account

Modified:
  app/account/page.tsx                    → Tabbed layout with addresses
  app/checkout/page.tsx                   → Address selector + save checkbox
```

---

### Task 1: Address Types

**Files:**
- Create: `types/address.ts`

- [ ] **Step 1: Create the address type definitions**

```typescript
export interface Address {
  documentId: string;
  label: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface AddressFormData {
  label: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface AddressListResponse {
  data: Address[];
}
```

- [ ] **Step 2: Verify types compile**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add types/address.ts
git commit -m "feat: add address type definitions"
```

---

### Task 2: Address API Routes - List/Create

**Files:**
- Create: `app/api/addresses/route.ts`

- [ ] **Step 1: Create GET + POST route handler**

```typescript
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const STRAPI_URL = process.env.STRAPI_URL!;

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = await fetch(`${STRAPI_URL}/api/users/me/addresses`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch addresses" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const res = await fetch(`${STRAPI_URL}/api/users/me/addresses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    return NextResponse.json(
      { error: errorData?.error?.message || "Failed to create address" },
      { status: res.status },
    );
  }

  const data = await res.json();
  return NextResponse.json(data, { status: 201 });
}
```

- [ ] **Step 2: Verify types compile**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/api/addresses/route.ts
git commit -m "feat: add address list/create API routes"
```

---

### Task 3: Address API Routes - Update/Delete

**Files:**
- Create: `app/api/addresses/[id]/route.ts`

- [ ] **Step 1: Create PUT + DELETE route handler**

```typescript
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const STRAPI_URL = process.env.STRAPI_URL!;

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const res = await fetch(`${STRAPI_URL}/api/users/me/addresses/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to update address" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = await fetch(`${STRAPI_URL}/api/users/me/addresses/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to delete address" }, { status: res.status });
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/addresses/[id]/route.ts
git commit -m "feat: add address update/delete API routes"
```

---

### Task 4: Address API Route - Set Default

**Files:**
- Create: `app/api/addresses/[id]/default/route.ts`

- [ ] **Step 1: Create PATCH route handler**

```typescript
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const STRAPI_URL = process.env.STRAPI_URL!;

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = await fetch(`${STRAPI_URL}/api/users/me/addresses/${id}/make-default`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to set default address" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/addresses/[id]/default/route.ts
git commit -m "feat: add address set-default API route"
```

---

### Task 5: Address React Query Hooks

**Files:**
- Create: `hooks/use-addresses.ts`

- [ ] **Step 1: Create the hook**

```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Address, AddressFormData, AddressListResponse } from "@/types/address";

async function fetchAddresses(): Promise<Address[]> {
  const res = await fetch("/api/addresses");
  if (!res.ok) throw new Error("Failed to fetch addresses");
  const data: AddressListResponse = await res.json();
  return data.data;
}

async function createAddress(data: AddressFormData): Promise<Address> {
  const res = await fetch("/api/addresses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Gagal menyimpan alamat");
  }
  const result = await res.json();
  return result.data;
}

async function updateAddress(id: string, data: Partial<AddressFormData>): Promise<Address> {
  const res = await fetch(`/api/addresses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) throw new Error("Gagal mengupdate alamat");
  const result = await res.json();
  return result.data;
}

async function deleteAddress(id: string): Promise<void> {
  const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Gagal menghapus alamat");
}

async function setDefaultAddress(id: string): Promise<Address> {
  const res = await fetch(`/api/addresses/${id}/default`, { method: "PATCH" });
  if (!res.ok) throw new Error("Gagal mengubah alamat utama");
  const result = await res.json();
  return result.data;
}

export function useAddresses() {
  const queryClient = useQueryClient();
  const queryKey = ["addresses"];

  const { data: addresses = [], isLoading } = useQuery({
    queryKey,
    queryFn: fetchAddresses,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Alamat berhasil disimpan");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal menyimpan alamat");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AddressFormData> }) =>
      updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Alamat berhasil diperbarui");
    },
    onError: () => {
      toast.error("Gagal mengupdate alamat");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAddress,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<Address[]>(queryKey);
      queryClient.setQueryData<Address[]>(queryKey, (old) =>
        old ? old.filter((a) => a.documentId !== id) : [],
      );
      return { prev };
    },
    onError: (_err, _id, context) => {
      if (context?.prev) queryClient.setQueryData(queryKey, context.prev);
      toast.error("Gagal menghapus alamat");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: setDefaultAddress,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<Address[]>(queryKey);
      queryClient.setQueryData<Address[]>(queryKey, (old) =>
        old
          ? old.map((a) => ({ ...a, isDefault: a.documentId === id }))
          : [],
      );
      return { prev };
    },
    onError: (_err, _id, context) => {
      if (context?.prev) queryClient.setQueryData(queryKey, context.prev);
      toast.error("Gagal mengubah alamat utama");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    addresses,
    isLoading,
    createAddress: createMutation.mutateAsync,
    updateAddress: updateMutation.mutateAsync,
    deleteAddress: deleteMutation.mutate,
    setDefaultAddress: setDefaultMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
```

- [ ] **Step 2: Verify types compile**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add hooks/use-addresses.ts
git commit -m "feat: add address React Query hooks"
```

---

### Task 6: AddressCard Component

**Files:**
- Create: `components/addresses/address-card.tsx`

- [ ] **Step 1: Create AddressCard component**

```typescript
"use client";

import { MapPin, Pencil, Trash2, Star } from "lucide-react";
import type { Address } from "@/types/address";

interface AddressCardProps {
  address: Address;
  selected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
}

export function AddressCard({
  address,
  selected = false,
  onSelect,
  onEdit,
  onDelete,
  onSetDefault,
}: AddressCardProps) {
  const isClickable = !!onSelect;

  return (
    <div
      onClick={onSelect}
      className={`group relative rounded-lg border p-4 transition-all ${
        isClickable ? "cursor-pointer" : ""
      } ${
        selected
          ? "border-primary ring-2 ring-primary"
          : "border-border hover:shadow-md"
      }`}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onSelect?.();
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {address.label && (
                <span className="text-sm font-semibold text-foreground">
                  {address.label}
                </span>
              )}
              {address.isDefault && (
                <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                  <Star className="mr-1 size-2.5 fill-current" />
                  Utama
                </span>
              )}
            </div>
            <p className="mt-1 text-sm font-medium text-foreground">
              {address.firstName} {address.lastName}
            </p>
            <p className="text-sm text-muted-foreground">{address.phone}</p>
            <p className="text-sm text-muted-foreground">
              {address.addressLine1}
            </p>
            {address.city && (
              <p className="text-sm text-muted-foreground">
                {address.city}
                {address.state ? `, ${address.state}` : ""}
                {address.postalCode ? ` ${address.postalCode}` : ""}
              </p>
            )}
          </div>
        </div>

        {(onEdit || onDelete || onSetDefault) && (
          <div className="flex shrink-0 items-center gap-1">
            {!address.isDefault && onSetDefault && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSetDefault();
                }}
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Jadikan alamat utama"
              >
                <Star className="size-4" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Edit"
              >
                <Pencil className="size-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                title="Hapus"
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/addresses/address-card.tsx
git commit -m "feat: add AddressCard component"
```

---

### Task 7: AddressForm Component

**Files:**
- Create: `components/addresses/address-form.tsx`

- [ ] **Step 1: Create AddressForm component**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add components/addresses/address-form.tsx
git commit -m "feat: add AddressForm component"
```

---

### Task 8: AddressSheet Component

**Files:**
- Create: `components/addresses/address-sheet.tsx`

- [ ] **Step 1: Create AddressSheet component**

```typescript
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
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit Alamat" : "Tambah Alamat"}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Perbarui detail alamat pengiriman"
              : "Isi detail alamat pengiriman baru"}
          </SheetDescription>
        </SheetHeader>
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
                }
              : undefined
          }
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel={isEditing ? "Perbarui" : "Simpan"}
        />
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/addresses/address-sheet.tsx
git commit -m "feat: add AddressSheet component"
```

---

### Task 9: AddressList Component

**Files:**
- Create: `components/addresses/address-list.tsx`

- [ ] **Step 1: Create AddressList component**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add components/addresses/address-list.tsx
git commit -m "feat: add AddressList component with empty state and delete confirm"
```

---

### Task 10: AddressSelector Component (Checkout)

**Files:**
- Create: `components/addresses/address-selector.tsx`

- [ ] **Step 1: Create AddressSelector component**

```typescript
"use client";

import { Plus } from "lucide-react";
import { AddressCard } from "@/components/addresses/address-card";
import type { Address } from "@/types/address";

interface AddressSelectorProps {
  addresses: Address[];
  selectedId: string | null;
  onSelect: (address: Address | null) => void;
  onAddNew: () => void;
}

export function AddressSelector({
  addresses,
  selectedId,
  onSelect,
  onAddNew,
}: AddressSelectorProps) {
  const sorted = [...addresses].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return 0;
  });

  const isAddNewSelected = selectedId === null && addresses.length > 0;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((addr) => (
        <AddressCard
          key={addr.documentId}
          address={addr}
          selected={selectedId === addr.documentId}
          onSelect={() => onSelect(addr)}
        />
      ))}
      <div
        onClick={onAddNew}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border p-6 transition-all hover:border-primary hover:bg-muted/50 ${
          isAddNewSelected
            ? "border-primary ring-2 ring-primary bg-muted/30"
            : ""
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onAddNew();
        }}
      >
        <div className="mb-2 rounded-full bg-secondary p-2">
          <Plus className="size-5 text-muted-foreground" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          Tambah Alamat Baru
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/addresses/address-selector.tsx
git commit -m "feat: add AddressSelector component for checkout"
```

---

### Task 11: AccountTabs Component

**Files:**
- Create: `components/addresses/account-tabs.tsx`

- [ ] **Step 1: Create AccountTabs client component**

```typescript
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
    <Tabs defaultValue="profile">
      <TabsList className="mb-6">
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
```

- [ ] **Step 2: Commit**

```bash
git add components/addresses/account-tabs.tsx
git commit -m "feat: add AccountTabs component"
```

---

### Task 12: Update Account Page

**Files:**
- Modify: `app/account/page.tsx`

- [ ] **Step 1: Rewrite account page to use tabs**

Replace the entire file content with:

```typescript
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
```

- [ ] **Step 2: Verify types compile**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/account/page.tsx
git commit -m "feat: add address tab to account page"
```

---

### Task 13: Update Checkout Page with Address Integration

**Files:**
- Modify: `app/checkout/page.tsx`

Use edit operations on the existing file. Apply edits in order:

- [ ] **Step 1: Add new imports after line 6 `import { useAuth } from "@/hooks/use-auth";`**

```
old: import { useAuth } from "@/hooks/use-auth";
new: import { useAuth } from "@/hooks/use-auth";
     import { useAddresses } from "@/hooks/use-addresses";
     import { AddressSelector } from "@/components/addresses/address-selector";
     import type { Address } from "@/types/address";
```

- [ ] **Step 2: Add address state and effect after `const { isAuthenticated } = useAuth();` (line 22)**

```
old: const { isAuthenticated } = useAuth();
     const router = useRouter();
     const [isSubmitting, setIsSubmitting] = useState(false);
new: const { isAuthenticated } = useAuth();
     const { addresses, createAddress } = useAddresses();
     const router = useRouter();
     const [isSubmitting, setIsSubmitting] = useState(false);
```

- [ ] **Step 3: Add address selector state after `const [notes, setNotes] = useState("");` (line 31)**

```
old: const [notes, setNotes] = useState("");
new: const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
     const [saveAddress, setSaveAddress] = useState(false);
     const [notes, setNotes] = useState("");
```

- [ ] **Step 4: Add effect for auto-select default address. Insert before `const canSubmit = useMemo` block (around line 46)**

```
old: const canSubmit = useMemo(() => {
new: useEffect(() => {
       if (addresses.length > 0 && selectedAddressId === null) {
         const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0];
         setSelectedAddressId(defaultAddr.documentId);
         setShippingAddress({
           firstName: defaultAddr.firstName,
           lastName: defaultAddr.lastName,
           phone: defaultAddr.phone,
           addressLine1: defaultAddr.addressLine1,
         });
       }
     }, [addresses, selectedAddressId]);

     const canSubmit = useMemo(() => {
```

- [ ] **Step 5: Modify `handleInputChange` to clear selected address when user types**

```
old: const handleInputChange = (field: string, value: string) => {
       setShippingAddress((prev) => ({ ...prev, [field]: value }));
     };
new: const handleSelectAddress = (address: Address | null) => {
       if (address) {
         setSelectedAddressId(address.documentId);
         setSaveAddress(false);
         setShippingAddress({
           firstName: address.firstName,
           lastName: address.lastName,
           phone: address.phone,
           addressLine1: address.addressLine1,
         });
       } else {
         setSelectedAddressId(null);
         setSaveAddress(true);
         setShippingAddress({ firstName: "", lastName: "", phone: "", addressLine1: "" });
       }
     };

     const handleInputChange = (field: string, value: string) => {
       setShippingAddress((prev) => ({ ...prev, [field]: value }));
       setSelectedAddressId(null);
       setSaveAddress(true);
     };
```

- [ ] **Step 6: Add AddressSelector JSX inside the form, inside the `<Card>` for "Alamat Pengiriman", before `<CardContent>`. Replace the CardContent section**

The existing Card for shipping address is:
```jsx
<Card className="overflow-visible">
  <CardHeader className="pb-3">
    <CardTitle className="text-sm font-semibold">Alamat Pengiriman</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4 overflow-visible">
    ...
  </CardContent>
</Card>
```

Insert the AddressSelector between CardHeader and CardContent:

```
old:         <CardHeader className="pb-3">
               <CardTitle className="text-sm font-semibold">Alamat Pengiriman</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4 overflow-visible">
new:         <CardHeader className="pb-3">
               <CardTitle className="text-sm font-semibold">Alamat Pengiriman</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4 overflow-visible">
               {isAuthenticated && (
                 <AddressSelector
                   addresses={addresses}
                   selectedId={selectedAddressId}
                   onSelect={handleSelectAddress}
                   onAddNew={() => handleSelectAddress(null)}
                 />
               )}
```

- [ ] **Step 7: Add save address checkbox. In the CardContent, after the last field in the shipping address form (after `<SubdistrictSearch ... />`), add:**

```
old:               <SubdistrictSearch
                     onSelect={(subdistrict) => {
                       setSelectedSubdistrict(subdistrict.id ? subdistrict : null);
                       setSelectedCourier(null);
                     }}
                   />
                 </CardContent>
new:               <SubdistrictSearch
                     onSelect={(subdistrict) => {
                       setSelectedSubdistrict(subdistrict.id ? subdistrict : null);
                       setSelectedCourier(null);
                     }}
                   />
                   {isAuthenticated && saveAddress && (
                     <label className="flex items-center gap-2 text-sm cursor-pointer">
                       <input
                         type="checkbox"
                         checked={saveAddress}
                         onChange={(e) => setSaveAddress(e.target.checked)}
                         className="size-4 rounded border-border accent-primary"
                       />
                       <span>Simpan alamat untuk penggunaan berikutnya</span>
                     </label>
                   )}
                 </CardContent>
```

- [ ] **Step 8: Modify `handleSubmit` to optionally save address before creating order. In the `handleSubmit` function, before `setIsSubmitting(true)`, add:**

```
old:     setIsSubmitting(true);
new:     setIsSubmitting(true);

         if (isAuthenticated && saveAddress && selectedAddressId === null) {
           const fullAddress = selectedSubdistrict
             ? `${shippingAddress.addressLine1}, ${selectedSubdistrict.title}`
             : shippingAddress.addressLine1;
           createAddress({
             label: "",
             firstName: shippingAddress.firstName,
             lastName: shippingAddress.lastName,
             phone: shippingAddress.phone,
             addressLine1: fullAddress,
             city: selectedSubdistrict?.title ?? "",
             state: "",
             postalCode: "",
             country: "Indonesia",
             isDefault: false,
           }).catch(() => {});
         }
```

- [ ] **Step 9: Verify types compile**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

- [ ] **Step 10: Commit**

```bash
git add app/checkout/page.tsx
git commit -m "feat: add address selector and save to checkout page"
```

---

### Task 14: Final Verification

- [ ] **Step 1: Run TypeScript check**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Run linting**

Run: `pnpm run lint`
Expected: No errors (or pre-existing errors only)

- [ ] **Step 3: Verify dev server starts**

Run: `pnpm run dev` (then visit http://localhost:3000/account)
Expected: Account page shows tabs (Profil | Alamat), Address tab loads

- [ ] **Step 4: Test full flow manually**

- [ ] Login → go to /account → click "Alamat" tab → verify empty state
- [ ] Click "Tambah Alamat" → fill form → submit → verify address appears in list
- [ ] Edit address → verify Sheet opens with pre-filled data
- [ ] Set default → verify badge swaps
- [ ] Delete → verify confirm dialog, then address removed
- [ ] Add items to cart → go to /checkout → verify address cards appear
- [ ] Select saved address → verify form auto-fills
- [ ] Click "Tambah Alamat Baru" → verify form clears, save checkbox appears
- [ ] Edit form manually → verify save checkbox appears
- [ ] Complete checkout → verify order created
- [ ] Login as guest (no auth) → go to /checkout → verify no address cards, just form

- [ ] **Step 5: Commit final changes if any**

```bash
git status
git add -A
git commit -m "chore: final verification tweaks"
```
