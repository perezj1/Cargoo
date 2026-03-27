import LegalPageLayout, { LegalSection } from "@/components/LegalPageLayout";
import { LEGAL_COMPANY } from "@/lib/legal";

const ImprintPage = () => (
  <LegalPageLayout
    title="Impressum"
    summary="Informacion de identidad y contacto de la entidad que opera Cargoo en Suiza."
  >
    <LegalSection title="Entidad operadora">
      <p>{LEGAL_COMPANY.legalEntity}</p>
      <p>{LEGAL_COMPANY.street}</p>
      <p>
        {LEGAL_COMPANY.postalCodeCity}, {LEGAL_COMPANY.country}
      </p>
    </LegalSection>

    <LegalSection title="Contacto">
      <p>Email: {LEGAL_COMPANY.email}</p>
    </LegalSection>

    <LegalSection title="Responsabilidad sobre contenidos de usuarios">
      <p>
        Cada usuario es responsable de sus propias publicaciones, rutas, mensajes, conversaciones, valoraciones, archivos y del uso que haga de la plataforma. Cargoo puede moderar o retirar contenidos, pero no asume como propios los contenidos generados por terceros.
      </p>
    </LegalSection>
  </LegalPageLayout>
);

export default ImprintPage;
