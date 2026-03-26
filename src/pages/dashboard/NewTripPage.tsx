import { useState } from "react";
import { ArrowLeft, Calendar, MapPin, Package } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createTrip, getFriendlyErrorMessage } from "@/lib/cargoo-store";

const NewTripPage = () => {
  const navigate = useNavigate();
  const { loading: authLoading, profile, profileLoading } = useAuth();
  const [form, setForm] = useState({
    origin: "",
    destination: "",
    date: "",
    capacity: "",
    routeStops: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      const routeStops = form.routeStops
        .split(/\n|,/)
        .map((stop) => stop.trim())
        .filter(Boolean);

      const trip = await createTrip({
        origin: form.origin,
        destination: form.destination,
        date: form.date,
        capacityKg: Number(form.capacity),
        routeStops,
        notes: form.notes || "Sin notas adicionales.",
      });

      toast.success("Viaje publicado correctamente.");
      navigate(`/app/trips/${trip.id}`);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (profile && !profile.isTraveler) {
    return <Navigate to="/app/search" replace />;
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>

      <h1 className="mb-6 text-2xl font-display font-bold">Publicar viaje</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label>Origen</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            <Input
              placeholder="Ciudad, pais"
              className="pl-10"
              value={form.origin}
              onChange={(event) => update("origin", event.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Destino</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
            <Input
              placeholder="Ciudad, pais"
              className="pl-10"
              value={form.destination}
              onChange={(event) => update("destination", event.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Fecha del viaje</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="date" className="pl-10" value={form.date} onChange={(event) => update("date", event.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Capacidad (kg)</Label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number"
                placeholder="10"
                className="pl-10"
                min="1"
                value={form.capacity}
                onChange={(event) => update("capacity", event.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Ciudades de paso</Label>
          <Textarea
            placeholder={"Una ciudad por linea\nLyon\nBarcelona"}
            rows={3}
            value={form.routeStops}
            onChange={(event) => update("routeStops", event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Opcional. El conductor solo vera un boton para avanzar a la siguiente ciudad de esta lista.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Notas adicionales</Label>
          <Textarea
            placeholder="Tipo de objetos que aceptas, restricciones o puntos de entrega"
            rows={3}
            value={form.notes}
            onChange={(event) => update("notes", event.target.value)}
          />
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={saving}>
          {saving ? "Publicando..." : "Publicar viaje"}
        </Button>
      </form>
    </div>
  );
};

export default NewTripPage;
