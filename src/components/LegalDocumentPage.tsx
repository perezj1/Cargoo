import LegalPageLayout, { LegalSection } from "@/components/LegalPageLayout";
import { useLocale } from "@/contexts/LocaleContext";
import { interpolateLegalText } from "@/lib/legal";

type LegalDocumentKey = "terms" | "privacy" | "imprint" | "disclaimer";

const LegalDocumentPage = ({ documentKey }: { documentKey: LegalDocumentKey }) => {
  const { messages } = useLocale();
  const document = messages.legal[documentKey];

  return (
    <LegalPageLayout title={document.title} summary={document.summary}>
      {document.sections.map((section) => (
        <LegalSection key={section.title} title={section.title}>
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph}>{interpolateLegalText(paragraph)}</p>
          ))}
          {section.bullets?.length ? (
            <ul className="list-disc space-y-2 pl-5">
              {section.bullets.map((bullet) => (
                <li key={bullet}>{interpolateLegalText(bullet)}</li>
              ))}
            </ul>
          ) : null}
        </LegalSection>
      ))}
    </LegalPageLayout>
  );
};

export default LegalDocumentPage;
