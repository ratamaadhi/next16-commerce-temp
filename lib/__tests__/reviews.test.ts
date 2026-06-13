import { describe, it, expect, vi, beforeEach } from "vitest";
import { createReview } from "../reviews";

const { mockStrapiFetch, MockStrapiError } = vi.hoisted(() => ({
  mockStrapiFetch: vi.fn(),
  MockStrapiError: class extends Error {
    status: number;
    constructor(message: string, status: number, public details?: unknown) {
      super(message);
      this.name = "StrapiError";
      this.status = status;
    }
  },
}));

vi.mock("../strapi", () => ({
  strapiFetch: (...args: unknown[]) => mockStrapiFetch(...args),
  StrapiError: MockStrapiError,
}));

const mockToken = "valid-jwt-token";

const mockReviewData = {
  rating: 5,
  title: "Great product",
  comment: "Really love this!",
  reviewStatus: "pending" as const,
  product: "prod-doc-1",
};

describe("createReview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls strapiFetch with correct POST endpoint and body", async () => {
    mockStrapiFetch.mockResolvedValueOnce({
      data: { id: 1, documentId: "rev-doc-1", rating: 5, title: "Great product", comment: "Really love this!", reviewStatus: "pending" },
      meta: {},
    });

    await createReview(mockReviewData, mockToken);

    expect(mockStrapiFetch).toHaveBeenCalledWith(
      "/reviews",
      {},
      { method: "POST", body: JSON.stringify(mockReviewData) },
      mockToken,
    );
  });

  it("throws StrapiError on failure", async () => {
    mockStrapiFetch.mockRejectedValueOnce(new MockStrapiError("Bad Request", 400));
    await expect(createReview(mockReviewData, mockToken)).rejects.toThrow(MockStrapiError);
  });
});
