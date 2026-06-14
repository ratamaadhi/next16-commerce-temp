export type BrandId = "cyra" | "lumina" | "noir";

export interface BrandConfig {
  id: BrandId;
  name: string;
  metadata: {
    title: string;
    description: string;
  };
}
