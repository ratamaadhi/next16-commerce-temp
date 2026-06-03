"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderSummary } from "@/components/checkout/order-summary";

const TAX_RATE = 0.11;
const SHIPPING_COST = 15000;
const FREE_SHIPPING_THRESHOLD = 200000;

export default function CheckoutPage() {
  const { items, getTotal, clearCart } = useCartStore();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [shippingAddress, setShippingAddress] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    addressLine1: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Indonesia",
  });
  const [notes, setNotes] = useState("");

  const subtotal = getTotal();
  const tax = Math.round(subtotal * TAX_RATE);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + tax + shipping;

  useEffect(() => {
    if (!items.length) {
      router.push("/cart");
    }
  }, [items.length, router]);

  const handleInputChange = (field: string, value: string) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productName: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            variantInfo: item.variantName,
          })),
          shippingAddress,
          billingAddress: shippingAddress,
          notes,
          subtotal,
          tax,
          shippingCost: shipping,
          totalAmount: total,
          currency: "IDR",
        }),
      });

      if (!response.ok) throw new Error("Gagal membuat pesanan");

      const order = await response.json();
      clearCart();
      router.push(`/orders/${order.data.orderNumber}`);
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!items.length) return null;

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-xl font-semibold mb-6">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Alamat Pengiriman</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nama Depan</Label>
                    <Input required value={shippingAddress.firstName} onChange={(e) => handleInputChange("firstName", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nama Belakang</Label>
                    <Input required value={shippingAddress.lastName} onChange={(e) => handleInputChange("lastName", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Telepon</Label>
                  <Input required type="tel" value={shippingAddress.phone} onChange={(e) => handleInputChange("phone", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Alamat</Label>
                  <Input required value={shippingAddress.addressLine1} onChange={(e) => handleInputChange("addressLine1", e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Kota</Label>
                    <Input required value={shippingAddress.city} onChange={(e) => handleInputChange("city", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Provinsi</Label>
                    <Input required value={shippingAddress.state} onChange={(e) => handleInputChange("state", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Kode Pos</Label>
                    <Input required value={shippingAddress.postalCode} onChange={(e) => handleInputChange("postalCode", e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Catatan</CardTitle>
              </CardHeader>
              <CardContent>
                <Input placeholder="Catatan untuk pesanan (opsional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <OrderSummary
              items={items}
              subtotal={subtotal}
              tax={tax}
              shipping={shipping}
              total={total}
              isSubmitting={isSubmitting}
              isAuthenticated={isAuthenticated}
            />
          </div>
        </div>
      </form>
    </main>
  );
}
