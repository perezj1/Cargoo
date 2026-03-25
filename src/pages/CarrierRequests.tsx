import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Link2, MessageCircle, PhoneCall } from "lucide-react";

import { PlatformLayout } from "@/components/cargoo/PlatformLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { carrierRequests } from "@/lib/cargoo-data";

const requestTone = {
  Alta: "bg-[#fff1e6] text-[#b45d35]",
  Media: "bg-[#eef7ec] text-[#4f7854]",
  Flexible: "bg-[#e8eef7] text-[#486589]",
} as const;

const CarrierRequests = () => {
  const [selectedRequestId, setSelectedRequestId] = useState(carrierRequests[0]?.id ?? "");
  const selectedRequest = carrierRequests.find((request) => request.id === selectedRequestId) ?? carrierRequests[0];

  return (
    <PlatformLayout
      title="Solicitudes"
      subtitle="Aqui solo ves a quien te ha contactado. Entras, decides si te encaja y pasas el acuerdo al viaje."
      action={<Badge className="hidden rounded-full bg-accent/10 px-3 py-1 text-accent md:inline-flex">Mensajes recibidos</Badge>}
    >
      <section className="space-y-5">
        <div className="soft-panel p-5 md:p-7">
          <Badge className="rounded-full border-primary/10 bg-primary/5 px-4 py-1.5 text-primary shadow-none">
            Flujo simple
          </Badge>
          <h2 className="mt-5 font-heading text-3xl font-bold tracking-tight text-foreground md:text-5xl">
            Responde, acuerda la recogida y crea el seguimiento.
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
            El emisor te escribe, tu cierras el contacto fuera de la app y luego pasas al panel de viaje para mover estados.
          </p>
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-primary/10 bg-white">
            <CardContent className="p-5 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Bandeja</p>
                  <h3 className="font-heading text-2xl font-semibold text-foreground">Solicitudes abiertas</h3>
                </div>
                <Badge className="rounded-full border-primary/10 bg-primary/5 px-3 py-1 text-primary shadow-none">
                  {carrierRequests.length}
                </Badge>
              </div>

              <div className="mt-5 space-y-3">
                {carrierRequests.map((request) => (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => setSelectedRequestId(request.id)}
                    className={
                      selectedRequest.id === request.id
                        ? "w-full rounded-[1.7rem] border border-primary/10 bg-[#fffaf6] px-4 py-4 text-left shadow-[0_16px_36px_rgba(255,122,48,0.05)]"
                        : "w-full rounded-[1.7rem] border border-primary/10 bg-white px-4 py-4 text-left transition-colors hover:bg-[#fffaf6]"
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{request.senderName}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{request.item}</p>
                      </div>
                      <Badge className={`rounded-full px-3 py-1 ${requestTone[request.urgency]}`}>{request.urgency}</Badge>
                    </div>
                    <p className="mt-3 text-sm text-foreground">{request.route}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{request.pickupWindow}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-white">
            <CardContent className="p-5 md:p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <MessageCircle className="h-4 w-4 text-primary" />
                Solicitud seleccionada
              </div>

              <h3 className="mt-4 font-heading text-3xl font-semibold text-foreground">{selectedRequest.senderName}</h3>
              <p className="mt-2 text-muted-foreground">{selectedRequest.item}</p>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-[1.5rem] border border-primary/10 bg-[#fffaf6] px-4 py-4">
                  <p className="text-sm text-muted-foreground">Ruta</p>
                  <p className="mt-2 font-medium text-foreground">{selectedRequest.route}</p>
                </div>
                <div className="rounded-[1.5rem] border border-primary/10 bg-[#fffaf6] px-4 py-4">
                  <p className="text-sm text-muted-foreground">Espacio pedido</p>
                  <p className="mt-2 font-medium text-foreground">{selectedRequest.requestedSpace}</p>
                </div>
                <div className="rounded-[1.5rem] border border-primary/10 bg-[#fffaf6] px-4 py-4">
                  <p className="text-sm text-muted-foreground">Ventana de recogida</p>
                  <p className="mt-2 font-medium text-foreground">{selectedRequest.pickupWindow}</p>
                </div>
                <div className="rounded-[1.5rem] border border-primary/10 bg-[#fffaf6] px-4 py-4">
                  <p className="text-sm text-muted-foreground">Canal preferido</p>
                  <p className="mt-2 font-medium text-foreground">{selectedRequest.preferredContact}</p>
                </div>
              </div>

              <div className="mt-4 rounded-[1.6rem] border border-primary/10 bg-white px-4 py-4 shadow-[0_16px_36px_rgba(255,122,48,0.05)]">
                <p className="text-sm text-muted-foreground">Nota del emisor</p>
                <p className="mt-2 text-sm leading-7 text-foreground">{selectedRequest.note}</p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Button className="w-full">
                  <MessageCircle className="h-4 w-4" />
                  Responder ahora
                </Button>
                <Button variant="outline" className="w-full">
                  <PhoneCall className="h-4 w-4" />
                  Llamar
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/carrier/trip">
                    <Link2 className="h-4 w-4" />
                    Crear seguimiento
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/carrier/profile">
                    Ajustar ficha
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </PlatformLayout>
  );
};

export default CarrierRequests;
