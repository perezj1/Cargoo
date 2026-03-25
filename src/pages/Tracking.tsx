import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, CarFront, Clock3, MapPinned, Package2, Search, Share2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { carrierShipments, carrierStageFlow } from "@/lib/cargoo-data";
import { getAppHomePath, getStoredAppRole } from "@/lib/app-role";

const stageStyles = {
  Acordado: "bg-[#fff3e8] text-[#b45d35]",
  Recogido: "bg-[#eef7ec] text-[#4f7854]",
  "En ruta": "bg-[#e8eef7] text-[#486589]",
  Entregado: "bg-[#111111] text-white",
} as const;

const Tracking = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const appEntry = user ? getAppHomePath(getStoredAppRole()) : "/auth";
  const [lookupCode, setLookupCode] = useState(code ?? carrierShipments[0]?.trackingCode ?? "");

  useEffect(() => {
    setLookupCode(code ?? carrierShipments[0]?.trackingCode ?? "");
  }, [code]);

  const activeCode = (code ?? lookupCode).trim().toUpperCase();
  const shipment = carrierShipments.find((item) => item.trackingCode.toUpperCase() === activeCode) ?? null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextCode = lookupCode.trim().toUpperCase();
    if (!nextCode) return;
    navigate(`/tracking/${nextCode}`);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 hero-mesh opacity-90" />

      <header className="relative z-10 border-b border-black/5 bg-background/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 md:px-6">
          <Link to="/home" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.45rem] bg-[#111111] text-white shadow-lg shadow-black/15">
              <CarFront className="h-5 w-5" />
            </div>
            <div>
              <p className="font-heading text-lg font-bold tracking-tight text-foreground">Cargoo</p>
              <p className="text-xs text-muted-foreground">seguimiento por codigo</p>
            </div>
          </Link>

          <Button asChild size="sm">
            <Link to={appEntry}>{user ? "Abrir app" : "Entrar"}</Link>
          </Button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          <div className="soft-panel p-7 md:p-9">
            <Badge className="rounded-full border-black/5 bg-white px-4 py-1 text-foreground">Seguimiento compartible</Badge>
            <h1 className="mt-5 font-heading text-4xl font-bold tracking-tight md:text-6xl">
              Introduce el codigo del transportista y mira el estado real del envio.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
              El transportista genera el codigo al cerrar el acuerdo, actualiza cada etapa del viaje y el emisor lo
              consulta desde aqui sin pasos extra.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={lookupCode}
                  onChange={(event) => setLookupCode(event.target.value.toUpperCase())}
                  placeholder="Ejemplo: CG-4F92H1"
                  className="pl-11"
                />
              </div>
              <Button type="submit" size="lg">
                Ver seguimiento
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {carrierShipments.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(`/tracking/${item.trackingCode}`)}
                  className="rounded-[1.4rem] border border-black/5 bg-white p-4 text-left shadow-sm transition-transform hover:-translate-y-0.5"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Codigo</p>
                  <p className="mt-2 font-heading text-xl font-semibold">{item.trackingCode}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{item.senderName}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="phone-frame mx-auto w-full max-w-[430px] p-3">
            <div className="phone-screen px-4 pb-4 pt-12">
              <div className="rounded-[1.8rem] bg-white p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">Codigo activo</p>
                <p className="mt-2 font-heading text-3xl font-semibold">{shipment?.trackingCode ?? "Sin resultado"}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {shipment ? `${shipment.senderName} - ${shipment.route}` : "Prueba con uno de los codigos de ejemplo."}
                </p>
              </div>

              {shipment ? (
                <>
                  <div className="route-map relative mt-4 h-60 rounded-[1.9rem] border border-black/5">
                    <div className="route-line route-line-main" />
                    <div className="route-line route-line-alt" />
                    <div className="route-stop route-stop-start" />
                    <div className="route-stop route-stop-mid" />
                    <div className="route-stop route-stop-end" />
                    <div className="route-tag left-[10%] top-[16%]">Acordado</div>
                    <div className="route-tag left-[42%] top-[42%]">Recogido</div>
                    <div className="route-tag left-[65%] top-[70%]">{shipment.stage}</div>
                  </div>

                  <div className="-mt-8 rounded-[1.9rem] bg-[#111111] p-5 text-white shadow-[0_24px_50px_rgba(15,23,42,0.18)]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-white/65">Estado actual</p>
                        <h2 className="mt-2 font-heading text-3xl font-semibold">{shipment.stage}</h2>
                      </div>
                      <Badge className={`rounded-full border-white/10 px-3 py-1 ${stageStyles[shipment.stage]}`}>
                        {shipment.updatedAt}
                      </Badge>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-white/60">Ruta</p>
                        <p className="mt-1 font-medium text-white">{shipment.route}</p>
                      </div>
                      <div>
                        <p className="text-white/60">ETA</p>
                        <p className="mt-1 font-medium text-white">{shipment.eta}</p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-[1.5rem] bg-white/10 p-4 text-sm text-white/80">
                      <p>{shipment.summary}</p>
                      <p className="mt-2">{shipment.checkpoint}</p>
                      <p className="mt-2">Siguiente paso: {shipment.nextAction}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-4 rounded-[1.75rem] bg-[#111111] p-5 text-white">
                  <p className="font-heading text-2xl font-semibold">Codigo no encontrado</p>
                  <p className="mt-3 text-sm text-white/75">
                    Revisa el codigo que te compartio el transportista o prueba uno de los ejemplos de arriba.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {shipment ? (
          <section className="mt-8 grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
            <Card>
              <CardContent className="p-6 md:p-8">
                <div className="flex items-center gap-3">
                  <Package2 className="h-5 w-5 text-primary" />
                  <h2 className="font-heading text-3xl font-semibold">{shipment.item}</h2>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {carrierStageFlow.map((step) => (
                    <Badge
                      key={step}
                      className={step === shipment.stage ? `rounded-full px-3 py-1 ${stageStyles[step]}` : "rounded-full border-black/5 bg-white px-3 py-1 text-foreground"}
                    >
                      {step}
                    </Badge>
                  ))}
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-black/5 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <MapPinned className="h-4 w-4 text-primary" />
                      Checkpoint actual
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{shipment.checkpoint}</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-black/5 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Clock3 className="h-4 w-4 text-primary" />
                      Hora estimada
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{shipment.eta}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="peach-card">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-primary" />
                  <h2 className="font-heading text-3xl font-semibold">Pagina para compartir</h2>
                </div>
                <p className="mt-4 text-muted-foreground">
                  Este enlace lo comparte el transportista cuando acepta llevar el paquete y actualiza el viaje.
                </p>

                <div className="mt-6 rounded-[1.6rem] border border-black/5 bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">URL</p>
                  <p className="mt-2 break-all text-sm font-medium text-foreground">{`${window.location.origin}${shipment.shareUrl}`}</p>
                </div>

                <Button asChild className="mt-6 w-full">
                  <Link to={shipment.shareUrl}>Abrir esta pagina</Link>
                </Button>
              </CardContent>
            </Card>
          </section>
        ) : null}
      </main>
    </div>
  );
};

export default Tracking;
