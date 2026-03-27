import { LEGAL_COMPANY } from "@/lib/legal";
import LegalPageLayout, { LegalSection } from "@/components/LegalPageLayout";

const TermsPage = () => (
  <LegalPageLayout
    title="Terminos de uso (AGB)"
    summary="Estas condiciones regulan el uso de Cargoo como plataforma digital de contacto entre personas que desean transportar o enviar paquetes aprovechando trayectos ya existentes."
  >
    <LegalSection title="1. Funcion de la plataforma">
      <p>
        Cargoo pone a disposicion una plataforma digital para que usuarios particulares o profesionales puedan encontrarse, comunicarse y organizar por su cuenta posibles transportes de paquetes. Cargoo no actua como transportista, mensajero, transitario, almacenista, aseguradora ni intermediario de pagos, salvo que en el futuro se indique expresamente por escrito en condiciones adicionales.
      </p>
      <p>
        El uso de la plataforma no convierte a Cargoo en parte del acuerdo que los usuarios puedan alcanzar entre si. Cualquier recogida, entrega, transporte, intercambio de dinero, reembolso, seguro o acuerdo paralelo se realiza exclusivamente entre los usuarios implicados.
      </p>
    </LegalSection>

    <LegalSection title="2. Apertura de cuenta y datos veraces">
      <p>
        Para utilizar determinadas funciones es necesario crear una cuenta y facilitar datos completos, exactos y actualizados. Cada usuario es responsable de custodiar sus credenciales, mantener sus datos al dia y no permitir usos no autorizados de su cuenta.
      </p>
      <p>
        Cargoo puede limitar, suspender o cerrar cuentas si detecta datos falsos, uso abusivo, incumplimiento legal, actividad sospechosa o cualquier comportamiento que ponga en riesgo a terceros o a la plataforma.
      </p>
    </LegalSection>

    <LegalSection title="3. Responsabilidad exclusiva de los usuarios">
      <p>
        El emisor y el transportista son los unicos responsables de verificar la identidad de la otra parte, acordar las condiciones concretas del traslado, revisar el contenido permitido, preparar el embalaje adecuado, cumplir con normas de aduanas, exportacion, importacion, consumo, seguridad vial, sanidad, fiscalidad y cualquier otra obligacion legal aplicable.
      </p>
      <p>
        Cada usuario asume por su cuenta y riesgo la decision de contactar, entregar, transportar o recibir un paquete. El uso de valoraciones, perfiles publicos, mensajes o estados de viaje no sustituye la comprobacion propia que cada usuario debe realizar.
      </p>
    </LegalSection>

    <LegalSection title="4. Objetos prohibidos o restringidos">
      <p>Queda prohibido usar Cargoo para ofrecer, solicitar, entregar o transportar, entre otros:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>objetos ilegales o de procedencia ilicita;</li>
        <li>drogas, sustancias estupefacientes o productos falsificados;</li>
        <li>armas, municion, explosivos o materiales inflamables o peligrosos;</li>
        <li>dinero en efectivo, metales preciosos, documentos de identidad ajenos o bienes de alto valor no declarados;</li>
        <li>animales vivos, restos biologicos, mercancias perecederas sin condiciones adecuadas o cualquier objeto cuya posesion o transporte requiera autorizacion especial.</li>
      </ul>
      <p>
        Cargoo puede retirar anuncios, mensajes o cuentas y colaborar con las autoridades si aprecia indicios de uso ilicito o peligroso de la plataforma.
      </p>
    </LegalSection>

    <LegalSection title="5. Publicacion de rutas y uso de contenidos">
      <p>
        Quien publica una ruta, parada intermedia, mensaje, valoracion o dato en Cargoo garantiza que dispone de derecho para comunicarlo y que dicho contenido no vulnera derechos de terceros ni la normativa aplicable.
      </p>
      <p>
        El usuario conserva la titularidad de sus contenidos, pero concede a Cargoo una licencia no exclusiva, gratuita y limitada al funcionamiento, moderacion, seguridad y mejora operativa de la plataforma.
      </p>
    </LegalSection>

    <LegalSection title="6. Seguimiento, chats y valoraciones">
      <p>
        Los estados del viaje, botones como "Paquete cargado", "Estoy en..." o "Entregado", asi como mensajes y valoraciones, se basan en acciones introducidas por los propios usuarios. Cargoo no garantiza que dichos datos sean exactos, completos, oportunos o veraces en todo momento.
      </p>
      <p>
        Las valoraciones deben ser autenticas, respetuosas y referirse a experiencias reales. Cargoo se reserva el derecho de moderar o retirar contenido manifiestamente falso, ofensivo o contrario a la ley.
      </p>
    </LegalSection>

    <LegalSection title="7. Descargo de responsabilidad y limitacion de responsabilidad">
      <p>
        En la medida maxima permitida por la ley aplicable, Cargoo no responde de perdidas, danos, retrasos, entregas fallidas, robos, averias, multas, decomisos, perjuicios indirectos, lucro cesante, danos morales ni reclamaciones de terceros derivados del comportamiento de los usuarios, del contenido de los paquetes o del uso indebido de la plataforma.
      </p>
      <p>
        Cargoo tampoco garantiza la disponibilidad ininterrumpida del servicio, la ausencia de errores, la identidad real de todos los usuarios ni la legalidad o licitud de cada operacion concertada entre ellos.
      </p>
    </LegalSection>

    <LegalSection title="8. Indemnidad">
      <p>
        El usuario se compromete a mantener indemne a {LEGAL_COMPANY.brandName}, a su entidad operadora, administradores y colaboradores frente a reclamaciones, sanciones, costes, danos y gastos, incluidos honorarios razonables de abogados, derivados del incumplimiento de estos terminos, de la normativa aplicable o de derechos de terceros.
      </p>
    </LegalSection>

    <LegalSection title="9. Proteccion de datos">
      <p>
        El tratamiento de datos personales se regula adicionalmente en la Politica de privacidad. Al usar Cargoo, el usuario confirma haberla leido y entendido.
      </p>
    </LegalSection>

    <LegalSection title="10. Derecho aplicable y fuero">
      <p>
        Estos terminos se rigen por el derecho suizo, con exclusion de sus normas de conflicto. Salvo que existan normas imperativas que establezcan otra cosa, el fuero exclusivo para litigios relacionados con Cargoo sera el domicilio de la entidad operadora en Suiza.
      </p>
    </LegalSection>
  </LegalPageLayout>
);

export default TermsPage;
