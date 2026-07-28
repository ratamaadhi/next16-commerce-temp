import { strapiFetch, StrapiError } from "./strapi";
import type { components } from "@/types/strapi";

type Order = components["schemas"]["Order"];
type OrderListResponse = components["schemas"]["OrderListResponse"];
type OrderResponse = components["schemas"]["OrderResponse"];
type OrderRequest = components["schemas"]["OrderRequest"];

export async function getOrders(token: string) {
  return strapiFetch<OrderListResponse>(
    "/orders",
    {
      populate: "*",
      sort: ["createdAt:desc"],
      pagination: { pageSize: 50 },
    },
    {},
    token,
  );
}

export async function getOrderByNumber(orderNumber: string, token: string) {
  return strapiFetch<OrderListResponse>(
    "/orders",
    {
      filters: { orderNumber: { $eq: orderNumber } },
      populate: {
        items: true,
        shippingAddress: true,
        billingAddress: true,
        manualPayment: { populate: { proofs: { populate: "image" } } },
      },
    },
    {},
    token,
  );
}

export async function createOrder(
  data: OrderRequest["data"],
  token: string,
): Promise<OrderResponse> {
  return strapiFetch<OrderResponse>(
    "/orders",
    {},
    {
      method: "POST",
      body: JSON.stringify({ data }),
    },
    token,
  );
}

export { StrapiError };
export type { Order, OrderListResponse, OrderResponse, OrderRequest };
