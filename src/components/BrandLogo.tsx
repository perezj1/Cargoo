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
      <img
        src="/favicon.svg?v=5"
        alt="Logo de Cargoo"
        className={cn("h-10 w-10 shrink-0 object-contain drop-shadow-sm", iconClassName)}
      />
      {showName ? (
        <span className={cn("font-display text-xl font-bold tracking-tight text-foreground", textClassName)}>
          Cargoo
        </span>
      ) : null}
    </span>
  );
};

export default BrandLogo;
