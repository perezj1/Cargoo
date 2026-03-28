import { toast } from "sonner";

import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useLocale } from "@/contexts/LocaleContext";
import type { Locale } from "@/locales";

interface LanguageSwitcherProps {
  compact?: boolean;
  className?: string;
}

const LanguageSwitcher = ({ compact = false, className = "" }: LanguageSwitcherProps) => {
  const { locale, messages, setLocale, supportedLocales } = useLocale();
  const flagsByLocale: Record<Locale, string> = {
    es: "🇪🇸",
    en: "🇬🇧",
    de: "🇩🇪",
  };
  const currentFlag = flagsByLocale[locale];
  const currentLanguageName = messages.languageNames[locale];

  const handleLocaleChange = async (value: string) => {
    try {
      await setLocale(value as Locale);
    } catch {
      toast.error(messages.localeSwitcher.updateError);
    }
  };

  if (compact) {
    return (
      <Select value={locale} onValueChange={handleLocaleChange}>
        <SelectTrigger className={`min-w-0 max-w-full bg-card sm:w-[140px] ${className}`.trim()} aria-label={messages.localeSwitcher.label}>
          <span className="mr-2 text-base leading-none">{currentFlag}</span>
          <span className="truncate">{currentLanguageName}</span>
        </SelectTrigger>
        <SelectContent>
          {supportedLocales.map((item) => (
            <SelectItem key={item} value={item}>
              <span className="mr-2">{flagsByLocale[item]}</span>
              <span>{messages.languageNames[item]}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className={className}>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-base leading-none">{currentFlag}</span>
        <p className="text-sm font-medium">{messages.localeSwitcher.label}</p>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">{messages.localeSwitcher.helper}</p>
      <Select value={locale} onValueChange={handleLocaleChange}>
        <SelectTrigger className="w-full bg-background" aria-label={messages.localeSwitcher.label}>
          <span className="mr-2 text-base leading-none">{currentFlag}</span>
          <span className="truncate">{currentLanguageName}</span>
        </SelectTrigger>
        <SelectContent>
          {supportedLocales.map((item) => (
            <SelectItem key={item} value={item}>
              <span className="mr-2">{flagsByLocale[item]}</span>
              <span>{messages.languageNames[item]}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguageSwitcher;
