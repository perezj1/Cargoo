import { useState } from "react";
import { ArrowRight, Globe, MapPin, Package, Search, Shield, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import heroImage from "@/assets/hero-travel.jpg";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import TravelerCard from "@/components/TravelerCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MOCK_TRAVELERS } from "@/lib/mock-travelers";

const Index = () => {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const navigate = useNavigate();

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    navigate(`/search?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`);
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="relative flex min-h-[85vh] items-center pt-16">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Trayecto por carretera" className="h-full w-full object-cover" width={1920} height={1080} />
          <div className="absolute inset-0 bg-foreground/60" />
        </div>
        <div className="container relative z-10 py-20">
          <div className="max-w-2xl">
            <h1 className="mb-6 animate-fade-in-up text-4xl font-display font-bold text-background md:text-6xl">
              Mueve lo que necesites con conductores de confianza
            </h1>
            <p className="mb-10 animate-fade-in-up text-lg text-background/80 md:text-xl" style={{ animationDelay: "0.15s" }}>
              Cargoo conecta personas que necesitan enviar paquetes con conductores que ya tienen espacio libre en su coche.
            </p>

            <form
              onSubmit={handleSearch}
              className="animate-fade-in-up flex flex-col gap-3 rounded-xl bg-card p-3 shadow-card-hover md:flex-row"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="flex flex-1 items-center gap-2 px-3">
                <MapPin className="h-5 w-5 shrink-0 text-primary" />
                <Input
                  placeholder="Origen (ej. Madrid)"
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                  value={origin}
                  onChange={(event) => setOrigin(event.target.value)}
                />
              </div>
              <div className="hidden w-px bg-border md:block" />
              <div className="flex flex-1 items-center gap-2 px-3">
                <MapPin className="h-5 w-5 shrink-0 text-accent" />
                <Input
                  placeholder="Destino (ej. Barcelona)"
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                />
              </div>
              <Button type="submit" variant="hero" size="lg" className="gap-2">
                <Search className="h-4 w-4" />
                Buscar
              </Button>
            </form>
          </div>
        </div>
      </section>

      <section className="bg-secondary py-20">
        <div className="container">
          <h2 className="mb-4 text-center text-3xl font-display font-bold md:text-4xl">Como funciona</h2>
          <p className="mx-auto mb-12 max-w-xl text-center text-muted-foreground">
            Tres pasos simples para publicar un trayecto o encontrar a la persona adecuada para tu envio.
          </p>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { icon: Search, title: "Busca un conductor", desc: "Encuentra personas con una ruta parecida a la tuya y espacio disponible en su coche." },
              { icon: Package, title: "Acordad el envio", desc: "Hablad sobre peso, horario, recogida y entrega antes de confirmar el trayecto." },
              { icon: Shield, title: "Haz seguimiento", desc: "Consulta el estado del viaje y mantente en contacto durante todo el recorrido." },
            ].map((step) => (
              <div key={step.title} className="group rounded-xl bg-card p-8 text-center shadow-card transition-shadow hover:shadow-card-hover">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <step.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mb-3 text-xl font-display font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-display font-bold">Conductores destacados</h2>
              <p className="mt-2 text-muted-foreground">Perfiles verificados listos para mover paquetes</p>
            </div>
            <Button variant="outline" asChild className="hidden gap-2 md:flex">
              <Link to="/search">
                Ver todos <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {MOCK_TRAVELERS.slice(0, 3).map((traveler) => (
              <TravelerCard key={traveler.id} traveler={traveler} />
            ))}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Button variant="outline" asChild className="gap-2">
              <Link to="/search">
                Ver todos <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-primary py-16">
        <div className="container">
          <div className="grid grid-cols-2 gap-8 text-center text-primary-foreground md:grid-cols-4">
            {[
              { icon: Users, label: "Conductores activos", value: "2,500+" },
              { icon: Globe, label: "Ciudades conectadas", value: "45+" },
              { icon: Package, label: "Envios completados", value: "12,000+" },
              { icon: Shield, label: "Satisfaccion", value: "98%" },
            ].map((stat) => (
              <div key={stat.label}>
                <stat.icon className="mx-auto mb-3 h-8 w-8 opacity-80" />
                <div className="mb-1 text-2xl font-bold md:text-3xl">{stat.value}</div>
                <div className="text-sm opacity-80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container text-center">
          <h2 className="mb-4 text-3xl font-display font-bold md:text-4xl">Tienes un hueco libre en tu coche?</h2>
          <p className="mx-auto mb-8 max-w-lg text-muted-foreground">
            Publica tu proximo trayecto en Cargoo y conecta con personas que necesitan enviar algo por tu misma ruta.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button variant="hero" size="lg" asChild>
              <Link to="/register">Crear cuenta gratis</Link>
            </Button>
            <Button variant="hero-outline" size="lg" asChild>
              <Link to="/how-it-works">Saber mas</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
