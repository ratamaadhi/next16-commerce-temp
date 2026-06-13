import { strapiFetch, StrapiError } from "./strapi";
import type { components } from "@/types/strapi";

type ReviewRequest = components["schemas"]["ReviewRequest"];
type ReviewResponse = components["schemas"]["ReviewResponse"];

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
