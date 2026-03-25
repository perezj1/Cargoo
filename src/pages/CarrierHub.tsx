import { Link } from "react-router-dom";
import { ArrowRight, CarFront, Clock3, Link2, MapPinned, MessageCircle, Package2, Route } from "lucide-react";

import { PlatformLayout } from "@/components/cargoo/PlatformLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { carrierMetrics, carrierRequests, carrierShipments, trips } from "@/lib/cargoo-data";
import { readStoredCarrierProfileForm, readStoredCarrierStages } from "@/lib/carrier-workspace";

const stageTone = {
  Acordado: "bg-[#fff3e8] text-[#b45d35]",
  Recogido: "bg-[#eef7ec] text-[#4f7854]",
  "En ruta": "bg-[#e8eef7] text-[#486589]",
  Entregado: "bg-[#111111] text-white",
} as const;

const CarrierHub = () => {
  const todayTrip = trips[0];
  const profile = readStoredCarrierProfileForm();
  const stageByShipment = readStoredCarrierStages();
  const shipments = carrierShipments.map((shipment) => ({
    ...shipment,
    stage: stageByShipment[shipment.id] ?? shipment.stage,
  }));
  const nextRequests = carrierRequests.slice(0, 3);
  const highlightedShipments = shipments.slice(0, 3);

  return (
    <PlatformLayout
      title="Panel del transportista"
      subtitle="Tu parte de Cargoo se divide en cuatro zonas claras: solicitudes, viaje, seguimiento y ficha publica."
      action={<Badge className="hidden rounded-full bg-accent/10 px-3 py-1 text-accent md:inline-flex">Vista transportista</Badge>}
    >
      <section className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-5">
          <div className="soft-panel p-5 md:p-7">
            <Badge className="rounded-full border-primary/10 bg-primary/5 px-4 py-1.5 text-primary shadow-none">
              Panel rapido
            </Badge>
            <h2 className="mt-5 font-heading text-3xl font-bold tracking-tight text-foreground md:text-5xl">
              Todo lo importante del viaje, sin meterlo en una sola pagina.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              Entra, revisa quien te ha escrito, prepara la salida, comparte el seguimiento y ajusta tu ficha publica.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {carrierMetrics.map((metric) => (
                <div key={metric.label} className="rounded-[1.7rem] border border-primary/10 bg-white px-4 py-4 shadow-[0_16px_36px_rgba(255,122,48,0.05)]">
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="mt-2 font-heading text-2xl font-bold text-foreground md:text-3xl">{metric.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="sm:min-w-[190px]">
                <Link to="/carrier/requests">
                  Abrir solicitudes
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="sm:min-w-[190px]">
                <Link to="/carrier/trip">Ir al viaje</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card className="border-primary/10 bg-white">
              <CardContent className="p-5 md:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Solicitudes</p>
                    <h3 className="font-heading text-2xl font-semibold text-foreground">Quien quiere enviarte algo</h3>
                  </div>
                  <Badge className="rounded-full border-primary/10 bg-primary/5 px-3 py-1 text-primary shadow-none">
                    {carrierRequests.length}
                  </Badge>
                </div>

                <div className="mt-5 space-y-3">
                  {nextRequests.map((request) => (
                    <div key={request.id} className="rounded-[1.5rem] border border-primary/10 bg-[#fffaf6] px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{request.senderName}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{request.item}</p>
                        </div>
                        <Badge className="rounded-full border-primary/10 bg-white px-3 py-1 text-foreground shadow-none">
                          {request.urgency}
                        </Badge>
                      </div>
                      <p className="mt-3 text-sm text-foreground">{request.route}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{request.pickupWindow}</p>
                    </div>
                  ))}
                </div>

                <Button asChild variant="outline" className="mt-5 w-full">
                  <Link to="/carrier/requests">Ver todas las solicitudes</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-primary/10 bg-white">
              <CardContent className="p-5 md:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Seguimiento</p>
                    <h3 className="font-heading text-2xl font-semibold text-foreground">Envios activos</h3>
                  </div>
                  <Badge className="rounded-full border-primary/10 bg-primary/5 px-3 py-1 text-primary shadow-none">
                    {highlightedShipments.length}
                  </Badge>
                </div>

                <div className="mt-5 space-y-3">
                  {highlightedShipments.map((shipment) => (
                    <div key={shipment.id} className="rounded-[1.5rem] border border-primary/10 bg-[#fffaf6] px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={`rounded-full px-3 py-1 ${stageTone[shipment.stage]}`}>{shipment.stage}</Badge>
                        <Badge className="rounded-full border-primary/10 bg-white px-3 py-1 text-foreground shadow-none">
                          {shipment.trackingCode}
                        </Badge>
                      </div>
                      <p className="mt-3 font-medium text-foreground">{shipment.item}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{shipment.route}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{shipment.checkpoint}</p>
                    </div>
                  ))}
                </div>

                <Button asChild variant="outline" className="mt-5 w-full">
                  <Link to="/carrier/trip">Abrir viaje y seguimiento</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-5">
          <Card className="border-primary/10 bg-white">
            <CardContent className="p-5 md:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-primary/10 text-primary">
                  <CarFront className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Proxima salida</p>
                  <h3 className="font-heading text-2xl font-semibold text-foreground">
                    {todayTrip.originCity} {"->"} {todayTrip.destinationCity}
                  </h3>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-primary/10 bg-[#fffaf6] px-4 py-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Clock3 className="h-4 w-4 text-primary" />
                    Salida
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {todayTrip.departureDay} a las {todayTrip.departureTime}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-primary/10 bg-[#fffaf6] px-4 py-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <MapPinned className="h-4 w-4 text-primary" />
                    Recogida
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{todayTrip.meetingPoint}</p>
                </div>
                <div className="rounded-[1.5rem] border border-primary/10 bg-[#fffaf6] px-4 py-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Package2 className="h-4 w-4 text-primary" />
                    Espacio
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{todayTrip.availableSpace}</p>
                </div>
                <div className="rounded-[1.5rem] border border-primary/10 bg-[#fffaf6] px-4 py-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Route className="h-4 w-4 text-primary" />
                    Vehiculo
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{todayTrip.vehicle}</p>
                </div>
              </div>

              <Button asChild className="mt-5 w-full">
                <Link to="/carrier/trip">Preparar viaje</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-white">
            <CardContent className="p-5 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Ficha publica</p>
                  <h3 className="font-heading text-2xl font-semibold text-foreground">{profile.displayName}</h3>
                </div>
                <Badge className="rounded-full border-primary/10 bg-primary/5 px-3 py-1 text-primary shadow-none">
                  {profile.contactVisibility === "public" ? "Contacto publico" : "Solo usuarios"}
                </Badge>
              </div>

              <p className="mt-3 text-sm leading-7 text-muted-foreground">{profile.bio}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-full bg-white">
                  {profile.originCity} {"->"} {profile.destinationCity}
                </Badge>
                <Badge variant="outline" className="rounded-full bg-white">
                  {profile.departureTime}
                </Badge>
                <Badge variant="outline" className="rounded-full bg-white">
                  {profile.availableSpace}
                </Badge>
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-primary/10 bg-[#fffaf6] px-4 py-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Link2 className="h-4 w-4 text-primary" />
                  Contacto visible
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{profile.contactPreference}</p>
                <p className="mt-1 text-sm text-muted-foreground">{profile.contactValue}</p>
              </div>

              <Button asChild variant="outline" className="mt-5 w-full">
                <Link to="/carrier/profile">Editar ficha publica</Link>
              </Button>
            </CardContent>
          </Card>

          <div className="rounded-[2rem] border border-primary/10 bg-white px-5 py-5 shadow-[0_18px_45px_rgba(255,122,48,0.06)]">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <MessageCircle className="h-4 w-4 text-primary" />
              Como queda ahora la app del transportista
            </div>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p>Panel para ver el resumen del dia.</p>
              <p>Solicitudes para contestar y cerrar acuerdos.</p>
              <p>Viaje para mover estados y compartir seguimiento.</p>
              <p>Ficha para editar lo que vera el emisor.</p>
            </div>
          </div>
        </div>
      </section>
    </PlatformLayout>
  );
};

export default CarrierHub;
