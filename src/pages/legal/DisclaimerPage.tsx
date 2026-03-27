import LegalPageLayout, { LegalSection } from "@/components/LegalPageLayout";
import { LEGAL_COMPANY } from "@/lib/legal";

const DisclaimerPage = () => (
  <LegalPageLayout
    title="Descargo de responsabilidad"
    summary="Cargoo es un servicio de intermediacion tecnica. Esta pagina resume de forma clara los limites de responsabilidad de la plataforma y recuerda que las decisiones, acciones y consecuencias del transporte recaen en los propios usuarios."
  >
    <LegalSection title="1. Cargoo solo facilita el contacto">
      <p>
        Cargoo no organiza ni ejecuta transportes por cuenta propia. La plataforma solo ofrece herramientas para publicar rutas, contactar, chatear, indicar estados manuales del viaje y dejar valoraciones. Todo acuerdo real entre emisor y transportista se adopta fuera de la esfera de control de Cargoo y bajo responsabilidad exclusiva de dichas partes.
      </p>
    </LegalSection>

    <LegalSection title="2. Sin control material sobre usuarios ni paquetes">
      <p>
        Cargoo no inspecciona cada paquete, no verifica fisicamente el contenido de los envios, no supervisa la entrega real, no comprueba sistematicamente licencias, seguros, documentacion, aduanas o autorizaciones de los usuarios, y no garantiza la identidad, solvencia, diligencia o licitud de cada persona que use la plataforma.
      </p>
    </LegalSection>

    <LegalSection title="3. Sin garantia sobre legalidad, seguridad o exito del transporte">
      <p>
        El uso de perfiles publicos, comentarios, mensajes, insignias, estados del viaje o valoraciones no supone garantia alguna de seguridad, calidad, cumplimiento normativo, puntualidad o correcta ejecucion de un transporte. Cada usuario debe valorar por si mismo el riesgo y la conveniencia de cualquier operacion.
      </p>
    </LegalSection>

    <LegalSection title="4. Responsabilidad de los usuarios por el uso de la plataforma">
      <p>
        Los usuarios son los unicos responsables del contenido que publican, de los bienes que ofrecen, aceptan, cargan o transportan, del embalaje, de la documentacion, del cumplimiento normativo y de cualquier dano, perdida, retraso, sancion o reclamacion que derive de sus actos u omisiones.
      </p>
    </LegalSection>

    <LegalSection title="5. Sin responsabilidad por mal uso">
      <p>
        En la medida maxima permitida por la ley, {LEGAL_COMPANY.brandName} no sera responsable del mal uso de la plataforma, del incumplimiento de acuerdos entre usuarios, ni de actos ilicitos, fraudulentos, negligentes o peligrosos cometidos por terceros usando Cargoo.
      </p>
      <p>
        Esto incluye, sin limitarse a ello, perdida o dano de paquetes, retrasos, entregas incompletas, sustracciones, uso indebido de datos, informacion falsa, infracciones aduaneras, fiscales o penales y cualquier perjuicio directo o indirecto derivado del uso de la plataforma por terceros.
      </p>
    </LegalSection>

    <LegalSection title="6. Sin seguro automatico">
      <p>
        Salvo que Cargoo publique expresamente un producto o cobertura especifica, la plataforma no ofrece seguro automatico para bienes, personas, rutas, pagos o disputas entre usuarios. Los usuarios deben contratar por su cuenta cualquier cobertura que consideren necesaria.
      </p>
    </LegalSection>

    <LegalSection title="7. Cooperacion con autoridades y medidas de seguridad">
      <p>
        Cargoo se reserva el derecho de bloquear cuentas, retirar contenidos, conservar registros tecnicos y cooperar con las autoridades cuando existan indicios de fraude, uso ilicito, riesgo para terceros o incumplimiento de la normativa aplicable.
      </p>
    </LegalSection>

    <LegalSection title="8. Reserva por normas imperativas">
      <p>
        Nada de lo indicado en este descargo pretende excluir responsabilidades que no puedan excluirse validamente conforme a la ley aplicable. En caso de conflicto, prevaleceran las normas imperativas vigentes.
      </p>
    </LegalSection>
  </LegalPageLayout>
);

export default DisclaimerPage;
