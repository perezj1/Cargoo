import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight, MapPin } from "lucide-react";

import { cn } from "@/lib/utils";

type RouteInlineProps = {
  origin: string;
  destination: string;
  className?: string;
  labelClassName?: string;
  originClassName?: string;
  destinationClassName?: string;
  pinClassName?: string;
  arrowClassName?: string;
  withPin?: boolean;
  mobileLayout?: "auto" | "stack" | "inline";
};

const baseLabelClassName = "min-w-0 break-words text-left [overflow-wrap:anywhere]";

const RouteInline = ({
  origin,
  destination,
  className,
  labelClassName,
  originClassName,
  destinationClassName,
  pinClassName,
  arrowClassName,
  withPin = true,
  mobileLayout = "auto",
}: RouteInlineProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const [autoShouldStack, setAutoShouldStack] = useState(false);

  useEffect(() => {
    if (mobileLayout !== "auto") {
      return;
    }

    const updateLayout = () => {
      if (!containerRef.current || !measureRef.current) {
        return;
      }

      const isMobileViewport = typeof window !== "undefined" ? window.matchMedia("(max-width: 639px)").matches : false;
      if (!isMobileViewport) {
        setAutoShouldStack(false);
        return;
      }

      const availableWidth = containerRef.current.clientWidth;
      const requiredWidth = measureRef.current.scrollWidth;
      setAutoShouldStack(requiredWidth > availableWidth);
    };

    updateLayout();

    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => updateLayout()) : null;

    if (resizeObserver) {
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      if (measureRef.current) {
        resizeObserver.observe(measureRef.current);
      }
    }

    window.addEventListener("resize", updateLayout);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateLayout);
    };
  }, [arrowClassName, destination, destinationClassName, labelClassName, mobileLayout, origin, originClassName, pinClassName, withPin]);

  const shouldStackOnMobile = mobileLayout === "stack" || (mobileLayout === "auto" && autoShouldStack);

  if (shouldStackOnMobile) {
    return (
      <div ref={containerRef} className="relative min-w-0 max-w-full">
        <div className={cn("flex min-w-0 max-w-full items-start gap-2 sm:hidden", className)}>
          {withPin ? <MapPin className={cn("mt-0.5 h-4 w-4 shrink-0 text-primary", pinClassName)} /> : null}
          <div className="min-w-0">
            <span className={cn("block", baseLabelClassName, labelClassName, originClassName)}>{origin}</span>
            <ArrowDown className={cn("my-1 h-4 w-4 shrink-0 text-muted-foreground", arrowClassName)} />
            <span className={cn("block", baseLabelClassName, labelClassName, destinationClassName)}>{destination}</span>
          </div>
        </div>

        <div
          className={cn(
            "hidden min-w-0 max-w-full items-start gap-x-2 sm:grid",
            withPin ? "w-fit grid-cols-[auto,minmax(0,1fr),auto,minmax(0,1fr)]" : "w-fit grid-cols-[minmax(0,1fr),auto,minmax(0,1fr)]",
            className,
          )}
        >
          {withPin ? <MapPin className={cn("h-4 w-4 shrink-0 text-primary", pinClassName)} /> : null}
          <span className={cn(baseLabelClassName, labelClassName, originClassName)}>{origin}</span>
          <ArrowRight className={cn("mt-0.5 h-4 w-4 shrink-0 self-start text-muted-foreground", arrowClassName)} />
          <span className={cn(baseLabelClassName, labelClassName, destinationClassName)}>{destination}</span>
        </div>
        {mobileLayout === "auto" ? (
          <div
            ref={measureRef}
            aria-hidden="true"
            className={cn(
              "pointer-events-none fixed left-0 top-0 -z-10 inline-grid invisible grid-cols-[auto,max-content,auto,max-content] items-start gap-x-2 whitespace-nowrap opacity-0",
              className,
            )}
          >
            {withPin ? <MapPin className={cn("h-4 w-4 shrink-0 text-primary", pinClassName)} /> : null}
            <span className={cn("break-normal", labelClassName, originClassName)}>{origin}</span>
            <ArrowRight className={cn("mt-0.5 h-4 w-4 shrink-0 self-start text-muted-foreground", arrowClassName)} />
            <span className={cn("break-normal", labelClassName, destinationClassName)}>{destination}</span>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative min-w-0 max-w-full">
      <div
        className={cn(
          "min-w-0 max-w-full items-start gap-x-2",
          withPin ? "grid w-fit grid-cols-[auto,minmax(0,1fr),auto,minmax(0,1fr)]" : "grid w-fit grid-cols-[minmax(0,1fr),auto,minmax(0,1fr)]",
          className,
        )}
      >
        {withPin ? <MapPin className={cn("h-4 w-4 shrink-0 text-primary", pinClassName)} /> : null}
        <span className={cn(baseLabelClassName, labelClassName, originClassName)}>{origin}</span>
        <ArrowRight className={cn("mt-0.5 h-4 w-4 shrink-0 self-start text-muted-foreground", arrowClassName)} />
        <span className={cn(baseLabelClassName, labelClassName, destinationClassName)}>{destination}</span>
      </div>
      {mobileLayout === "auto" ? (
        <div
          ref={measureRef}
          aria-hidden="true"
          className={cn(
            "pointer-events-none fixed left-0 top-0 -z-10 inline-grid invisible grid-cols-[auto,max-content,auto,max-content] items-start gap-x-2 whitespace-nowrap opacity-0",
            className,
          )}
        >
          {withPin ? <MapPin className={cn("h-4 w-4 shrink-0 text-primary", pinClassName)} /> : null}
          <span className={cn("break-normal", labelClassName, originClassName)}>{origin}</span>
          <ArrowRight className={cn("mt-0.5 h-4 w-4 shrink-0 self-start text-muted-foreground", arrowClassName)} />
          <span className={cn("break-normal", labelClassName, destinationClassName)}>{destination}</span>
        </div>
      ) : null}
    </div>
  );
};

export default RouteInline;
