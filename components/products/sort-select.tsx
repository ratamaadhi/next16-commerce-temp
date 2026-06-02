"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SortSelectProps {
  currentSort?: string;
}

export function SortSelect({ currentSort }: SortSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSort = (value: string | null) => {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`/products?${params.toString()}`);
  };

  return (
    <Select value={currentSort || "terbaru"} onValueChange={handleSort}>
      <SelectTrigger className="w-40">
        <SelectValue placeholder="Urutkan" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="terbaru">Terbaru</SelectItem>
        <SelectItem value="termurah">Termurah</SelectItem>
        <SelectItem value="termahal">Termahal</SelectItem>
        <SelectItem value="nama-az">Nama A-Z</SelectItem>
        <SelectItem value="nama-za">Nama Z-A</SelectItem>
      </SelectContent>
    </Select>
  );
}
