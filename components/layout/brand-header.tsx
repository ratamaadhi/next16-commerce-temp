import { Header as CyraHeader } from "@/components/brand/cyra/layout/header";
import { Header as LuminaHeader } from "@/components/brand/lumina/layout/header";
import { Header as NoirHeader } from "@/components/brand/noir/layout/header";
import type { BrandId } from "@/types/brand";

export function BrandHeader({ brand }: { brand: BrandId }) {
  switch (brand) {
    case "lumina":
      return <LuminaHeader />;
    case "noir":
      return <NoirHeader />;
    default:
      return <CyraHeader />;
  }
}
