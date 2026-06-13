"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquareText } from "lucide-react";
import { ReviewForm } from "./review-form";

interface ReviewDialogProps {
  productDocumentId: string;
  productName?: string;
  orderNumber: string;
}

export function ReviewDialog({ productDocumentId, productName, orderNumber }: ReviewDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <MessageSquareText className="size-3.5" />
        Tulis Review
      </Button>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tulis Review</DialogTitle>
          <DialogDescription>
            {productName ? (
              <>Bagikan pengalaman Anda menggunakan <span className="font-medium text-foreground">{productName}</span></>
            ) : (
              "Bagikan pengalaman Anda dengan produk ini"
            )}
          </DialogDescription>
        </DialogHeader>

        <ReviewForm
          productDocumentId={productDocumentId}
          orderNumber={orderNumber}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
