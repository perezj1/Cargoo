import { EyeOff, Globe, MessageSquare, Package, Search, Shield } from "lucide-react";
import { Link } from "react-router-dom";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: Search,
    title: "1. Busca una ruta",
    desc: "Usa el buscador para encontrar conductores que ya van hacia tu destino y tienen espacio disponible.",
  },
  {
    icon: MessageSquare,
    title: "2. Hablad y acordad",
    desc: "Comentad que hay que mover, cuanto ocupa, el punto de recogida y la entrega antes de confirmar.",
  },
  {
    icon: Package,
    title: "3. Prepara el paquete",
    desc: "Empaqueta todo bien y deja claras las indicaciones para que el transporte sea rapido y seguro.",
  },
  {
    icon: Shield,
    title: "4. Sigue el trayecto",
    desc: "Revisa el estado del viaje desde Cargoo y mantente en contacto con el conductor durante el recorrido.",
  },
];

const HowItWorksPage = () => (
  <div className="flex min-h-screen flex-col">
    <Navbar />
    <main className="flex-1 pt-16">
      <div className="container py-16">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h1 className="mb-4 text-3xl font-display font-bold md:text-5xl">Como funciona Cargoo</h1>
          <p className="text-lg text-muted-foreground">Una forma simple y cercana de mover paquetes aprovechando trayectos que ya existen.</p>
        </div>

        <div className="mx-auto max-w-xl space-y-8">
          {steps.map((step) => (
            <div key={step.title} className="flex items-start gap-5 rounded-xl bg-card p-6 shadow-card">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="mb-1 text-lg font-display font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-20 max-w-2xl">
          <h2 className="mb-8 text-center text-2xl font-display font-bold md:text-3xl">Perfil publico o privado</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-xl border-2 border-primary bg-card p-6 shadow-card">
              <div className="mb-4 flex items-center gap-3">
                <Globe className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-display font-semibold">Publico</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Visible en la web para todos</li>
                <li>✓ Mas oportunidades de contacto</li>
                <li>✓ Ideal para quien publica trayectos con frecuencia</li>
              </ul>
            </div>
            <div className="rounded-xl border-2 border-border bg-card p-6 shadow-card">
              <div className="mb-4 flex items-center gap-3">
                <EyeOff className="h-6 w-6 text-muted-foreground" />
                <h3 className="text-lg font-display font-semibold">Privado</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Solo usuarios registrados te ven</li>
                <li>✓ Mas control sobre quien te escribe</li>
                <li>✓ Util cuando quieres seleccionar mejor tus envios</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <Button variant="hero" size="lg" asChild>
            <Link to="/register">Comienza ahora</Link>
          </Button>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default HowItWorksPage;
