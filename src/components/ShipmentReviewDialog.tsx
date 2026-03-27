import { useEffect, useState } from "react";
import { Star } from "lucide-react";

import { useLocale } from "@/contexts/LocaleContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface ShipmentReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (rating: number, comment: string) => Promise<void> | void;
  saving?: boolean;
  travelerName: string;
}

const ShipmentReviewDialog = ({ open, onOpenChange, onSubmit, saving = false, travelerName }: ShipmentReviewDialogProps) => {
  const { messages } = useLocale();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!open) {
      setRating(5);
      setComment("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{messages.shipmentReviewDialog.title}</DialogTitle>
          <DialogDescription>{messages.shipmentReviewDialog.description(travelerName)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="mb-3 text-sm font-medium text-foreground">{messages.shipmentReviewDialog.rating}</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className="rounded-full p-2 transition-transform hover:scale-105"
                  aria-label={messages.shipmentReviewDialog.rateWithStars(value)}
                >
                  <Star
                    className={`h-6 w-6 ${value <= rating ? "fill-warning text-warning" : "text-muted-foreground/40"}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">{messages.shipmentReviewDialog.comment}</p>
            <Textarea
              rows={4}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder={messages.shipmentReviewDialog.commentPlaceholder}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {messages.common.cancel}
          </Button>
          <Button type="button" onClick={() => void onSubmit(rating, comment)} disabled={saving}>
            {saving ? messages.common.saving : messages.shipmentReviewDialog.saveReview}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShipmentReviewDialog;
