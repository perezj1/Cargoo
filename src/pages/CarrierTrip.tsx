import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Clock3, Link2, MapPinned, Package2, Route } from "lucide-react";

import { PlatformLayout } from "@/components/cargoo/PlatformLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { carrierChecklist, carrierShipments, carrierStageFlow, trips, type CarrierShipmentStage } from "@/lib/cargoo-data";
import { readStoredCarrierStages, writeStoredCarrierStages } from "@/lib/carrier-workspace";

const stageTone = {
  Acordado: "bg-[#fff3e8] text-[#b45d35]",
  Recogido: "bg-[#eef7ec] text-[#4f7854]",
  "En ruta": "bg-[#e8eef7] text-[#486589]",
  Entregado: "bg-[#111111] text-white",
} as const;

const stageCopy: Record<CarrierShipmentStage, { label: string; hint: string }> = {
  Acordado: {
    label: "Codigo listo para compartir",
    hint: "El acuerdo esta cerrado. El siguiente paso es recoger el paquete.",
  },
  Recogido: {
    label: "Paquete ya recogido",
    hint: "Todo esta cargado. Marca en ruta cuando arranques el viaje.",
  },
  "En ruta": {
    label: "Viaje en marcha",
    hint: "El emisor ya puede seguir el checkpoint y la llegada estimada.",
  },
  Entregado: {
    label: "Envio terminado",
    hint: "Solo queda confirmar con el receptor y cerrar el envio.",
  },
};

