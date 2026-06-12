# Checkout Address Picker UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the full address grid in checkout with a 3-option UX: selected address card, picker sheet, and add-new action, keeping the same grid layout.

**Architecture:** Rewrite `AddressSelector` to show 3 cards instead of N cards. New `AddressPickerSheet` component for selecting addresses in a bottom sheet. Minimal changes to checkout page state logic (remove fallback to first address when no default exists).

**Tech Stack:** Next.js 15 (App Router), Tailwind CSS 4, @base-ui/react (Sheet), React Query

---

### Task 1: Create AddressPickerSheet component

**Files:**
- Create: `components/addresses/address-picker-sheet.tsx`
- Test: Manual — open sheet, verify address list renders, tap selects + closes

- [ ] **Step 1: Create the component**

```tsx
"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { AddressCard } from "@/components/addresses/address-card";
import type { Address } from "@/types/address";

interface AddressPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addresses: Address[];
  selectedId: string | null;
  onSelect: (address: Address) => void;
}

export function AddressPickerSheet({
  open,
  onOpenChange,
  addresses,
  selectedId,
  onSelect,
}: AddressPickerSheetProps) {
  const sorted = [...addresses].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return 0;
  });

  const handleSelect = (address: Address) => {
    onSelect(address);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[70vh] flex flex-col gap-0 overflow-y-auto p-0">
        <SheetHeader className="p-4 pb-2">
          <SheetTitle>Pilih Alamat</SheetTitle>
          <SheetDescription>
            Pilih alamat pengiriman yang sudah tersimpan
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col px-4 pb-4">
          {sorted.map((addr) => (
            <div key={addr.documentId} className="-mx-1">
              <AddressCard
                address={addr}
                selected={selectedId === addr.documentId}
                onSelect={() => handleSelect(addr)}
              />
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: Verify file was created**

Run: `ls -la components/addresses/address-picker-sheet.tsx`
Expected: File exists, non-empty

---

### Task 2: Rewrite AddressSelector to 3-option UX

**Files:**
- Modify: `components/addresses/address-selector.tsx`

**Changes:** Replace the address list with 3 cards:
1. **Selected address** (or CTA "Belum ada alamat utama" if none)
2. **Pilih Alamat** — compact action card, opens AddressPickerSheet
3. **Tambah Alamat Baru** — dashed border card (same visual as current)

- [ ] **Step 1: Rewrite AddressSelector**

```tsx
"use client";

import { useState } from "react";
import { Plus, ChevronRight, MapPin } from "lucide-react";
import { AddressPickerSheet } from "@/components/addresses/address-picker-sheet";
import type { Address } from "@/types/address";

interface AddressSelectorProps {
  addresses: Address[];
  selectedId: string | null;
  onSelect: (address: Address) => void;
  onAddNew: () => void;
}

export function AddressSelector({
  addresses,
  selectedId,
  onSelect,
  onAddNew,
}: AddressSelectorProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const sorted = [...addresses].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return 0;
  });

  const selectedAddress = selectedId
    ? sorted.find((a) => a.documentId === selectedId) ?? null
    : null;

  const isAddNewSelected = selectedId === null && addresses.length > 0;

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Currently selected address, or CTA when none */}
        {selectedAddress ? (
          <div className="rounded-lg border border-primary ring-2 ring-primary p-4 transition-all">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedAddress.label && (
                    <span className="text-sm font-semibold text-foreground">
                      {selectedAddress.label}
                    </span>
                  )}
                  <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                    {selectedAddress.isDefault ? "Utama" : "Dipilih"}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {selectedAddress.firstName} {selectedAddress.lastName}
                </p>
                <p className="text-sm text-muted-foreground">{selectedAddress.phone}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedAddress.addressLine1}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setIsPickerOpen(true)}
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border p-4 transition-all hover:border-primary hover:bg-muted/50"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setIsPickerOpen(true);
            }}
          >
            <MapPin className="mb-2 size-6 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground text-center">
              Belum ada alamat utama
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              Pilih alamat pengiriman
            </span>
          </div>
        )}

        {/* Card 2: Pilih Alamat — opens picker sheet */}
        <div
          onClick={() => setIsPickerOpen(true)}
          className="flex cursor-pointer items-center justify-between rounded-lg border border-border p-4 transition-all hover:shadow-md hover:border-primary"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setIsPickerOpen(true);
          }}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-secondary p-2">
              <MapPin className="size-4 text-muted-foreground" />
            </div>
            <span className="text-sm font-medium">Pilih Alamat</span>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </div>

        {/* Card 3: Tambah Alamat Baru — toggles to inline form */}
        <div
          onClick={onAddNew}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border p-4 transition-all hover:border-primary hover:bg-muted/50 ${
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

      <AddressPickerSheet
        open={isPickerOpen}
        onOpenChange={setIsPickerOpen}
        addresses={addresses}
        selectedId={selectedId}
        onSelect={onSelect}
      />
    </>
  );
}
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -50`
Expected: No errors related to `address-selector.tsx` or `address-picker-sheet.tsx`

---

### Task 3: Update checkout page state logic

**Files:**
- Modify: `app/checkout/page.tsx`

**Changes:** Remove fallback to first address when no default exists. Line 40 changes from:
```typescript
addresses.find((a) => a.isDefault)?.documentId ?? addresses[0]?.documentId ?? null;
```
to:
```typescript
addresses.find((a) => a.isDefault)?.documentId ?? null;
```

This ensures that when user has addresses but no default, `selectedAddressId` stays `null` and the UI shows "Belum ada alamat utama" CTA.

- [ ] **Step 1: Update the defaultAddressId logic**

In `app/checkout/page.tsx`, line 39-41:

```typescript
const defaultAddressId =
  addresses.find((a) => a.isDefault)?.documentId ?? null;
```

- [ ] **Step 2: Remove unused import**

Since `AddressSelector`'s interface changed (`onSelect` no longer passes `null`), verify the `HandleSelectAddress` function still works:

```typescript
const handleSelectAddress = (address: Address | null) => {
```

This still receives `null` from `onAddNew` path, and `Address` from sheet selection. No change needed.

- [ ] **Step 3: Verify build**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds with no errors

---

### Task 4: Visual verification

- [ ] **Step 1: Start dev server**

Run: `npm run dev` in background

- [ ] **Step 2: Manual test scenarios**

1. User with addresses + default → Card 1 shows default with "Utama" badge
2. User picks different address from sheet → Card 1 updates, badge "Dipilih"
3. Sheet tap outside/close → selection reverts to previous
4. User with addresses, no default → Card 1 shows "Belum ada alamat utama" CTA
5. User taps "Tambah Alamat Baru" → grid hides (via isAddingNewAddress toggle), form appears
6. User submits new address → form collapses, Card 1 shows new address with "Dipilih" badge
7. User with 0 addresses → grid not rendered, only form fields (same as current)
