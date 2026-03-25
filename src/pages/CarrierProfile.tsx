import { FormEvent, useMemo, useState } from "react";
import { CarFront } from "lucide-react";
import { toast } from "sonner";

import { PlatformLayout } from "@/components/cargoo/PlatformLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  initialCarrierProfileForm,
  readStoredCarrierProfileForm,
  resetStoredCarrierProfileForm,
  writeStoredCarrierProfileForm,
  type CarrierProfileForm,
} from "@/lib/carrier-workspace";

const CarrierProfile = () => {
  const [profileForm, setProfileForm] = useState<CarrierProfileForm>(() => readStoredCarrierProfileForm());

  const routeStopsPreview = useMemo(
    () =>
      profileForm.routeStops
        .split(",")
        .map((stop) => stop.trim())
        .filter(Boolean),
    [profileForm.routeStops],
  );

  const acceptedItemsPreview = useMemo(
    () =>
      profileForm.acceptedItems
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [profileForm.acceptedItems],
  );

  const updateField = <K extends keyof CarrierProfileForm>(key: K, value: CarrierProfileForm[K]) => {
    setProfileForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    writeStoredCarrierProfileForm(profileForm);
    toast.success("Ficha guardada.");
  };

  const handleReset = () => {
    resetStoredCarrierProfileForm();
    setProfileForm(initialCarrierProfileForm);
    toast.success("Ejemplo restaurado.");
  };

  return (
    <PlatformLayout
      title="Ficha publica"
      subtitle="Esta pantalla sirve solo para rellenar tu ficha. Lo que pongas aqui es lo que ayudara al emisor a decidir si te contacta."
      action={<Badge className="hidden rounded-full bg-accent/10 px-3 py-1 text-accent md:inline-flex">Perfil visible</Badge>}
    >
      <section className="grid gap-5 xl:grid-cols-[1.02fr_0.98fr]">
        <Card className="border-primary/10 bg-white">
          <CardContent className="p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Formulario</p>
                <h2 className="font-heading text-2xl font-semibold text-foreground md:text-3xl">Crea tu ficha publica</h2>
              </div>
              <Badge className="rounded-full border-primary/10 bg-primary/5 px-3 py-1 text-primary shadow-none">
                Visible para emisores
              </Badge>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Nombre visible</span>
                  <input
                    value={profileForm.displayName}
                    onChange={(event) => updateField("displayName", event.target.value)}
                    className="h-12 w-full rounded-[1.35rem] border border-primary/10 bg-[#fffaf6] px-4 text-sm outline-none transition-colors focus:border-primary/40"
                    placeholder="Ej. Nikola P."
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Tipo de perfil</span>
                  <input
                    value={profileForm.roleLabel}
                    onChange={(event) => updateField("roleLabel", event.target.value)}
                    className="h-12 w-full rounded-[1.35rem] border border-primary/10 bg-[#fffaf6] px-4 text-sm outline-none transition-colors focus:border-primary/40"
                    placeholder="Ej. Transportista comunidad serbia"
                  />
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-foreground">Descripcion corta</span>
                <textarea
                  value={profileForm.bio}
                  onChange={(event) => updateField("bio", event.target.value)}
                  className="min-h-[110px] w-full rounded-[1.6rem] border border-primary/10 bg-[#fffaf6] px-4 py-3 text-sm outline-none transition-colors focus:border-primary/40"
                  placeholder="Explica tu ruta, a quien va dirigida y como organizas las recogidas."
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Ciudad de salida</span>
                  <input
                    value={profileForm.originCity}
                    onChange={(event) => updateField("originCity", event.target.value)}
                    className="h-12 w-full rounded-[1.35rem] border border-primary/10 bg-[#fffaf6] px-4 text-sm outline-none transition-colors focus:border-primary/40"
                    placeholder="Basel"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Destino final</span>
                  <input
                    value={profileForm.destinationCity}
                    onChange={(event) => updateField("destinationCity", event.target.value)}
                    className="h-12 w-full rounded-[1.35rem] border border-primary/10 bg-[#fffaf6] px-4 text-sm outline-none transition-colors focus:border-primary/40"
                    placeholder="Belgrado"
                  />
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-foreground">Ciudades por donde pasas</span>
                <textarea
                  value={profileForm.routeStops}
                  onChange={(event) => updateField("routeStops", event.target.value)}
                  className="min-h-[96px] w-full rounded-[1.6rem] border border-primary/10 bg-[#fffaf6] px-4 py-3 text-sm outline-none transition-colors focus:border-primary/40"
                  placeholder="Basel, Zurich, Milano, Ljubljana..."
                />
              </label>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Fecha de salida</span>
                  <input
                    type="date"
                    value={profileForm.departureDate}
                    onChange={(event) => updateField("departureDate", event.target.value)}
                    className="h-12 w-full rounded-[1.35rem] border border-primary/10 bg-[#fffaf6] px-4 text-sm outline-none transition-colors focus:border-primary/40"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Hora de salida</span>
                  <input
                    type="time"
                    value={profileForm.departureTime}
                    onChange={(event) => updateField("departureTime", event.target.value)}
                    className="h-12 w-full rounded-[1.35rem] border border-primary/10 bg-[#fffaf6] px-4 text-sm outline-none transition-colors focus:border-primary/40"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Llegada estimada</span>
                  <input
                    type="date"
                    value={profileForm.arrivalDate}
                    onChange={(event) => updateField("arrivalDate", event.target.value)}
                    className="h-12 w-full rounded-[1.35rem] border border-primary/10 bg-[#fffaf6] px-4 text-sm outline-none transition-colors focus:border-primary/40"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Vehiculo</span>
                  <input
                    value={profileForm.vehicle}
                    onChange={(event) => updateField("vehicle", event.target.value)}
                    className="h-12 w-full rounded-[1.35rem] border border-primary/10 bg-[#fffaf6] px-4 text-sm outline-none transition-colors focus:border-primary/40"
                    placeholder="Skoda Superb"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Espacio disponible</span>
                  <input
                    value={profileForm.availableSpace}
                    onChange={(event) => updateField("availableSpace", event.target.value)}
                    className="h-12 w-full rounded-[1.35rem] border border-primary/10 bg-[#fffaf6] px-4 text-sm outline-none transition-colors focus:border-primary/40"
                    placeholder="3 cajas medianas o 60 kg"
                  />
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-foreground">Que aceptas transportar</span>
                <textarea
                  value={profileForm.acceptedItems}
                  onChange={(event) => updateField("acceptedItems", event.target.value)}
                  className="min-h-[96px] w-full rounded-[1.6rem] border border-primary/10 bg-[#fffaf6] px-4 py-3 text-sm outline-none transition-colors focus:border-primary/40"
                  placeholder="Cajas familiares, documentos, bultos fragiles..."
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Punto de recogida</span>
                  <input
                    value={profileForm.meetingPoint}
                    onChange={(event) => updateField("meetingPoint", event.target.value)}
                    className="h-12 w-full rounded-[1.35rem] border border-primary/10 bg-[#fffaf6] px-4 text-sm outline-none transition-colors focus:border-primary/40"
                    placeholder="Centro Basel o autopista A2"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Tiempo de respuesta</span>
                  <input
                    value={profileForm.responseTime}
                    onChange={(event) => updateField("responseTime", event.target.value)}
                    className="h-12 w-full rounded-[1.35rem] border border-primary/10 bg-[#fffaf6] px-4 text-sm outline-none transition-colors focus:border-primary/40"
                    placeholder="< 10 min"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Canal de contacto</span>
                  <select
                    value={profileForm.contactPreference}
                    onChange={(event) => updateField("contactPreference", event.target.value)}
                    className="h-12 w-full rounded-[1.35rem] border border-primary/10 bg-[#fffaf6] px-4 text-sm outline-none transition-colors focus:border-primary/40"
                  >
                    <option>WhatsApp</option>
                    <option>Telefono</option>
                    <option>Chat en la app</option>
                    <option>WhatsApp y llamada</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Quien puede ver el contacto</span>
                  <select
                    value={profileForm.contactVisibility}
                    onChange={(event) => updateField("contactVisibility", event.target.value as CarrierProfileForm["contactVisibility"])}
                    className="h-12 w-full rounded-[1.35rem] border border-primary/10 bg-[#fffaf6] px-4 text-sm outline-none transition-colors focus:border-primary/40"
                  >
                    <option value="public">Todo el mundo</option>
                    <option value="members">Solo usuarios con cuenta</option>
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Telefono o usuario de contacto</span>
                  <input
                    value={profileForm.contactValue}
                    onChange={(event) => updateField("contactValue", event.target.value)}
                    className="h-12 w-full rounded-[1.35rem] border border-primary/10 bg-[#fffaf6] px-4 text-sm outline-none transition-colors focus:border-primary/40"
                    placeholder="+41..."
                  />
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-foreground">Notas para el emisor</span>
                <textarea
                  value={profileForm.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                  className="min-h-[110px] w-full rounded-[1.6rem] border border-primary/10 bg-[#fffaf6] px-4 py-3 text-sm outline-none transition-colors focus:border-primary/40"
                  placeholder="Explica hasta cuando aceptas recogidas y como coordinas la entrega."
                />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" className="sm:min-w-[180px]">
                  Guardar ficha
                </Button>
                <Button type="button" variant="outline" onClick={handleReset}>
                  Restaurar ejemplo
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-primary/10 bg-white">
          <CardContent className="p-5 md:p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <CarFront className="h-4 w-4 text-primary" />
              Asi vera tu perfil el emisor
            </div>

            <h3 className="mt-4 font-heading text-3xl font-semibold text-foreground">{profileForm.displayName || "Tu nombre"}</h3>
            <p className="mt-2 text-muted-foreground">{profileForm.roleLabel || "Tipo de perfil"}</p>
            <p className="mt-4 text-sm leading-7 text-foreground/80">{profileForm.bio || "Aqui aparecera tu descripcion."}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Badge className="rounded-full border-primary/10 bg-primary/5 px-3 py-1 text-primary shadow-none">
                {profileForm.originCity || "Salida"} {"->"} {profileForm.destinationCity || "Destino"}
              </Badge>
              <Badge variant="outline" className="rounded-full bg-white">
                {profileForm.departureTime || "Hora"} - {profileForm.availableSpace || "Espacio"}
              </Badge>
            </div>

            <div className="mt-6 rounded-[1.6rem] border border-primary/10 bg-[#fffaf6] p-4">
              <p className="text-sm text-muted-foreground">Ruta</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {routeStopsPreview.length > 0 ? (
                  routeStopsPreview.map((stop) => (
                    <Badge key={stop} variant="outline" className="rounded-full bg-white">
                      {stop}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Anade ciudades por las que pasas.</p>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-[1.6rem] border border-primary/10 bg-[#fffaf6] p-4">
              <p className="text-sm text-muted-foreground">Acepta</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {acceptedItemsPreview.length > 0 ? (
                  acceptedItemsPreview.map((item) => (
                    <Badge key={item} variant="outline" className="rounded-full bg-white">
                      {item}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Anade tipos de paquetes aceptados.</p>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-3 rounded-[1.6rem] border border-primary/10 bg-white p-4 text-sm text-muted-foreground shadow-[0_16px_36px_rgba(255,122,48,0.05)]">
              <p>
                <span className="font-medium text-foreground">Recogida:</span> {profileForm.meetingPoint || "Sin definir"}
              </p>
              <p>
                <span className="font-medium text-foreground">Contacto:</span> {profileForm.contactPreference || "Sin definir"}
              </p>
              <p>
                <span className="font-medium text-foreground">Visibilidad:</span>{" "}
                {profileForm.contactVisibility === "public" ? "Visible para todos" : "Solo usuarios con cuenta"}
              </p>
              <p>
                <span className="font-medium text-foreground">Dato de contacto:</span> {profileForm.contactValue || "Sin definir"}
              </p>
              <p>
                <span className="font-medium text-foreground">Respuesta:</span> {profileForm.responseTime || "Sin definir"}
              </p>
              <p>
                <span className="font-medium text-foreground">Info adicional:</span> {profileForm.notes || "Sin notas"}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </PlatformLayout>
  );
};

export default CarrierProfile;
