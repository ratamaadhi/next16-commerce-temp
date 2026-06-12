import type { Address } from "@/types/address";

export function sortAddressesByDefault(addresses: Address[]): Address[] {
  return [...addresses].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return 0;
  });
}
