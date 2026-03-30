import { useEffect, useMemo, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { useLocale } from "@/contexts/LocaleContext";
import { getCountryLabel, getCountryOptions, resolveCountryCodeFromInput, type CountryCode } from "@/lib/location-catalog";
import { normalizeSearchText } from "@/lib/search-normalization";

type CountryAutocompleteInputProps = {
  value: string;
  selectedCountryCode: CountryCode | null;
  onValueChange: (value: string) => void;
  onSelectedCountryCodeChange: (countryCode: CountryCode | null) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  type?: string;
};

const CountryAutocompleteInput = ({
  value,
  selectedCountryCode,
  onValueChange,
  onSelectedCountryCodeChange,
  placeholder,
  className,
  required,
  disabled,
  type = "text",
}: CountryAutocompleteInputProps) => {
  const { locale } = useLocale();
  const blurTimeoutRef = useRef<number | null>(null);
  const focusTimeoutRef = useRef<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const options = useMemo(() => getCountryOptions(locale), [locale]);
  const filteredOptions = useMemo(() => {
    const normalizedValue = normalizeSearchText(value);

    if (!normalizedValue) {
      return options;
    }

    return options.filter(
      (option) =>
        normalizeSearchText(option.label).includes(normalizedValue) || normalizeSearchText(option.code).includes(normalizedValue),
    );
  }, [options, value]);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        window.clearTimeout(blurTimeoutRef.current);
      }

      if (focusTimeoutRef.current) {
        window.clearTimeout(focusTimeoutRef.current);
      }
    };
  }, []);

  const selectCountry = (countryCode: CountryCode) => {
    onSelectedCountryCodeChange(countryCode);
    onValueChange(getCountryLabel(countryCode, locale));
    setIsOpen(false);
  };

  const handleChange = (nextValue: string) => {
    if (focusTimeoutRef.current) {
      window.clearTimeout(focusTimeoutRef.current);
    }

    onValueChange(nextValue);
    onSelectedCountryCodeChange(resolveCountryCodeFromInput(nextValue));
    setIsOpen(true);
  };

  const handleBlur = () => {
    if (focusTimeoutRef.current) {
      window.clearTimeout(focusTimeoutRef.current);
    }

    blurTimeoutRef.current = window.setTimeout(() => {
      if (selectedCountryCode) {
        onValueChange(getCountryLabel(selectedCountryCode, locale));
      } else {
        const resolvedCountryCode = resolveCountryCodeFromInput(value);

        if (resolvedCountryCode) {
          onSelectedCountryCodeChange(resolvedCountryCode);
          onValueChange(getCountryLabel(resolvedCountryCode, locale));
        }
      }

      setIsOpen(false);
    }, 120);
  };

  const handleFocus = () => {
    if (blurTimeoutRef.current) {
      window.clearTimeout(blurTimeoutRef.current);
    }

    if (focusTimeoutRef.current) {
      window.clearTimeout(focusTimeoutRef.current);
    }

    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Input
        type={type}
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        className={className}
        required={required}
        disabled={disabled}
        autoComplete="off"
      />
      {isOpen && filteredOptions.length > 0 ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-30 max-h-56 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-card">
          {filteredOptions.slice(0, 8).map((option) => (
            <button
              key={option.code}
              type="button"
              className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-secondary"
              onClick={() => {
                selectCountry(option.code);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default CountryAutocompleteInput;
