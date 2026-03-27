import { EyeOff, Globe, MessageSquare, Package, Search, Shield } from "lucide-react";
import { Link } from "react-router-dom";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/contexts/LocaleContext";

const HowItWorksPage = () => {
  const { messages } = useLocale();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="container py-16">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h1 className="mb-4 text-3xl font-display font-bold md:text-5xl">{messages.howItWorks.title}</h1>
            <p className="text-lg text-muted-foreground">{messages.howItWorks.subtitle}</p>
          </div>

          <div className="mx-auto max-w-xl space-y-8">
            {[Search, MessageSquare, Package, Shield].map((Icon, index) => {
              const step = messages.howItWorks.steps[index];

              return (
                <div key={step.title} className="flex items-start gap-5 rounded-xl bg-card p-6 shadow-card">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="mb-1 text-lg font-display font-semibold">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mx-auto mt-20 max-w-2xl">
            <h2 className="mb-8 text-center text-2xl font-display font-bold md:text-3xl">{messages.howItWorks.publicPrivateTitle}</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-xl border-2 border-primary bg-card p-6 shadow-card">
                <div className="mb-4 flex items-center gap-3">
                  <Globe className="h-6 w-6 text-primary" />
                  <h3 className="text-lg font-display font-semibold">{messages.howItWorks.publicTitle}</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {messages.howItWorks.publicBullets.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border-2 border-border bg-card p-6 shadow-card">
                <div className="mb-4 flex items-center gap-3">
                  <EyeOff className="h-6 w-6 text-muted-foreground" />
                  <h3 className="text-lg font-display font-semibold">{messages.howItWorks.privateTitle}</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {messages.howItWorks.privateBullets.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <Button variant="hero" size="lg" asChild>
              <Link to="/register">{messages.howItWorks.cta}</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HowItWorksPage;
