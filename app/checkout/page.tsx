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
import type { ShippingOption, SubdistrictResult } from "@/lib/shipping";
import { toast } from "sonner";
import { MapPin } from "lucide-react";
import { usePaymentMethods } from "@/hooks/use-payment-methods";
import { PaymentMethodSelector } from "@/components/checkout/payment-method-selector";
import { resolveInitialMethod, type PaymentMethod } from "@/lib/payment";

const TAX_RATE = 0.11;

export default function CheckoutPage() {
  const { items, getTotal, getDiscount, appliedVoucher, setAppliedVoucher, clearCart } = useCartStore();
  const { isAuthenticated } = useAuth();
  const { addresses, createAddress } = useAddresses();
  const router = useRouter();
  const { methods } = usePaymentMethods();
  const [chosenMethod, setChosenMethod] = useState<PaymentMethod | null>(null);
  const paymentMethod = chosenMethod ?? (methods ? resolveInitialMethod(methods) : null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userChosenAddressId, setUserChosenAddressId] = useState<string | null>(null);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [manualAddress, setManualAddress] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    addressLine1: "",
  });
  const [saveAddress, setSaveAddress] = useState(false);

  const defaultAddressId = addresses.find((a) => a.isDefault)?.documentId ?? null;
  const selectedAddressId = userChosenAddressId ?? defaultAddressId;

  const shippingAddress = useMemo(() => {
    if (!isAddingNewAddress && selectedAddressId) {
      const addr = addresses.find((a) => a.documentId === selectedAddressId);
      if (addr) {
        return {
          firstName: addr.firstName,
          lastName: addr.lastName,
          phone: addr.phone,
          addressLine1: addr.addressLine1,
        };
      }
    }
    return manualAddress;
  }, [selectedAddressId, addresses, manualAddress, isAddingNewAddress]);

  const [notes, setNotes] = useState("");

  const [selectedSubdistrict, setSelectedSubdistrict] = useState<SubdistrictResult | null>(null);

  const [selectedCourier, setSelectedCourier] = useState<ShippingOption | null>(null);

  const subtotal = getTotal();
  const discount = getDiscount();
  const tax = Math.round((subtotal - discount) * TAX_RATE);
  const shipping = selectedCourier?.price ?? 0;
  const total = subtotal - discount + tax + shipping;
  const cartDims = useMemo(() => getCartDimensions(items), [items]);

  const autoSubdistrict = useMemo<SubdistrictResult | null>(() => {
    if (isAddingNewAddress || !selectedAddressId) return null;
    const addr = addresses.find((a) => a.documentId === selectedAddressId);
    if (addr?.subdistrictId) {
      return {
        id: Number(addr.subdistrictId),
        name: addr.city || addr.state || "Alamat tersimpan",
        sub_district_name: "",
        city_name: addr.city,
        province_name: addr.state,
        postal_code: addr.postalCode,
      };
    }
    return null;
  }, [selectedAddressId, isAddingNewAddress, addresses]);

  const effectiveSubdistrict = selectedSubdistrict ?? autoSubdistrict;

  const canSubmit = useMemo(() => {
    if (!isAuthenticated) return false;
    if (!shippingAddress.firstName.trim()) return false;
    if (!shippingAddress.lastName.trim()) return false;
    if (!shippingAddress.phone.trim()) return false;
    if (!shippingAddress.addressLine1.trim()) return false;
    if (!effectiveSubdistrict?.id) return false;
    if (!selectedCourier) return false;
    if (!paymentMethod) return false;
    return true;
  }, [isAuthenticated, shippingAddress, effectiveSubdistrict, selectedCourier, paymentMethod]);

  useEffect(() => {
    if (!items.length) {
      router.push("/cart");
    }
  }, [items.length, router]);

  const handleSelectAddress = (address: Address) => {
    setUserChosenAddressId(address.documentId);
    setIsAddingNewAddress(false);
    setSaveAddress(false);
    setSelectedSubdistrict(null);
    setSelectedCourier(null);
  };

  const handleAddNew = () => {
    setIsAddingNewAddress(true);
    setSaveAddress(true);
    setSelectedSubdistrict(null);
    setSelectedCourier(null);
    setManualAddress({ firstName: "", lastName: "", phone: "", addressLine1: "" });
  };

  const handleInputChange = (field: string, value: string) => {
    setManualAddress((prev) => ({ ...prev, [field]: value }));
    setIsAddingNewAddress(true);
    setSaveAddress(true);
    setSelectedSubdistrict(null);
    setSelectedCourier(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    if (!effectiveSubdistrict?.id) {
      toast.error("Silakan pilih kecamatan atau kelurahan");
      return;
    }

    if (!selectedCourier) {
      toast.error("Silakan pilih kurir pengiriman");
      return;
    }

    setIsSubmitting(true);

    if (isAuthenticated && saveAddress && isAddingNewAddress) {
      const fullAddress = effectiveSubdistrict?.sub_district_name
        ? `${shippingAddress.addressLine1}, ${effectiveSubdistrict.sub_district_name}`
        : shippingAddress.addressLine1;
      createAddress({
        label: "",
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        phone: shippingAddress.phone,
        addressLine1: fullAddress,
        city: effectiveSubdistrict?.city_name ?? "",
        state: effectiveSubdistrict?.province_name ?? "",
        postalCode: effectiveSubdistrict?.postal_code ?? "",
        country: "Indonesia",
        isDefault: false,
        subdistrictId: effectiveSubdistrict?.id.toString(),
      }).catch((err) => {
        console.error(err);
        debugger;
      });
    }

    try {
      const fullAddress = effectiveSubdistrict?.sub_district_name
        ? `${shippingAddress.addressLine1}, ${effectiveSubdistrict.sub_district_name}`
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
            city: effectiveSubdistrict?.city_name ?? "",
            state: effectiveSubdistrict?.province_name ?? "",
            postalCode: effectiveSubdistrict?.postal_code ?? "",
            country: "Indonesia",
          },
          billingAddress: {
            ...shippingAddress,
            addressLine1: fullAddress,
            city: effectiveSubdistrict?.city_name ?? "",
            state: effectiveSubdistrict?.province_name ?? "",
            postalCode: effectiveSubdistrict?.postal_code ?? "",
            country: "Indonesia",
          },
          notes: shippingNotes,
          subtotal,
          discount,
          tax,
          shippingCost: shipping,
          totalAmount: total,
          currency: "IDR",
          paymentMethod,
          voucherDocumentId: appliedVoucher?.documentId ?? null,
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
        const knownVoucherErrors = new Set([
          "Voucher tidak ditemukan",
          "Voucher tidak aktif",
          "Voucher belum berlaku",
          "Voucher sudah kadaluarsa",
          "Kuota voucher sudah habis",
          "Voucher ini sudah pernah kamu pakai",
        ]);
        if (knownVoucherErrors.has(message) || message.startsWith("Minimal belanja Rp")) {
          setAppliedVoucher(null);
        }
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
                    onAddNew={handleAddNew}
                    isAddingNew={isAddingNewAddress}
                  />
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nama Depan</Label>
                    <Input
                      required
                      value={shippingAddress.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nama Belakang</Label>
                    <Input
                      required
                      value={shippingAddress.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Telepon</Label>
                  <Input
                    required
                    type="tel"
                    value={shippingAddress.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Alamat</Label>
                  <Input
                    required
                    value={shippingAddress.addressLine1}
                    onChange={(e) => handleInputChange("addressLine1", e.target.value)}
                  />
                </div>
                {isAddingNewAddress ||
                !selectedAddressId ||
                !addresses.find((a) => a.documentId === selectedAddressId)?.subdistrictId ? (
                  <SubdistrictSearch
                    onSelect={(subdistrict) => {
                      setSelectedSubdistrict(subdistrict?.id ? subdistrict : null);
                      setSelectedCourier(null);
                    }}
                  />
                ) : (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Kecamatan / Kelurahan</Label>
                    <div className="flex items-center justify-between h-9 px-3 py-2 rounded-md border border-input bg-muted/30 text-xs">
                      <span className="flex items-center gap-1.5 min-w-0">
                        <MapPin className="size-3 shrink-0 text-muted-foreground" />
                        <span className="truncate">
                          {effectiveSubdistrict?.city_name}
                          {effectiveSubdistrict?.province_name
                            ? `, ${effectiveSubdistrict.province_name}`
                            : ""}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setUserChosenAddressId(null);
                          setIsAddingNewAddress(true);
                          setSaveAddress(true);
                          setSelectedSubdistrict(null);
                          setSelectedCourier(null);
                          setManualAddress({
                            firstName: "",
                            lastName: "",
                            phone: "",
                            addressLine1: "",
                          });
                        }}
                        className="text-primary hover:underline text-xs shrink-0 ml-2"
                      >
                        Ubah
                      </button>
                    </div>
                  </div>
                )}
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

            {effectiveSubdistrict && effectiveSubdistrict.id > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Ongkos Kirim</CardTitle>
                </CardHeader>
                <CardContent>
                  <ShippingOptions
                    key={`${effectiveSubdistrict.id}-${cartDims.weight}-${cartDims.length}-${cartDims.width}-${cartDims.height}`}
                    destinationId={effectiveSubdistrict.id}
                    destinationTitle={effectiveSubdistrict.name}
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
                <Input
                  placeholder="Catatan untuk pesanan (opsional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </CardContent>
            </Card>

            {methods && (
              <PaymentMethodSelector
                methods={methods}
                value={paymentMethod}
                onChange={setChosenMethod}
              />
            )}
          </div>

          <div className="lg:col-span-1">
            <OrderSummary
              items={items}
              subtotal={subtotal}
              discount={discount}
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
