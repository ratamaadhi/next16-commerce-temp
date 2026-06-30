"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { WishlistItem } from "@/lib/wishlist";

export function useWishlist() {
  return useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const res = await fetch("/api/wishlist");
      const json = await res.json();
      return (json.data ?? []) as WishlistItem[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useIsInWishlist(productDocumentId: string) {
  const { data: wishlist = [] } = useWishlist();
  return wishlist.some((item) => item.product.documentId === productDocumentId);
}

export function useAddToWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productDocumentId: string) => {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productDocumentId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menambahkan ke wishlist");
      }
      return res.json();
    },
    onMutate: async (productDocumentId) => {
      await queryClient.cancelQueries({ queryKey: ["wishlist"] });
      const previous = queryClient.getQueryData<WishlistItem[]>(["wishlist"]);

      queryClient.setQueryData<WishlistItem[]>(["wishlist"], (old) => [
        ...(old || []),
        {
          id: Date.now(),
          documentId: `optimistic-${Date.now()}`,
          product: { documentId: productDocumentId } as WishlistItem["product"],
          createdAt: new Date().toISOString(),
        },
      ]);

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["wishlist"], context.previous);
      }
      toast.error("Gagal menambahkan ke wishlist");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const res = await fetch(`/api/wishlist/${documentId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menghapus dari wishlist");
      }
      return res.json();
    },
    onMutate: async (documentId) => {
      await queryClient.cancelQueries({ queryKey: ["wishlist"] });
      const previous = queryClient.getQueryData<WishlistItem[]>(["wishlist"]);

      queryClient.setQueryData<WishlistItem[]>(["wishlist"], (old) =>
        (old || []).filter((item) => item.documentId !== documentId),
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["wishlist"], context.previous);
      }
      toast.error("Gagal menghapus dari wishlist");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
}
