import { Footer as CyraFooter } from "@/components/brand/cyra/layout/footer";
import { Footer as LuminaFooter } from "@/components/brand/lumina/layout/footer";
import { Footer as NoirFooter } from "@/components/brand/noir/layout/footer";
import type { BrandId } from "@/types/brand";

export function BrandFooter({ brand }: { brand: BrandId }) {
  switch (brand) {
    case "lumina":
      return <LuminaFooter />;
    case "noir":
      return <NoirFooter />;
    default:
      return <CyraFooter />;
  }
}
