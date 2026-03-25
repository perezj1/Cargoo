import { CarFront } from "lucide-react";

import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showName?: boolean;
}

const BrandLogo = ({
  className,
  iconClassName,
  textClassName,
  showName = true,
}: BrandLogoProps) => {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-card",
          iconClassName,
        )}
      >
        <CarFront className="h-5 w-5" />
      </span>
      {showName ? (
        <span className={cn("font-display text-xl font-bold tracking-tight text-foreground", textClassName)}>
          Cargoo
        </span>
      ) : null}
    </span>
  );
};

export default BrandLogo;