const CarrierTrip = () => {
  const todayTrip = trips[0];
  const [stageByShipment, setStageByShipment] = useState<Record<string, CarrierShipmentStage>>(() => readStoredCarrierStages());

  const shipments = useMemo(
    () =>
      carrierShipments.map((shipment) => ({
        ...shipment,
        stage: stageByShipment[shipment.id] ?? shipment.stage,
      })),
    [stageByShipment],
  );

  const activeShipment = shipments.find((shipment) => shipment.stage !== "Entregado") ?? shipments[0];
  const shareOrigin = typeof window === "undefined" ? "" : window.location.origin;

  const updateShipmentStage = (shipmentId: string, nextStage: CarrierShipmentStage) => {
    setStageByShipment((current) => {
      const nextState = {
        ...current,
        [shipmentId]: nextStage,
      };

      writeStoredCarrierStages(nextState);
      return nextState;
    });
  };

  return (
    <PlatformLayout
      title="Viaje y seguimiento"
      subtitle="Aqui mueves cada envio por etapas y compartes el codigo para que el emisor vea el estado sin escribirte."
      action={<Badge className="hidden rounded-full bg-accent/10 px-3 py-1 text-accent md:inline-flex">Estados del viaje</Badge>}
    >
      <section className="grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="space-y-5">
          <div className="soft-panel p-5 md:p-7">
            <Badge className="rounded-full border-primary/10 bg-primary/5 px-4 py-1.5 text-primary shadow-none">
              Salida activa
            </Badge>
            <h2 className="mt-5 font-heading text-3xl font-bold tracking-tight text-foreground md:text-5xl">
              {todayTrip.originCity} {"->"} {todayTrip.destinationCity}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              Tu salida de hoy se controla desde aqui: recoges, arrancas y vas actualizando el viaje conforme avanzas.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.6rem] border border-primary/10 bg-white px-4 py-4">
                <p className="text-sm text-muted-foreground">Salida</p>
                <p className="mt-2 font-medium text-foreground">
                  {todayTrip.departureDay} a las {todayTrip.departureTime}
                </p>
              </div>
              <div className="rounded-[1.6rem] border border-primary/10 bg-white px-4 py-4">
                <p className="text-sm text-muted-foreground">Vehiculo</p>
                <p className="mt-2 font-medium text-foreground">{todayTrip.vehicle}</p>
              </div>
              <div className="rounded-[1.6rem] border border-primary/10 bg-white px-4 py-4">
                <p className="text-sm text-muted-foreground">Espacio</p>
                <p className="mt-2 font-medium text-foreground">{todayTrip.availableSpace}</p>
              </div>
            </div>
          </div>

          <Card className="border-primary/10 bg-white">
            <CardContent className="p-5 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Seguimientos</p>
                  <h3 className="font-heading text-2xl font-semibold text-foreground">Envios que llevas contigo</h3>
                </div>
                <Badge className="rounded-full border-primary/10 bg-primary/5 px-3 py-1 text-primary shadow-none">
                  {shipments.length}
                </Badge>
              </div>

              <div className="mt-5 space-y-4">
                {shipments.map((shipment) => (
                  <div key={shipment.id} className="rounded-[1.75rem] border border-primary/10 bg-[#fffaf6] px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={`rounded-full px-3 py-1 ${stageTone[shipment.stage]}`}>{shipment.stage}</Badge>
                      <Badge className="rounded-full border-primary/10 bg-white px-3 py-1 text-foreground shadow-none">
                        {shipment.trackingCode}
                      </Badge>
                    </div>

                    <h4 className="mt-4 font-heading text-xl font-semibold text-foreground">{shipment.item}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {shipment.senderName} - {shipment.route}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{shipment.summary}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {carrierStageFlow.map((stage) => (
                        <button
                          key={stage}
                          type="button"
                          onClick={() => updateShipmentStage(shipment.id, stage)}
                          className={
                            stage === shipment.stage
                              ? `rounded-full px-3 py-2 text-sm font-medium ${stageTone[stage]}`
                              : "rounded-full border border-primary/10 bg-white px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/5 hover:text-foreground"
                          }
                        >
                          {stage}
                        </button>
                      ))}
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="rounded-[1.35rem] border border-primary/10 bg-white px-4 py-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2 font-medium text-foreground">
                          <MapPinned className="h-4 w-4 text-primary" />
                          Checkpoint
                        </div>
                        <p className="mt-2">{shipment.checkpoint}</p>
                      </div>
                      <div className="rounded-[1.35rem] border border-primary/10 bg-white px-4 py-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2 font-medium text-foreground">
                          <Clock3 className="h-4 w-4 text-primary" />
                          ETA
                        </div>
                        <p className="mt-2">{shipment.eta}</p>
                      </div>
                      <div className="rounded-[1.35rem] border border-primary/10 bg-white px-4 py-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2 font-medium text-foreground">
                          <Route className="h-4 w-4 text-primary" />
                          Siguiente paso
                        </div>
                        <p className="mt-2">{stageCopy[shipment.stage].hint}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          {activeShipment ? (
            <Card className="border-primary/10 bg-white">
              <CardContent className="p-5 md:p-6">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Link2 className="h-4 w-4 text-primary" />
                  {stageCopy[activeShipment.stage].label}
                </div>

                <div className="mt-4 rounded-[1.6rem] border border-primary/10 bg-[#fffaf6] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Codigo</p>
                  <p className="mt-2 font-heading text-2xl font-semibold text-foreground md:text-3xl">
                    {activeShipment.trackingCode}
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">{activeShipment.senderName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{activeShipment.route}</p>
                </div>

                <div className="mt-4 rounded-[1.6rem] border border-primary/10 bg-white px-4 py-4 shadow-[0_16px_36px_rgba(255,122,48,0.05)]">
                  <p className="text-sm text-muted-foreground">URL de seguimiento</p>
                  <p className="mt-2 break-all text-xs font-medium text-foreground sm:text-sm">
                    {`${shareOrigin}${activeShipment.shareUrl}`}
                  </p>
                </div>

                <div className="mt-5 flex flex-col gap-3">
                  <Button asChild>
                    <Link to={activeShipment.shareUrl}>Abrir pagina de seguimiento</Link>
                  </Button>
                  <Button variant="outline">Compartir codigo</Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-primary/10 bg-white">
            <CardContent className="p-5 md:p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Checklist del transportista
              </div>

              <div className="mt-4 space-y-3">
                {carrierChecklist.map((item) => (
                  <div key={item} className="rounded-[1.45rem] border border-primary/10 bg-[#fffaf6] px-4 py-4 text-sm text-muted-foreground">
                    {item}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-white">
            <CardContent className="p-5 md:p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Package2 className="h-4 w-4 text-primary" />
                Lo que vera el emisor
              </div>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                El emisor solo necesita algo claro: recogido, en ruta o entregado. Cada cambio que haces aqui simplifica el seguimiento.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </PlatformLayout>
  );
};

export default CarrierTrip;
