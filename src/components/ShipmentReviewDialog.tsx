import { useEffect, useState } from "react";
import { Star } from "lucide-react";

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
          <DialogTitle>Valorar transportista</DialogTitle>
          <DialogDescription>
            Esta valoracion se guardara en el perfil de {travelerName} cuando el envio ya haya sido entregado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="mb-3 text-sm font-medium text-foreground">Puntuacion</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className="rounded-full p-2 transition-transform hover:scale-105"
                  aria-label={`Puntuar con ${value} estrellas`}
                >
                  <Star
                    className={`h-6 w-6 ${value <= rating ? "fill-warning text-warning" : "text-muted-foreground/40"}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Comentario</p>
            <Textarea
              rows={4}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Cuenta brevemente como fue la experiencia."
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => void onSubmit(rating, comment)} disabled={saving}>
            {saving ? "Guardando..." : "Guardar valoracion"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShipmentReviewDialog;
