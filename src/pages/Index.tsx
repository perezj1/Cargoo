import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Globe, MapPin, Package, Search, Shield, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import heroImage from "@/assets/hero-travel.jpg";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import TravelerCard from "@/components/TravelerCard";
import { useLocale } from "@/contexts/LocaleContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MOCK_TRAVELERS } from "@/lib/mock-travelers";
import type { Locale } from "@/locales";

const CITY_EXAMPLES: Record<Locale, { origins: string[]; destinations: string[] }> = {
  es: {
    origins: ["Zúrich", "Lucerna", "Lausana", "Milán"],
    destinations: ["Madrid", "Belgrado", "Lisboa", "Roma", "París"],
  },
  en: {
    origins: ["Zurich", "Lucerne", "Lausanne", "Milan"],
    destinations: ["Madrid", "Belgrade", "Lisbon", "Rome", "Paris"],
  },
  de: {
    origins: ["Zürich", "Luzern", "Lausanne", "Mailand"],
    destinations: ["Madrid", "Belgrad", "Lissabon", "Rom", "Paris"],
  },
};

const Index = () => {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const navigate = useNavigate();
  const { locale, messages } = useLocale();
  const examples = useMemo(() => CITY_EXAMPLES[locale], [locale]);
  const [originExample, setOriginExample] = useState(examples.origins[0]);
  const [destinationExample, setDestinationExample] = useState(examples.destinations[0]);

  useEffect(() => {
    const pickRandomPair = () => {
      const nextOrigin = examples.origins[Math.floor(Math.random() * examples.origins.length)];
      const nextDestination = examples.destinations[Math.floor(Math.random() * examples.destinations.length)];
      setOriginExample(nextOrigin);
      setDestinationExample(nextDestination);
    };

    pickRandomPair();
    const intervalId = window.setInterval(pickRandomPair, 4000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [examples]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    navigate(`/search?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`);
  };

  const originPlaceholder =
    locale === "de"
      ? `Startort (z. B. ${originExample})`
      : locale === "en"
        ? `Origin (e.g. ${originExample})`
        : `Origen (ej. ${originExample})`;

  const destinationPlaceholder =
    locale === "de"
      ? `Zielort (z. B. ${destinationExample})`
      : locale === "en"
        ? `Destination (e.g. ${destinationExample})`
        : `Destino (ej. ${destinationExample})`;

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />

      <section className="relative flex min-h-[85vh] items-center pt-16">
        <div className="absolute inset-0">
          <img src={heroImage} alt={messages.landing.heroImageAlt} className="h-full w-full object-cover" width={1920} height={1080} />
          <div className="absolute inset-0 bg-foreground/60" />
        </div>
        <div className="container relative z-10 py-16 sm:py-20 lg:py-24">
          <div className="max-w-3xl min-w-0 lg:max-w-4xl">
            <h1 className="mb-6 max-w-full animate-fade-in-up break-words font-display font-bold leading-[0.92] text-background [overflow-wrap:anywhere] [text-wrap:balance] text-[clamp(3rem,8vw,6rem)]">
              {messages.landing.heroTitle}
            </h1>
            <p
              className="mb-10 max-w-3xl animate-fade-in-up break-words text-base text-background/80 [overflow-wrap:anywhere] sm:text-lg lg:text-xl"
              style={{ animationDelay: "0.15s" }}
            >
              {messages.landing.heroDescription}
            </p>

            <form
              onSubmit={handleSearch}
              className="animate-fade-in-up flex max-w-3xl flex-col gap-3 overflow-hidden rounded-xl bg-card p-3 shadow-card-hover md:flex-row lg:max-w-[54rem]"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
                <MapPin className="h-5 w-5 shrink-0 text-primary" />
                <Input
                  placeholder={originPlaceholder}
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                  value={origin}
                  onChange={(event) => setOrigin(event.target.value)}
                />
              </div>
              <div className="hidden w-px bg-border md:block" />
              <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
                <MapPin className="h-5 w-5 shrink-0 text-accent" />
                <Input
                  placeholder={destinationPlaceholder}
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                />
              </div>
              <Button type="submit" variant="hero" size="lg" className="w-full gap-2 md:w-auto">
                <Search className="h-4 w-4" />
                {messages.landing.searchButton}
              </Button>
            </form>
          </div>
        </div>
      </section>

      <section className="bg-secondary py-20">
        <div className="container">
          <h2 className="mb-4 text-center text-3xl font-display font-bold md:text-4xl">{messages.landing.howItWorksTitle}</h2>
          <p className="mx-auto mb-12 max-w-xl text-center text-muted-foreground">{messages.landing.howItWorksDescription}</p>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[Search, Package, Shield].map((Icon, index) => {
              const step = messages.landing.steps[index];

              return (
                <div key={step.title} className="group rounded-xl bg-card p-8 text-center shadow-card transition-shadow hover:shadow-card-hover">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mb-3 text-xl font-display font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="break-words text-3xl font-display font-bold [overflow-wrap:anywhere]">{messages.landing.featuredTitle}</h2>
              <p className="mt-2 text-muted-foreground">{messages.landing.featuredDescription}</p>
            </div>
            <Button variant="outline" asChild className="hidden gap-2 md:flex">
              <Link to="/search">
                {messages.landing.viewAll} <ArrowRight className="h-4 w-4" />
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
                {messages.landing.viewAll} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-primary py-16">
        <div className="container">
          <div className="grid grid-cols-2 gap-8 text-center text-primary-foreground md:grid-cols-4">
            {[Users, Globe, Package, Shield].map((Icon, index) => {
              const stat = messages.landing.stats[index];

              return (
              <div key={stat.label}>
                <Icon className="mx-auto mb-3 h-8 w-8 opacity-80" />
                <div className="mb-1 text-2xl font-bold md:text-3xl">{stat.value}</div>
                <div className="text-sm opacity-80">{stat.label}</div>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container text-center">
          <h2 className="mb-4 break-words text-3xl font-display font-bold [overflow-wrap:anywhere] md:text-4xl">{messages.landing.ctaTitle}</h2>
          <p className="mx-auto mb-8 max-w-lg text-muted-foreground">{messages.landing.ctaDescription}</p>
          <div className="flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center">
            <Button variant="hero" size="lg" asChild className="w-full sm:w-auto">
              <Link to="/register">{messages.landing.ctaPrimary}</Link>
            </Button>
            <Button variant="hero-outline" size="lg" asChild className="w-full sm:w-auto">
              <Link to="/how-it-works">{messages.landing.ctaSecondary}</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
