import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Calendar, MapPin, Package, Plus, Trash2 } from "lucide-react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createTrip, getFriendlyErrorMessage, getTripById, type CargooTripDetails } from "@/lib/cargoo-store";

const NewTripPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading: authLoading, profile, profileLoading } = useAuth();
  const reuseTripId = searchParams.get("reuseTrip") ?? "";
  const [form, setForm] = useState({
    origin: "",
    destination: "",
    date: "",
    capacity: "",
    notes: "",
  });
  const [routeStops, setRouteStops] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [reusingTrip, setReusingTrip] = useState<CargooTripDetails | null>(null);
  const [reuseLoading, setReuseLoading] = useState(Boolean(reuseTripId));
  const [reuseAppliedId, setReuseAppliedId] = useState("");
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addRouteStop = () => {
    setRouteStops((prev) => [...prev, ""]);
  };

  const updateRouteStop = (index: number, value: string) => {
    setRouteStops((prev) => prev.map((stop, stopIndex) => (stopIndex === index ? value : stop)));
  };

  const removeRouteStop = (index: number) => {
    setRouteStops((prev) => prev.filter((_, stopIndex) => stopIndex !== index));
  };

  const openDatePicker = () => {
    const dateInput = dateInputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
    if (!dateInput) {
      return;
    }

    dateInput.focus();

    if (typeof dateInput.showPicker === "function") {
      dateInput.showPicker();
      return;
    }

    dateInput.click();
  };

  useEffect(() => {
    if (!reuseTripId) {
      setReuseLoading(false);
      return;
    }

    if (reuseAppliedId === reuseTripId || authLoading || profileLoading || !profile?.isTraveler) {
      return;
    }

    const loadReuseTrip = async () => {
      setReuseLoading(true);

      try {
        const trip = await getTripById(reuseTripId);

        if (!trip) {
          throw new Error("No se encontro el viaje que querias reutilizar.");
        }

        setForm({
          origin: trip.origin,
          destination: trip.destination,
          date: trip.status === "completed" ? "" : trip.date,
          capacity: String(trip.capacityKg),
          notes: trip.notes,
        });
        setRouteStops(trip.stops.slice(1, -1).map((stop) => stop.city));
        setReusingTrip(trip);
        setReuseAppliedId(reuseTripId);
      } catch (error) {
        toast.error(getFriendlyErrorMessage(error));
      } finally {
        setReuseLoading(false);
      }
    };

    void loadReuseTrip();
  }, [authLoading, profile, profileLoading, reuseAppliedId, reuseTripId]);

  const reusedTripDate = useMemo(() => {
    if (!reusingTrip) {
      return "";
    }

    return new Date(`${reusingTrip.date}T00:00:00`).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [reusingTrip]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      const cleanedRouteStops = routeStops.map((stop) => stop.trim()).filter(Boolean);

      const trip = await createTrip({
        origin: form.origin,
        destination: form.destination,
        date: form.date,
        capacityKg: Number(form.capacity),
        routeStops: cleanedRouteStops,
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

  if (reuseLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>

      <h1 className="mb-6 text-2xl font-display font-bold">Publicar viaje</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {reusingTrip ? (
          <div className="rounded-xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Trayecto reutilizado</p>
            <p className="mt-1">
              Hemos copiado la ruta, las paradas y la capacidad del viaje anterior {reusingTrip.origin} {"->"} {reusingTrip.destination}
              {reusedTripDate ? ` del ${reusedTripDate}` : ""}. Solo revisa la nueva fecha y publica.
            </p>
          </div>
        ) : null}

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

        <div className="space-y-3">
          <Button type="button" variant="outline" className="w-full justify-start gap-2 border-dashed" onClick={addRouteStop}>
            <Plus className="h-4 w-4" />
            Agregar ciudades en la ruta
          </Button>

          {routeStops.map((stop, index) => (
            <div key={`route-stop-${index}`} className="rounded-xl border border-border/80 bg-secondary/20 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <Label className="text-xs font-medium text-muted-foreground">Parada intermedia {index + 1}</Label>
                <button
                  type="button"
                  onClick={() => removeRouteStop(index)}
                  className="text-muted-foreground transition-colors hover:text-destructive"
                  aria-label={`Eliminar parada ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                <Input
                  placeholder="Ciudad donde puedes recoger o entregar"
                  className="pl-10"
                  value={stop}
                  onChange={(event) => updateRouteStop(index, event.target.value)}
                />
              </div>
            </div>
          ))}

          <p className="text-xs text-muted-foreground">
            Estas ciudades apareceran en el buscador como paradas validas para recoger o entregar paquetes.
          </p>
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
            <div className="relative cursor-pointer" onClick={openDatePicker}>
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={dateInputRef}
                type="date"
                className="cargoo-date-input cursor-pointer pl-10 pr-3"
                value={form.date}
                onChange={(event) => update("date", event.target.value)}
                required
              />
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
