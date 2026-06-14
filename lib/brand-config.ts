import type { BrandConfig, BrandId } from "@/types/brand";

export const brandConfigs: Record<BrandId, BrandConfig> = {
  cyra: {
    id: "cyra",
    name: "Cyra",
    metadata: {
      title: "Cyra — Preloved Beauty",
      description:
        "Temukan produk kecantikan preloved terkurasi dari koleksi pribadi Cyra. Asli, terjamin, dan berkualitas.",
    },
  },
  lumina: {
    id: "lumina",
    name: "Lumina",
    metadata: {
      title: "Lumina — Modern Style",
      description:
        "Koleksi modern untuk gaya hidup minimalis. Produk pilihan dengan desain bersih dan fungsional.",
    },
  },
  noir: {
    id: "noir",
    name: "Noir",
    metadata: {
      title: "Noir — Dark Luxury",
      description:
        "Koleksi eksklusif dengan sentuhan dark elegance. Untuk mereka yang menghargai keunikan.",
    },
  },
};
