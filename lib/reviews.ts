import { strapiFetch, StrapiError } from "./strapi";
import type { components } from "@/types/strapi";

type ReviewRequest = components["schemas"]["ReviewRequest"];
type ReviewResponse = components["schemas"]["ReviewResponse"];

export interface ReviewSubmission {
  rating: number;
  title: string;
  comment: string;
  productDocumentId: string;
  orderNumber: string;
  isAnonymous?: boolean;
}

export interface ReviewItem {
  id: number;
  documentId?: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  reviewStatus?: "pending" | "approved" | "rejected";
  createdAt: string;
  user?: {
    id?: number;
    documentId?: string;
    username?: string;
  };
  isAnonymous?: boolean;
  displayName?: string;
}

export async function createReview(
  data: ReviewRequest["data"],
  token: string,
): Promise<ReviewResponse> {
  return strapiFetch<ReviewResponse>(
    "/reviews",
    {},
    {
      method: "POST",
      body: JSON.stringify({ data }),
    },
    token,
  );
}

export { StrapiError };
export type { ReviewResponse };
