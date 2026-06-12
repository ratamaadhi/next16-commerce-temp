"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useAddresses } from "@/hooks/use-addresses";
import { AddressSelector } from "@/components/addresses/address-selector";
import type { Address } from "@/types/address";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderSummary } from "@/components/checkout/order-summary";
import { SubdistrictSearch } from "@/components/checkout/subdistrict-search";
import { ShippingOptions } from "@/components/checkout/shipping-options";
import { getCartDimensions } from "@/lib/shipping";
import type { ShippingOption } from "@/lib/shipping";
import { toast } from "sonner";

const TAX_RATE = 0.11;

export default function CheckoutPage() {
  const { items, getTotal, clearCart } = useCartStore();
  const { isAuthenticated } = useAuth();
  const { addresses, createAddress } = useAddresses();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [saveAddress, setSaveAddress] = useState(false);

  const [shippingAddress, setShippingAddress] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    addressLine1: "",
  });
  const [notes, setNotes] = useState("");

  const [selectedSubdistrict, setSelectedSubdistrict] = useState<{
    id: number;
    title: string;
  } | null>(null);

  const [selectedCourier, setSelectedCourier] = useState<ShippingOption | null>(null);

  const subtotal = getTotal();
  const tax = Math.round(subtotal * TAX_RATE);
  const shipping = selectedCourier?.price ?? 0;
  const total = subtotal + tax + shipping;
  const cartDims = useMemo(() => getCartDimensions(items), [items]);

  useEffect(() => {
    if (addresses.length > 0 && selectedAddressId === null) {
      const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0];
      setSelectedAddressId(defaultAddr.documentId);
      setShippingAddress({
        firstName: defaultAddr.firstName,
        lastName: defaultAddr.lastName,
        phone: defaultAddr.phone,
        addressLine1: defaultAddr.addressLine1,
      });
    }
  }, [addresses, selectedAddressId]);

  const canSubmit = useMemo(() => {
    if (!isAuthenticated) return false;
    if (!shippingAddress.firstName.trim()) return false;
    if (!shippingAddress.lastName.trim()) return false;
    if (!shippingAddress.phone.trim()) return false;
    if (!shippingAddress.addressLine1.trim()) return false;
    if (!selectedSubdistrict?.id) return false;
    if (!selectedCourier) return false;
    return true;
  }, [isAuthenticated, shippingAddress, selectedSubdistrict, selectedCourier]);

  useEffect(() => {
    if (!items.length) {
      router.push("/cart");
    }
  }, [items.length, router]);

  const handleSelectAddress = (address: Address | null) => {
    if (address) {
      setSelectedAddressId(address.documentId);
      setSaveAddress(false);
      setShippingAddress({
        firstName: address.firstName,
        lastName: address.lastName,
        phone: address.phone,
        addressLine1: address.addressLine1,
      });
    } else {
      setSelectedAddressId(null);
      setSaveAddress(true);
      setShippingAddress({ firstName: "", lastName: "", phone: "", addressLine1: "" });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }));
    setSelectedAddressId(null);
    setSaveAddress(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    if (!selectedSubdistrict?.id) {
      toast.error("Silakan pilih kecamatan atau kelurahan");
      return;
    }

    if (!selectedCourier) {
      toast.error("Silakan pilih kurir pengiriman");
      return;
    }

    setIsSubmitting(true);

    if (isAuthenticated && saveAddress && selectedAddressId === null) {
      const fullAddress = selectedSubdistrict
        ? `${shippingAddress.addressLine1}, ${selectedSubdistrict.title}`
        : shippingAddress.addressLine1;
      createAddress({
        label: "",
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        phone: shippingAddress.phone,
        addressLine1: fullAddress,
        city: selectedSubdistrict?.title ?? "",
        state: "",
        postalCode: "",
        country: "Indonesia",
        isDefault: false,
      }).catch(() => {});
    }

    try {
      const fullAddress = selectedSubdistrict
        ? `${shippingAddress.addressLine1}, ${selectedSubdistrict.title}`
        : shippingAddress.addressLine1;

      const shippingNotes = selectedCourier
        ? `${notes ? notes + " | " : ""}Kurir: ${selectedCourier.name}`
        : notes;

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productName: item.name,
            productDocumentId: item.productDocumentId,
            productId: item.productId,
            productSku: item.productSku,
            quantity: String(item.quantity),
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            variantInfo: item.variantName,
            variantSku: item.variantSku,
            imageUrl: item.image ?? undefined,
          })),
          shippingAddress: {
            ...shippingAddress,
            addressLine1: fullAddress,
            city: selectedSubdistrict?.title ?? "",
            state: "",
            postalCode: "",
            country: "Indonesia",
          },
          billingAddress: {
            ...shippingAddress,
            addressLine1: fullAddress,
            city: selectedSubdistrict?.title ?? "",
            state: "",
            postalCode: "",
            country: "Indonesia",
          },
          notes: shippingNotes,
          subtotal,
          tax,
          shippingCost: shipping,
          totalAmount: total,
          currency: "IDR",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message =
          errorData?.error?.error?.error?.message ||
          errorData?.error?.error?.message ||
          errorData?.error?.message ||
          "Gagal membuat pesanan";
        console.error("Checkout error response:", errorData);
        toast.error(message);
        return;
      }

      const order = await response.json();
      const cartDocId = useCartStore.getState().cartDocumentId;
      clearCart();
      if (cartDocId) {
        fetch(`/api/cart/${cartDocId}`, { method: "DELETE" }).catch(() => {});
      }
      toast.success("Pesanan berhasil dibuat!");
      window.location.href = `/orders/${order.data.orderNumber}`;
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error("Terjadi kesalahan, silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!items.length) return null;

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-xl font-semibold mb-6">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <Card className="overflow-visible">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Alamat Pengiriman</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 overflow-visible">
          {isAuthenticated && addresses.length > 0 && (
            <AddressSelector
              addresses={addresses}
              selectedId={selectedAddressId}
              onSelect={handleSelectAddress}
              onAddNew={() => handleSelectAddress(null)}
            />
          )}
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
        <SubdistrictSearch
          onSelect={(subdistrict) => {
            setSelectedSubdistrict(subdistrict.id ? subdistrict : null);
            setSelectedCourier(null);
          }}
        />
        {isAuthenticated && saveAddress && (
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={saveAddress}
              onChange={(e) => setSaveAddress(e.target.checked)}
              className="size-4 rounded border-border accent-primary"
            />
            <span>Simpan alamat untuk penggunaan berikutnya</span>
          </label>
        )}
      </CardContent>
            </Card>

            {selectedSubdistrict && selectedSubdistrict.id > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Ongkos Kirim</CardTitle>
                </CardHeader>
                <CardContent>
                  <ShippingOptions
                    key={`${selectedSubdistrict.id}-${cartDims.weight}-${cartDims.length}-${cartDims.width}-${cartDims.height}`}
                    destinationId={selectedSubdistrict.id}
                    destinationTitle={selectedSubdistrict.title}
                    weight={cartDims.weight}
                    length={cartDims.length}
                    width={cartDims.width}
                    height={cartDims.height}
                    onSelect={(option) => {
                      setSelectedCourier(option);
                    }}
                  />
                </CardContent>
              </Card>
            )}

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
              selectedCourier={selectedCourier}
              total={total}
              isSubmitting={isSubmitting}
              isAuthenticated={isAuthenticated}
              canSubmit={canSubmit}
            />
          </div>
        </div>
      </form>
    </main>
  );
}
