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
