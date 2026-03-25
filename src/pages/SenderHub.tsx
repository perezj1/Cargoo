import { Link } from "react-router-dom";
import { Clock3, MapPinned, MessageCircle, Package2, Search, UserRound } from "lucide-react";

import { PlatformLayout } from "@/components/cargoo/PlatformLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { senderMetrics, trackingItems, travelLanes, trips } from "@/lib/cargoo-data";

const statusClasses = {
  Reservado: "bg-[#fff1e6] text-[#b45d35]",
  Recogido: "bg-[#eef7ec] text-[#4f7854]",
  "En ruta": "bg-[#e8eef7] text-[#486589]",
  Entregado: "bg-[#111111] text-white",
} as const;

const SenderHub = () => {
  return (
    <PlatformLayout
      title="Panel del emisor"
      subtitle="Busca transportistas, guarda rutas que te interesan y revisa el estado de los envios ya acordados."
      action={<Badge className="hidden rounded-full bg-primary/10 px-3 py-1 text-primary md:inline-flex">Modo emisor</Badge>}
    >
      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card>
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <Package2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-heading text-3xl font-semibold">Tus envios seguidos desde un mismo sitio</h2>
                <p className="text-muted-foreground">Sin solicitudes ni pagos en la app. Solo contacto y estado.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {senderMetrics.map((metric, index) => (
                <div
                  key={metric.label}
                  className={index === 1 ? "rounded-3xl border border-black/5 bg-[#faf7f2] p-4" : "rounded-3xl border border-black/5 bg-white p-4 shadow-sm"}
                >
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="mt-2 font-heading text-3xl font-bold">{metric.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-4">
              {trackingItems.map((item) => (
                <div key={item.id} className="rounded-[1.75rem] border border-black/5 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{item.route}</p>
                      <p className="mt-1 font-heading text-2xl font-semibold">{item.item}</p>
                      <p className="mt-2 text-sm text-muted-foreground">Transportista: {item.travelerName}</p>
                    </div>
                    <Badge className={`rounded-full px-3 py-1 ${statusClasses[item.status]}`}>{item.status}</Badge>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl bg-[#faf7f2] p-4">
                      <p className="text-sm text-muted-foreground">Ultima actualizacion</p>
                      <p className="mt-1 font-medium text-foreground">{item.updatedAt}</p>
                    </div>
                    <div className="rounded-2xl bg-[#faf7f2] p-4">
                      <p className="text-sm text-muted-foreground">Checkpoint</p>
                      <p className="mt-1 font-medium text-foreground">{item.checkpoint}</p>
                    </div>
                    <div className="rounded-2xl bg-[#faf7f2] p-4">
                      <p className="text-sm text-muted-foreground">ETA</p>
                      <p className="mt-1 font-medium text-foreground">{item.eta}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-4 rounded-[1.5rem] border border-black/5 bg-[#fff9f3] p-4">
                    <div>
                      <p className="font-medium text-foreground">{item.contactLabel}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.statusDetail}</p>
                    </div>
                    <Button>Contactar</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="ink-card text-white">
            <CardContent className="p-6">
              <h2 className="font-heading text-2xl font-semibold">Lo que haces desde aqui</h2>
              <div className="mt-6 space-y-4">
                {[
                  { icon: Search, title: "Buscar transportistas", text: "Filtra por ciudad de salida, destino, fecha, hora y espacio." },
                  { icon: MessageCircle, title: "Hablar con uno", text: "Abres contacto con el perfil que mejor encaja contigo." },
                  { icon: Clock3, title: "Mirar el estado", text: "Reservado, recogido, en ruta o entregado, con ultima actualizacion." },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.title} className="flex gap-3 rounded-[1.6rem] bg-white/10 p-4">
                      <div className="rounded-2xl bg-white/10 p-3">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{item.title}</p>
                        <p className="mt-1 text-sm text-slate-300">{item.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button asChild className="mt-6 w-full bg-white text-slate-950 hover:bg-white/90">
                <Link to="/marketplace">Buscar ahora</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="peach-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <MapPinned className="h-5 w-5 text-primary" />
                <h2 className="font-heading text-2xl font-semibold">Rutas que mas miras</h2>
              </div>
              <div className="mt-5 space-y-4">
                {travelLanes.slice(0, 3).map((lane) => (
                  <div key={lane.id} className="rounded-[1.5rem] border border-black/5 bg-white p-4 shadow-sm">
                    <p className="font-medium text-foreground">
                      {lane.originCity} {"->"} {lane.destinationCity}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{lane.weeklyTrips} salidas semanales - {lane.typicalSpace}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="mint-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <UserRound className="h-5 w-5 text-primary" />
                <h2 className="font-heading text-2xl font-semibold">Perfiles guardados</h2>
              </div>
              <div className="mt-5 space-y-4">
                {trips.slice(0, 3).map((trip) => (
                  <div key={trip.id} className="rounded-[1.5rem] border border-black/5 bg-white p-4 shadow-sm">
                    <p className="font-medium text-foreground">{trip.travelerName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {trip.originCity} {"->"} {trip.destinationCity}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{trip.departureDay} - {trip.departureTime}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </PlatformLayout>
  );
};

export default SenderHub;
