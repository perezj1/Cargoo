import LegalPageLayout, { LegalSection } from "@/components/LegalPageLayout";
import { LEGAL_COMPANY } from "@/lib/legal";

const PrivacyPage = () => (
  <LegalPageLayout
    title="Politica de privacidad"
    summary="Esta politica explica como Cargoo trata datos personales en relacion con la web publica, la aplicacion, las cuentas de usuario, el chat, las rutas publicadas y el seguimiento de envios."
  >
    <LegalSection title="1. Responsable del tratamiento">
      <p>
        El responsable del tratamiento es {LEGAL_COMPANY.legalEntity}, marca {LEGAL_COMPANY.brandName}, con domicilio en {LEGAL_COMPANY.street}, {LEGAL_COMPANY.postalCodeCity}, {LEGAL_COMPANY.country}. Contacto de privacidad: {LEGAL_COMPANY.email}.
      </p>
    </LegalSection>

    <LegalSection title="2. Que datos tratamos">
      <ul className="list-disc space-y-2 pl-5">
        <li>datos de cuenta y perfil, como nombre, email, rol, ciudad, bio, foto de perfil y ajustes de visibilidad;</li>
        <li>datos operativos del servicio, como rutas, ciudades de paso, capacidad, estados del viaje, envios y valoraciones;</li>
        <li>mensajes y metadatos del chat entre usuarios;</li>
        <li>datos tecnicos y de seguridad necesarios para autenticacion, mantenimiento de sesion, almacenamiento local, instalacion PWA y proteccion frente a abuso;</li>
        <li>datos que debamos conservar por obligaciones legales, seguridad o defensa frente a reclamaciones.</li>
      </ul>
    </LegalSection>

    <LegalSection title="3. Finalidades del tratamiento">
      <p>Tratamos los datos para:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>crear y administrar cuentas;</li>
        <li>mostrar perfiles y rutas segun la configuracion de visibilidad elegida por cada usuario;</li>
        <li>facilitar el contacto y el seguimiento funcional entre emisor y transportista;</li>
        <li>prevenir fraude, abuso, accesos no autorizados y usos ilicitos de la plataforma;</li>
        <li>cumplir obligaciones legales y responder a autoridades competentes;</li>
        <li>mantener, depurar y mejorar el funcionamiento tecnico de Cargoo.</li>
      </ul>
    </LegalSection>

    <LegalSection title="4. Base y marco legal en Suiza">
      <p>
        Cargoo trata datos personales conforme al marco suizo aplicable, en particular la Ley federal suiza sobre proteccion de datos (FADP / revDSG) y sus principios de transparencia, proporcionalidad, seguridad, exactitud, privacy by design y privacy by default.
      </p>
      <p>
        Cuando resulte aplicable por razon del servicio ofrecido o del lugar donde se encuentren los usuarios, Cargoo tambien podra observar requisitos adicionales de otras normativas obligatorias.
      </p>
    </LegalSection>

    <LegalSection title="5. Destinatarios y acceso a los datos">
      <p>
        Determinados datos se comparten con otros usuarios segun la funcionalidad elegida: por ejemplo, nombre, foto, ciudad, valoraciones, rutas publicas, mensajes, estados del viaje y datos de contacto que el propio usuario decida publicar o comunicar.
      </p>
      <p>
        Ademas, podemos compartir datos con proveedores de infraestructura, autenticacion, base de datos, almacenamiento y soporte tecnico, siempre en la medida necesaria para operar Cargoo de forma segura y conforme a derecho.
      </p>
    </LegalSection>

    <LegalSection title="6. Transferencias internacionales">
      <p>
        Si utilizamos proveedores o sistemas ubicados fuera de Suiza, los datos podran tratarse en otros paises. En ese caso, Cargoo adoptara las medidas razonables y las garantias juridicas exigibles para mantener un nivel adecuado de proteccion, cuando la ley lo requiera.
      </p>
    </LegalSection>

    <LegalSection title="7. Conservacion">
      <p>
        Conservamos los datos personales mientras sean necesarios para la finalidad para la que se recogieron, para la relacion contractual u operativa con el usuario, para seguridad de la plataforma o para cumplir obligaciones legales y de prueba. Despues se eliminan o anonimizan en la medida posible.
      </p>
    </LegalSection>

    <LegalSection title="8. Seguridad">
      <p>
        Cargoo aplica medidas tecnicas y organizativas razonables para proteger los datos frente a acceso no autorizado, alteracion, perdida o divulgacion indebida. Aun asi, ninguna transmision por internet o sistema tecnico puede garantizar seguridad absoluta.
      </p>
    </LegalSection>

    <LegalSection title="9. Tus derechos">
      <p>De acuerdo con la normativa aplicable, puedes solicitar, entre otros, acceso, rectificacion, supresion, oposicion, limitacion del tratamiento y entrega o transmision de determinados datos cuando proceda.</p>
      <p>
        Tambien puedes pedir informacion sobre el tratamiento de tus datos y, en su caso, retirar un consentimiento que hayas dado para un tratamiento concreto. Para ejercer tus derechos, escribe a {LEGAL_COMPANY.email}.
      </p>
    </LegalSection>

    <LegalSection title="10. Cookies, almacenamiento local y tecnologias similares">
      <p>
        Cargoo utiliza mecanismos tecnicos como almacenamiento local, sessionStorage y tecnologias similares para funciones esenciales de autenticacion, seguridad, persistencia de sesion, experiencia de instalacion PWA y funcionamiento basico de la app. Si en el futuro se incorporan herramientas analiticas o de marketing adicionales, esta politica debera actualizarse antes de su uso.
      </p>
    </LegalSection>

    <LegalSection title="11. Contacto y reclamaciones">
      <p>
        Si tienes preguntas sobre privacidad o deseas ejercer derechos, contacta con {LEGAL_COMPANY.email}. Si consideras que el tratamiento infringe la normativa aplicable, tambien puedes acudir a la autoridad competente, en Suiza el EDOB / FDPIC.
      </p>
    </LegalSection>
  </LegalPageLayout>
);

export default PrivacyPage;
