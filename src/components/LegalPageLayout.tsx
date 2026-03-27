import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { LEGAL_LAST_UPDATED, LEGAL_LINKS } from "@/lib/legal";

interface LegalPageLayoutProps {
  title: string;
  summary: string;
  children: ReactNode;
}

const legalNavigation = [
  { label: "AGB / Terminos", href: LEGAL_LINKS.terms },
  { label: "Privacidad", href: LEGAL_LINKS.privacy },
  { label: "Disclaimer", href: LEGAL_LINKS.disclaimer },
  { label: "Impressum", href: LEGAL_LINKS.imprint },
];

export const LegalSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="space-y-3">
    <h2 className="text-xl font-display font-semibold text-foreground md:text-2xl">{title}</h2>
    <div className="space-y-3 text-sm leading-7 text-muted-foreground md:text-base">{children}</div>
  </section>
);

const LegalPageLayout = ({ title, summary, children }: LegalPageLayoutProps) => (
  <div className="flex min-h-screen flex-col bg-secondary">
    <Navbar />
    <main className="flex-1 pt-16">
      <div className="container py-12 md:py-16">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>

        <div className="rounded-[28px] bg-card p-6 shadow-card md:p-10">
          <div className="mb-8 space-y-4 border-b border-border pb-8">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Legal</p>
            <div className="max-w-3xl space-y-3">
              <h1 className="text-3xl font-display font-bold text-foreground md:text-5xl">{title}</h1>
              <p className="text-base leading-7 text-muted-foreground md:text-lg">{summary}</p>
            </div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Ultima actualizacion: {LEGAL_LAST_UPDATED}</p>
          </div>

          <div className="grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
            <aside className="h-fit rounded-2xl border border-border bg-secondary/70 p-4">
              <p className="mb-3 text-sm font-semibold text-foreground">Documentos</p>
              <nav className="space-y-2 text-sm">
                {legalNavigation.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="block rounded-xl px-3 py-2 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </aside>

            <div className="space-y-8">{children}</div>
          </div>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default LegalPageLayout;
