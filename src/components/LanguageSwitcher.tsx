import { Globe } from "lucide-react";
import { toast } from "sonner";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocale } from "@/contexts/LocaleContext";
import type { Locale } from "@/locales";

interface LanguageSwitcherProps {
  compact?: boolean;
  className?: string;
}

const LanguageSwitcher = ({ compact = false, className = "" }: LanguageSwitcherProps) => {
  const { locale, messages, setLocale, supportedLocales } = useLocale();

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
          <Globe className="mr-2 h-4 w-4" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {supportedLocales.map((item) => (
            <SelectItem key={item} value={item}>
              {messages.languageNames[item]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className={className}>
      <div className="mb-2 flex items-center gap-2">
        <Globe className="h-4 w-4 text-primary" />
        <p className="text-sm font-medium">{messages.localeSwitcher.label}</p>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">{messages.localeSwitcher.helper}</p>
      <Select value={locale} onValueChange={handleLocaleChange}>
        <SelectTrigger className="w-full bg-background" aria-label={messages.localeSwitcher.label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {supportedLocales.map((item) => (
            <SelectItem key={item} value={item}>
              {messages.languageNames[item]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguageSwitcher;
