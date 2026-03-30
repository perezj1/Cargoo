import { Check, ChevronDown, Filter } from "lucide-react";
import { useMemo, useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type TripSortOption = {
  value: string;
  label: string;
};

type TripSortDropdownProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: TripSortOption[];
  placeholder: string;
};

const TripSortDropdown = ({ value, onValueChange, options, placeholder }: TripSortDropdownProps) => {
  const [open, setOpen] = useState(false);
  const selectedOption = useMemo(() => options.find((option) => option.value === value) ?? null, [options, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-12 w-full items-center justify-between rounded-xl border border-border bg-card px-3 text-sm text-foreground shadow-sm transition-colors hover:bg-secondary/40"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Filter className="h-4 w-4 shrink-0 text-foreground" />
            <span className="truncate">{selectedOption?.label ?? placeholder}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={8}
        collisionPadding={16}
        className="z-[70] w-[var(--radix-popover-trigger-width)] rounded-2xl border border-border bg-card p-1 shadow-card"
        style={{ maxWidth: "calc(100vw - 2rem)" }}
      >
        <div className="space-y-1">
          {options.map((option) => {
            const selected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm transition-colors ${
                  selected ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"
                }`}
                onClick={() => {
                  onValueChange(option.value);
                  setOpen(false);
                }}
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                  {selected ? <Check className="h-4 w-4" /> : null}
                </span>
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TripSortDropdown;
