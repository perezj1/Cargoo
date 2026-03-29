import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Calendar, CarFront, MapPin, Package, Plus, Trash2 } from "lucide-react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createTrip, getFriendlyErrorMessage, getTripById, type CargooTripDetails, type TripRecurrence } from "@/lib/cargoo-store";
import { formatTripScheduleLabel } from "@/lib/trip-schedule";

const NewTripPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading: authLoading, profile, profileLoading } = useAuth();
  const { intlLocale, messages } = useLocale();
  const reuseTripId = searchParams.get("reuseTrip") ?? "";
  const [form, setForm] = useState({
    origin: "",
    destination: "",
    date: "",
    recurrence: "once" as TripRecurrence,
    vehicleType: "",
    capacity: "",
    notes: "",
  });
  const [routeStops, setRouteStops] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [reusingTrip, setReusingTrip] = useState<CargooTripDetails | null>(null);
  const [reuseLoading, setReuseLoading] = useState(Boolean(reuseTripId));
  const [reuseAppliedId, setReuseAppliedId] = useState("");
  const [preferredVehicleApplied, setPreferredVehicleApplied] = useState(false);
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateRecurrence = (value: string) => {
    const recurrence = value as TripRecurrence;

    setForm((prev) => ({
      ...prev,
      recurrence,
      date: recurrence === "once" ? prev.date || minTripDate : "",
    }));
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
    if (reuseTripId || preferredVehicleApplied || !profile) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      vehicleType: prev.vehicleType || profile.vehicleType,
    }));
    setPreferredVehicleApplied(true);
  }, [preferredVehicleApplied, profile, reuseTripId]);

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
          throw new Error(messages.newTripPage.reuseTripNotFound);
        }

        setForm({
          origin: trip.origin,
          destination: trip.destination,
          date: trip.recurrence === "once" && trip.status !== "completed" ? trip.date : "",
          recurrence: trip.recurrence,
          vehicleType: trip.vehicleType,
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
  }, [authLoading, messages.newTripPage.reuseTripNotFound, profile, profileLoading, reuseAppliedId, reuseTripId]);

  const reusedTripSchedule = useMemo(() => {
    if (!reusingTrip) {
      return "";
    }

    return formatTripScheduleLabel({
      date: reusingTrip.date,
      recurrence: reusingTrip.recurrence,
      intlLocale,
      weeklyLabel: messages.common.weeklyRoute,
      monthlyLabel: messages.common.monthlyRoute,
      format: "short",
    });
  }, [intlLocale, messages.common.monthlyRoute, messages.common.weeklyRoute, reusingTrip]);

  const minTripDate = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = `${today.getMonth() + 1}`.padStart(2, "0");
    const day = `${today.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const recurrenceHint =
    form.recurrence === "weekly"
      ? messages.newTripPage.recurrenceHintWeekly
      : form.recurrence === "monthly"
        ? messages.newTripPage.recurrenceHintMonthly
        : messages.newTripPage.recurrenceHintOnce;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (form.recurrence === "once" && (!form.date || form.date < minTripDate)) {
      toast.error(messages.newTripPage.pastDateError);
      return;
    }

    setSaving(true);

    try {
      const cleanedRouteStops = routeStops.map((stop) => stop.trim()).filter(Boolean);
      const trip = await createTrip({
        origin: form.origin,
        destination: form.destination,
        date: form.recurrence === "once" ? form.date : "",
        recurrence: form.recurrence,
        vehicleType: form.vehicleType,
        capacityKg: Number(form.capacity),
        routeStops: cleanedRouteStops,
        notes: form.notes || messages.newTripPage.defaultNotes,
      });

      toast.success(messages.newTripPage.tripPublished);
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
        <ArrowLeft className="h-4 w-4" /> {messages.common.back}
        </button>

      <h1 className="mb-6 text-2xl font-display font-bold">{messages.newTripPage.title}</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {reusingTrip ? (
          <div className="rounded-xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{messages.newTripPage.reusedTitle}</p>
            <p className="mt-1">{messages.newTripPage.reusedDescription(reusingTrip.origin, reusingTrip.destination, reusedTripSchedule)}</p>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label>{messages.newTripPage.originLabel}</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            <Input
              placeholder={messages.newTripPage.originPlaceholder}
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
            {messages.newTripPage.addRouteStops}
          </Button>

          {routeStops.map((stop, index) => (
            <div key={`route-stop-${index}`} className="rounded-xl border border-border/80 bg-secondary/20 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <Label className="text-xs font-medium text-muted-foreground">{messages.newTripPage.stopLabel(index + 1)}</Label>
                <button
                  type="button"
                  onClick={() => removeRouteStop(index)}
                  className="text-muted-foreground transition-colors hover:text-destructive"
                  aria-label={messages.newTripPage.deleteStopAria(index + 1)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                <Input
                  placeholder={messages.newTripPage.stopPlaceholder}
                  className="pl-10"
                  value={stop}
                  onChange={(event) => updateRouteStop(index, event.target.value)}
                />
              </div>
            </div>
          ))}

          <p className="text-xs text-muted-foreground">{messages.newTripPage.stopHint}</p>
        </div>

        <div className="space-y-2">
          <Label>{messages.newTripPage.destinationLabel}</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
            <Input
              placeholder={messages.newTripPage.destinationPlaceholder}
              className="pl-10"
              value={form.destination}
              onChange={(event) => update("destination", event.target.value)}
              required
            />
          </div>
        </div>

        <div className={`grid gap-4 ${form.recurrence === "once" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
          <div className="space-y-2">
            <Label>{messages.newTripPage.recurrenceLabel}</Label>
            <Select value={form.recurrence} onValueChange={updateRecurrence}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder={messages.newTripPage.recurrencePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="once">{messages.newTripPage.recurrenceOptions.once}</SelectItem>
                <SelectItem value="weekly">{messages.newTripPage.recurrenceOptions.weekly}</SelectItem>
                <SelectItem value="monthly">{messages.newTripPage.recurrenceOptions.monthly}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.recurrence === "once" ? (
            <div className="space-y-2">
              <Label>{messages.newTripPage.dateLabel}</Label>
              <div className="relative cursor-pointer" onClick={openDatePicker}>
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={dateInputRef}
                  type="date"
                  className="cargoo-date-input cursor-pointer pl-10 pr-3"
                  value={form.date}
                  min={minTripDate}
                  onChange={(event) => update("date", event.target.value)}
                  required
                />
              </div>
            </div>
          ) : null}
        </div>

        <p className="-mt-1 text-xs text-muted-foreground">{recurrenceHint}</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{messages.newTripPage.capacityLabel}</Label>
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
          <Label>{messages.newTripPage.vehicleLabel}</Label>
          <div className="relative">
            <CarFront className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              list="cargoo-vehicle-options"
              placeholder={messages.newTripPage.vehiclePlaceholder}
              className="pl-10"
              value={form.vehicleType}
              onChange={(event) => update("vehicleType", event.target.value)}
              required
            />
          </div>
          <datalist id="cargoo-vehicle-options">
            {messages.newTripPage.vehicleOptions.map((vehicleOption) => (
              <option key={vehicleOption} value={vehicleOption} />
            ))}
          </datalist>
          <p className="text-xs text-muted-foreground">{messages.newTripPage.vehicleHint}</p>
        </div>

        <div className="space-y-2">
          <Label>{messages.newTripPage.notesLabel}</Label>
          <Textarea
            placeholder={messages.newTripPage.notesPlaceholder}
            rows={3}
            value={form.notes}
            onChange={(event) => update("notes", event.target.value)}
          />
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={saving}>
          {saving ? messages.newTripPage.publishing : messages.newTripPage.publish}
        </Button>
      </form>
    </div>
  );
};

export default NewTripPage;
