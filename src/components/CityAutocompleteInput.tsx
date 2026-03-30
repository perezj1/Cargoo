import { useEffect, useMemo, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { useLocale } from "@/contexts/LocaleContext";
import { type CityId, type CountryCode, getCityOptionLabel, getCityOptions, resolveCityIdFromInput } from "@/lib/location-catalog";
import { normalizeSearchText } from "@/lib/search-normalization";

type CityAutocompleteInputProps = {
  listId: string;
  value: string;
  selectedCityId: CityId | null;
  onValueChange: (value: string) => void;
  onSelectedCityIdChange: (cityId: CityId | null) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  countryCode?: CountryCode | null;
  type?: string;
};

const CityAutocompleteInput = ({
  value,
  selectedCityId,
  onValueChange,
  onSelectedCityIdChange,
  placeholder,
  className,
  required,
  disabled,
  countryCode,
  type = "text",
}: CityAutocompleteInputProps) => {
  const { locale } = useLocale();
  const blurTimeoutRef = useRef<number | null>(null);
  const focusTimeoutRef = useRef<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const options = useMemo(() => getCityOptions(locale, countryCode), [countryCode, locale]);
  const filteredOptions = useMemo(() => {
    const normalizedValue = normalizeSearchText(value);

    if (!normalizedValue) {
      return options;
    }

    return options.filter(
      (option) =>
        normalizeSearchText(option.label).includes(normalizedValue) ||
        normalizeSearchText(option.cityLabel).includes(normalizedValue) ||
        normalizeSearchText(option.countryCode).includes(normalizedValue),
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

  const selectCity = (cityId: CityId) => {
    onSelectedCityIdChange(cityId);
    onValueChange(getCityOptionLabel(cityId, locale));
    setIsOpen(false);
  };

  const handleChange = (nextValue: string) => {
    if (focusTimeoutRef.current) {
      window.clearTimeout(focusTimeoutRef.current);
    }

    onValueChange(nextValue);
    onSelectedCityIdChange(resolveCityIdFromInput(nextValue, countryCode));
    setIsOpen(true);
  };

  const handleBlur = () => {
    if (focusTimeoutRef.current) {
      window.clearTimeout(focusTimeoutRef.current);
    }

    blurTimeoutRef.current = window.setTimeout(() => {
      if (selectedCityId) {
        onValueChange(getCityOptionLabel(selectedCityId, locale));
      } else {
        const resolvedCityId = resolveCityIdFromInput(value, countryCode);

        if (resolvedCityId) {
          onSelectedCityIdChange(resolvedCityId);
          onValueChange(getCityOptionLabel(resolvedCityId, locale));
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
              key={option.id}
              type="button"
              className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-secondary"
              onClick={() => {
                selectCity(option.id);
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

export default CityAutocompleteInput;
