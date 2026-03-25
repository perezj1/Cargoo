import { useState } from "react";
import { Link } from "react-router-dom";
import { BellRing, CarFront, CheckCircle2, Clock3, Link2, MapPinned, MessageCircle, Package2, PhoneCall, Route, Send } from "lucide-react";

import { PlatformLayout } from "@/components/cargoo/PlatformLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  carrierChecklist,
  carrierMetrics,
  carrierRequests,
  carrierShipments,
  carrierStageFlow,
  type CarrierShipmentStage,
  trips,
} from "@/lib/cargoo-data";

const requestTone = {
  Alta: "bg-[#fff1e6] text-[#b45d35]",
  Media: "bg-[#eef7ec] text-[#4f7854]",
  Flexible: "bg-[#e8eef7] text-[#486589]",
} as const;

const stageTone = {
  Acordado: "bg-[#fff3e8] text-[#b45d35]",
  Recogido: "bg-[#eef7ec] text-[#4f7854]",
  "En ruta": "bg-[#e8eef7] text-[#486589]",
  Entregado: "bg-[#111111] text-white",
} as const;

const stageCopy: Record<CarrierShipmentStage, { label: string; hint: string }> = {
  Acordado: {
    label: "Codigo listo para compartir",
    hint: "Ya cerraste el acuerdo. El siguiente paso es recoger el paquete.",
  },
  Recogido: {
    label: "Paquete en tu poder",
    hint: "Todo esta cargado. Marca en ruta cuando empieces el viaje.",
  },
  "En ruta": {
    label: "Viaje en marcha",
    hint: "El emisor puede seguir el checkpoint sin escribirte para preguntar.",
  },
  Entregado: {
    label: "Envio cerrado",
    hint: "Marca entregado cuando confirmes la ultima parada con el receptor.",
  },
};

const initialStages = Object.fromEntries(carrierShipments.map((item) => [item.id, item.stage])) as Record<string, CarrierShipmentStage>;

