import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Calendar, CarFront, MapPin, Package, Plus, Trash2 } from "lucide-react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import CityAutocompleteInput from "@/components/CityAutocompleteInput";
import CountryAutocompleteInput from "@/components/CountryAutocompleteInput";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type CountryCode, getCityCountryCode, getCityLabel, getCityOptionLabel, getCountryLabel, resolveCityIdFromInput } from "@/lib/location-catalog";
import { createTrip, getFriendlyErrorMessage, getTripById, type CargooTripDetails, type TripCoverageMode, type TripRecurrence } from "@/lib/cargoo-store";
import { formatTripScheduleLabel } from "@/lib/trip-schedule";

const NewTripPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading: authLoading, profile, profileLoading } = useAuth();
  const { intlLocale, locale, messages } = useLocale();
  const reuseTripId = searchParams.get("reuseTrip") ?? "";
  const [form, setForm] = useState({
    coverageMode: "exact" as TripCoverageMode,
    origin: "",
    destination: "",
    originCityId: "",
    destinationCityId: "",
    originCountryCode: "",
    destinationCountryCode: "",
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

  const updateCountryCode = (field: "originCountryCode" | "destinationCountryCode", value: CountryCode | null) => {
    setForm((prev) => ({
      ...prev,
      [field]: value ?? "",
    }));
  };

  const updateCoverageMode = (value: string) => {
    const coverageMode = value as TripCoverageMode;

    setForm((prev) => ({
      ...prev,
      coverageMode,
      origin:
        coverageMode === "country_flexible"
          ? prev.originCountryCode
            ? getCountryLabel(prev.originCountryCode as CountryCode, locale)
            : ""
          : prev.originCityId
            ? getCityOptionLabel(prev.originCityId, locale)
            : "",
      destination:
        coverageMode === "country_flexible"
          ? prev.destinationCountryCode
            ? getCountryLabel(prev.destinationCountryCode as CountryCode, locale)
            : ""
          : prev.destinationCityId
            ? getCityOptionLabel(prev.destinationCityId, locale)
            : "",
    }));
  };

  const updateCountryInput = (field: "origin" | "destination", value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateCitySelection = (field: "originCityId" | "destinationCityId", cityId: string | null) => {
    setForm((prev) => ({
      ...prev,
      [field]: cityId ?? "",
      [field === "originCityId" ? "originCountryCode" : "destinationCountryCode"]: getCityCountryCode(cityId) ?? "",
    }));
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

        const resolvedOriginCityId = trip.originCityId ?? resolveCityIdFromInput(trip.origin);
        const resolvedDestinationCityId = trip.destinationCityId ?? resolveCityIdFromInput(trip.destination);
        const resolvedOriginCountryCode = trip.originCountryCode ?? getCityCountryCode(resolvedOriginCityId) ?? "";
        const resolvedDestinationCountryCode = trip.destinationCountryCode ?? getCityCountryCode(resolvedDestinationCityId) ?? "";

        setForm({
          coverageMode: trip.coverageMode,
          origin:
            trip.coverageMode === "country_flexible"
              ? resolvedOriginCountryCode
                ? getCountryLabel(resolvedOriginCountryCode, locale)
                : trip.origin
              : resolvedOriginCityId
                ? getCityOptionLabel(resolvedOriginCityId, locale)
                : trip.origin,
          destination:
            trip.coverageMode === "country_flexible"
              ? resolvedDestinationCountryCode
                ? getCountryLabel(resolvedDestinationCountryCode, locale)
                : trip.destination
              : resolvedDestinationCityId
                ? getCityOptionLabel(resolvedDestinationCityId, locale)
                : trip.destination,
          originCityId: resolvedOriginCityId ?? "",
          destinationCityId: resolvedDestinationCityId ?? "",
          originCountryCode: resolvedOriginCountryCode,
          destinationCountryCode: resolvedDestinationCountryCode,
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
  }, [authLoading, locale, messages.newTripPage.reuseTripNotFound, profile, profileLoading, reuseAppliedId, reuseTripId]);

  useEffect(() => {
    setForm((prev) => {
      const nextOrigin =
        prev.coverageMode === "country_flexible"
          ? prev.originCountryCode
            ? getCountryLabel(prev.originCountryCode as CountryCode, locale)
            : prev.origin
          : prev.originCityId
            ? getCityOptionLabel(prev.originCityId, locale)
            : prev.origin;
      const nextDestination =
        prev.coverageMode === "country_flexible"
          ? prev.destinationCountryCode
            ? getCountryLabel(prev.destinationCountryCode as CountryCode, locale)
            : prev.destination
          : prev.destinationCityId
            ? getCityOptionLabel(prev.destinationCityId, locale)
            : prev.destination;

      if (nextOrigin === prev.origin && nextDestination === prev.destination) {
        return prev;
      }

      return {
        ...prev,
        origin: nextOrigin,
        destination: nextDestination,
      };
    });
  }, [locale]);

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
  const isFlexibleCoverage = form.coverageMode === "country_flexible";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (form.recurrence === "once" && (!form.date || form.date < minTripDate)) {
      toast.error(messages.newTripPage.pastDateError);
      return;
    }

    setSaving(true);

    try {
      const selectedOriginCityId = isFlexibleCoverage ? null : form.originCityId || resolveCityIdFromInput(form.origin);
      const selectedDestinationCityId = isFlexibleCoverage ? null : form.destinationCityId || resolveCityIdFromInput(form.destination);
      const selectedOriginCountryCode = isFlexibleCoverage
        ? (form.originCountryCode as CountryCode | "")
        : getCityCountryCode(selectedOriginCityId) ?? "";
      const selectedDestinationCountryCode = isFlexibleCoverage
        ? (form.destinationCountryCode as CountryCode | "")
        : getCityCountryCode(selectedDestinationCityId) ?? "";

      if (!isFlexibleCoverage && (!selectedOriginCityId || !selectedDestinationCityId)) {
        throw new Error(messages.newTripPage.citySelectionRequired);
      }

      if (!selectedOriginCountryCode || !selectedDestinationCountryCode) {
        throw new Error(messages.newTripPage.countrySelectionRequired);
      }

      const originLabel = isFlexibleCoverage
        ? getCountryLabel(selectedOriginCountryCode, locale)
        : getCityLabel(selectedOriginCityId, locale);
      const destinationLabel = isFlexibleCoverage
        ? getCountryLabel(selectedDestinationCountryCode, locale)
        : getCityLabel(selectedDestinationCityId, locale);
      const cleanedRouteStops = isFlexibleCoverage ? [] : routeStops.map((stop) => stop.trim()).filter(Boolean);
      const trip = await createTrip({
        origin: originLabel,
        destination: destinationLabel,
        coverageMode: form.coverageMode,
        originCityId: selectedOriginCityId,
        destinationCityId: selectedDestinationCityId,
        originCountryCode: selectedOriginCountryCode as CountryCode,
        destinationCountryCode: selectedDestinationCountryCode as CountryCode,
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
          <Label>{messages.newTripPage.coverageModeLabel}</Label>
          <Select value={form.coverageMode} onValueChange={updateCoverageMode}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder={messages.newTripPage.coverageModeLabel} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="exact">{messages.newTripPage.coverageModeExact}</SelectItem>
              <SelectItem value="country_flexible">{messages.newTripPage.coverageModeCountryFlexible}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{isFlexibleCoverage ? messages.newTripPage.originCountryLabel : messages.newTripPage.originCityLabel}</Label>
          {isFlexibleCoverage ? (
            <CountryAutocompleteInput
              value={form.origin}
              selectedCountryCode={(form.originCountryCode as CountryCode) || null}
              onValueChange={(value) => updateCountryInput("origin", value)}
              onSelectedCountryCodeChange={(countryCode) => updateCountryCode("originCountryCode", countryCode)}
              placeholder={messages.newTripPage.countryPlaceholder}
              required
            />
          ) : (
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-primary" />
              <CityAutocompleteInput
                listId="new-trip-origin-cities"
                value={form.origin}
                selectedCityId={form.originCityId || null}
                onValueChange={(value) => update("origin", value)}
                onSelectedCityIdChange={(cityId) => updateCitySelection("originCityId", cityId)}
                placeholder={messages.newTripPage.cityPlaceholder}
                className="pl-10"
                required
              />
            </div>
          )}
        </div>

        {isFlexibleCoverage ? (
          <div className="rounded-xl border border-primary/10 bg-primary/5 px-4 py-3 text-xs text-muted-foreground">
            {messages.newTripPage.flexibleRouteHint}
          </div>
        ) : (
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
        )}

        <div className="space-y-2">
          <Label>{isFlexibleCoverage ? messages.newTripPage.destinationCountryLabel : messages.newTripPage.destinationCityLabel}</Label>
          {isFlexibleCoverage ? (
            <CountryAutocompleteInput
              value={form.destination}
              selectedCountryCode={(form.destinationCountryCode as CountryCode) || null}
              onValueChange={(value) => updateCountryInput("destination", value)}
              onSelectedCountryCodeChange={(countryCode) => updateCountryCode("destinationCountryCode", countryCode)}
              placeholder={messages.newTripPage.countryPlaceholder}
              required
            />
          ) : (
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-accent" />
              <CityAutocompleteInput
                listId="new-trip-destination-cities"
                value={form.destination}
                selectedCityId={form.destinationCityId || null}
                onValueChange={(value) => update("destination", value)}
                onSelectedCityIdChange={(cityId) => updateCitySelection("destinationCityId", cityId)}
                placeholder={messages.newTripPage.cityPlaceholder}
                className="pl-10"
                required
              />
            </div>
          )}
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
