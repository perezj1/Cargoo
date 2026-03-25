import { Link } from "react-router-dom";
import { BellRing, CheckCircle2, Download, Eye, ShieldCheck, Smartphone } from "lucide-react";

import { PlatformLayout } from "@/components/cargoo/PlatformLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { installBenefits, safetyLayers, trackingItems, trips } from "@/lib/cargoo-data";

const Safety = () => {
  return (
    <PlatformLayout
      title="Como funciona y que inspira confianza"
      subtitle="Cargoo es simple, pero aun asi ensena lo necesario para que emisor y transportista se entiendan bien."
    >
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-heading text-3xl font-semibold">Tres cosas que la app deja siempre claras</h2>
                <p className="text-muted-foreground">Sin meter capas de negocio que no necesitas.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {safetyLayers.map((layer, index) => (
                <div
                  key={layer.title}
                  className={index === 1 ? "rounded-[1.75rem] border border-black/5 bg-[#faf7f2] p-5" : "rounded-[1.75rem] border border-black/5 bg-white p-5 shadow-sm"}
                >
                  <p className="font-heading text-xl font-semibold">{layer.title}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {layer.bullets.map((bullet) => (
                      <Badge key={bullet} variant="outline" className="rounded-full bg-white/70">
                        {bullet}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                { icon: Eye, title: "Perfil visible", text: "Se ve quien conduce, su ruta y como responde." },
                { icon: CheckCircle2, title: "Estado simple", text: "Reservado, recogido, en ruta o entregado." },
                { icon: BellRing, title: "Ultima actualizacion", text: "Cada envio muestra el checkpoint mas reciente." },
                { icon: ShieldCheck, title: "Uso claro", text: "Buscar, contactar y seguir. Nada mas." },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.title} className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{item.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="ink-card text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-amber-300" />
                <div>
                  <h2 className="font-heading text-2xl font-semibold">PWA pensada para abrirse rapido</h2>
                  <p className="mt-1 text-sm text-slate-300">Especialmente util cuando solo quieres ver estado o escribir al transportista.</p>
                </div>
              </div>
              <div className="mt-6 space-y-4">
                {installBenefits.map((benefit) => (
                  <div key={benefit} className="flex gap-3 rounded-[1.6rem] bg-white/10 p-4 text-sm text-slate-200">
                    <Download className="mt-0.5 h-5 w-5 text-white" />
                    {benefit}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="peach-card">
            <CardContent className="p-6">
              <h2 className="font-heading text-2xl font-semibold">Ejemplos de estado</h2>
              <div className="mt-5 space-y-4">
                {trackingItems.map((item) => (
                  <div key={item.id} className="rounded-[1.5rem] border border-black/5 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-foreground">{item.item}</p>
                      <Badge className="rounded-full border-black/5 bg-[#111111] px-3 py-1 text-white">{item.status}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{item.statusDetail}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{item.updatedAt}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="mint-card">
            <CardContent className="p-6">
              <h2 className="font-heading text-2xl font-semibold">Lo que ve un emisor al buscar</h2>
              <div className="mt-5 space-y-4">
                {trips.slice(0, 3).map((trip) => (
                  <div key={trip.id} className="rounded-[1.5rem] border border-black/5 bg-white p-4 shadow-sm">
                    <p className="font-medium text-foreground">{trip.travelerName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {trip.originCity} {"->"} {trip.destinationCity}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{trip.departureDay} - {trip.departureTime} - {trip.availableSpace}</p>
                  </div>
                ))}
              </div>
              <Button asChild className="mt-6 w-full">
                <Link to="/marketplace">Volver a buscar transportistas</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </PlatformLayout>
  );
};

export default Safety;