const CarrierHub = () => {
  const [selectedRequestId, setSelectedRequestId] = useState(carrierRequests[0]?.id ?? "");
  const [stageByShipment, setStageByShipment] = useState<Record<string, CarrierShipmentStage>>(initialStages);

  const todayTrip = trips[0];
  const selectedRequest = carrierRequests.find((request) => request.id === selectedRequestId) ?? carrierRequests[0];
  const shipments = carrierShipments.map((shipment) => ({
    ...shipment,
    stage: stageByShipment[shipment.id] ?? shipment.stage,
  }));
  const activeShipment = shipments.find((shipment) => shipment.stage !== "Entregado") ?? shipments[0];

  const updateShipmentStage = (shipmentId: string, nextStage: CarrierShipmentStage) => {
    setStageByShipment((current) => ({
      ...current,
      [shipmentId]: nextStage,
    }));
  };

  return (
    <PlatformLayout
      title="Centro del transportista"
      subtitle="Aqui entras para ver quien te ha escrito, preparar recogidas, salir de viaje y marcar cada etapa del envio."
      action={<Badge className="hidden rounded-full bg-accent/10 px-3 py-1 text-accent md:inline-flex">Modo transportista</Badge>}
    >
      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-accent/10 p-3 text-accent">
                  <BellRing className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-heading text-3xl font-semibold">Lo importante nada mas entrar</h2>
                  <p className="text-muted-foreground">Solicitudes nuevas, recogidas pendientes y seguimiento activo.</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {carrierMetrics.map((metric, index) => (
                  <div
                    key={metric.label}
                    className={index === 1 ? "rounded-3xl border border-black/5 bg-[#faf7f2] p-4" : "rounded-3xl border border-black/5 bg-white p-4 shadow-sm"}
                  >
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                    <p className="mt-2 font-heading text-3xl font-bold">{metric.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-heading text-3xl font-semibold">Solicitudes recibidas</h2>
                  <p className="mt-2 text-muted-foreground">Aqui ves quien quiere mandarte algo y decides si te encaja.</p>
                </div>
                <Badge className="rounded-full border-black/5 bg-white px-3 py-1 text-foreground">
                  {carrierRequests.length} abiertas
                </Badge>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[0.98fr_1.02fr]">
                <div className="space-y-3">
                  {carrierRequests.map((request) => (
                    <button
                      key={request.id}
                      type="button"
                      onClick={() => setSelectedRequestId(request.id)}
                      className={selectedRequest.id === request.id ? "w-full rounded-[1.75rem] border border-black/5 bg-[#fff9f3] p-4 text-left shadow-sm" : "w-full rounded-[1.75rem] border border-black/5 bg-white p-4 text-left shadow-sm transition-transform hover:-translate-y-0.5"}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">{request.senderName}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{request.item}</p>
                        </div>
                        <Badge className={`rounded-full px-3 py-1 ${requestTone[request.urgency]}`}>{request.urgency}</Badge>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">{request.route}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{request.pickupWindow}</p>
                    </button>
                  ))}
                </div>

                <div className="rounded-[1.9rem] border border-black/5 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <MessageCircle className="h-4 w-4 text-primary" />
                    Solicitud seleccionada
                  </div>
                  <h3 className="mt-4 font-heading text-3xl font-semibold">{selectedRequest.senderName}</h3>
                  <p className="mt-2 text-muted-foreground">{selectedRequest.item}</p>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl bg-[#faf7f2] p-4">
                      <p className="text-sm text-muted-foreground">Ruta</p>
                      <p className="mt-1 font-medium text-foreground">{selectedRequest.route}</p>
                    </div>
                    <div className="rounded-2xl bg-[#faf7f2] p-4">
                      <p className="text-sm text-muted-foreground">Espacio pedido</p>
                      <p className="mt-1 font-medium text-foreground">{selectedRequest.requestedSpace}</p>
                    </div>
                    <div className="rounded-2xl bg-[#faf7f2] p-4">
                      <p className="text-sm text-muted-foreground">Ventana de recogida</p>
                      <p className="mt-1 font-medium text-foreground">{selectedRequest.pickupWindow}</p>
                    </div>
                    <div className="rounded-2xl bg-[#faf7f2] p-4">
                      <p className="text-sm text-muted-foreground">Contacto preferido</p>
                      <p className="mt-1 font-medium text-foreground">{selectedRequest.preferredContact}</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[1.5rem] border border-black/5 bg-[#fff9f3] p-4">
                    <p className="text-sm text-muted-foreground">Nota del emisor</p>
                    <p className="mt-2 text-sm text-foreground">{selectedRequest.note}</p>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <Button className="flex-1">
                      <Send className="h-4 w-4" />
                      Responder
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <PhoneCall className="h-4 w-4" />
                      Llamar
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Link2 className="h-4 w-4" />
                      Crear codigo
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-heading text-3xl font-semibold">Envios que llevas contigo</h2>
                  <p className="mt-2 text-muted-foreground">Marca cada etapa y el seguimiento se actualiza para el emisor.</p>
                </div>
                <Badge className="rounded-full border-black/5 bg-white px-3 py-1 text-foreground">Control manual</Badge>
              </div>

              <div className="mt-6 space-y-4">
                {shipments.map((shipment, index) => (
                  <div
                    key={shipment.id}
                    className={index === 0 ? "rounded-[1.9rem] border border-black/5 bg-[#fff9f3] p-5" : "rounded-[1.9rem] border border-black/5 bg-white p-5 shadow-sm"}
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={`rounded-full px-3 py-1 ${stageTone[shipment.stage]}`}>{shipment.stage}</Badge>
                          <Badge className="rounded-full border-black/5 bg-white px-3 py-1 text-foreground">{shipment.trackingCode}</Badge>
                        </div>

                        <h3 className="mt-4 font-heading text-2xl font-semibold">{shipment.item}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {shipment.senderName} - {shipment.route}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">{shipment.summary}</p>

                        <div className="mt-5 flex flex-wrap gap-2">
                          {carrierStageFlow.map((stage) => (
                            <button
                              key={stage}
                              type="button"
                              onClick={() => updateShipmentStage(shipment.id, stage)}
                              className={stage === shipment.stage ? `rounded-full px-3 py-2 text-sm font-medium ${stageTone[stage]}` : "rounded-full border border-black/10 bg-white px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-black/20 hover:text-foreground"}
                            >
                              {stage}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="w-full max-w-sm rounded-[1.75rem] border border-black/5 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <Package2 className="h-4 w-4 text-primary" />
                          {stageCopy[shipment.stage].label}
                        </div>

                        <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPinned className="h-4 w-4 text-primary" />
                            {shipment.checkpoint}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock3 className="h-4 w-4 text-primary" />
                            ETA {shipment.eta}
                          </div>
                          <div className="flex items-center gap-2">
                            <Route className="h-4 w-4 text-primary" />
                            {stageCopy[shipment.stage].hint}
                          </div>
                        </div>

                        <div className="mt-5 flex gap-2">
                          <Button asChild className="flex-1">
                            <Link to={shipment.shareUrl}>Abrir seguimiento</Link>
                          </Button>
                          <Button variant="outline" className="flex-1">
                            Compartir codigo
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="ink-card text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CarFront className="h-5 w-5 text-amber-300" />
                <div>
                  <h2 className="font-heading text-2xl font-semibold">Tu salida de hoy</h2>
                  <p className="mt-1 text-sm text-slate-300">Lo practico: donde empiezas, que recoges y que compartes.</p>
                </div>
              </div>

              <div className="mt-6 rounded-[1.75rem] bg-white/10 p-5">
                <p className="text-sm text-white/65">{todayTrip.role}</p>
                <h3 className="mt-2 font-heading text-3xl font-semibold">
                  {todayTrip.originCity} {"->"} {todayTrip.destinationCity}
                </h3>
                <p className="mt-2 text-sm text-white/75">
                  {todayTrip.departureDay} - {todayTrip.departureTime} - {todayTrip.vehicle}
                </p>
              </div>

              <div className="mt-5 space-y-3">
                {carrierChecklist.map((item) => (
                  <div key={item} className="flex gap-3 rounded-[1.5rem] bg-white/10 p-4 text-sm text-slate-200">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-amber-300" />
                    {item}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {activeShipment ? (
            <Card className="peach-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-primary" />
                  <h2 className="font-heading text-2xl font-semibold">Codigo listo para compartir</h2>
                </div>

                <div className="mt-5 rounded-[1.6rem] border border-black/5 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Codigo</p>
                  <p className="mt-2 font-heading text-3xl font-semibold">{activeShipment.trackingCode}</p>
                  <p className="mt-3 text-sm text-muted-foreground">{activeShipment.senderName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{activeShipment.route}</p>
                </div>

                <div className="mt-5 rounded-[1.6rem] border border-black/5 bg-white/80 p-4">
                  <p className="text-sm text-muted-foreground">URL de seguimiento</p>
                  <p className="mt-2 break-all text-sm font-medium text-foreground">{`${window.location.origin}${activeShipment.shareUrl}`}</p>
                </div>

                <Button asChild className="mt-6 w-full">
                  <Link to={activeShipment.shareUrl}>Abrir pagina de seguimiento</Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <Card className="mint-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <MapPinned className="h-5 w-5 text-primary" />
                <h2 className="font-heading text-2xl font-semibold">Siguiente recogida</h2>
              </div>

              <div className="mt-5 rounded-[1.6rem] border border-black/5 bg-white p-5 shadow-sm">
                <p className="font-medium text-foreground">{selectedRequest.senderName}</p>
                <p className="mt-1 text-sm text-muted-foreground">{selectedRequest.item}</p>
                <p className="mt-3 text-sm text-muted-foreground">{selectedRequest.pickupWindow}</p>
                <p className="mt-1 text-sm text-muted-foreground">{selectedRequest.route}</p>
                <p className="mt-3 text-sm text-muted-foreground">{selectedRequest.note}</p>
              </div>

              <div className="mt-5 flex gap-2">
                <Button className="flex-1">
                  <MessageCircle className="h-4 w-4" />
                  Escribir
                </Button>
                <Button variant="outline" className="flex-1">
                  <PhoneCall className="h-4 w-4" />
                  Llamar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </PlatformLayout>
  );
};

export default CarrierHub;
