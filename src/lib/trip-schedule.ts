import type { TripRecurrence } from "@/lib/cargoo-store";

type TripScheduleFormat = "short" | "long";

interface FormatTripScheduleLabelOptions {
  date: string;
  recurrence?: TripRecurrence | null;
  intlLocale: string;
  weeklyLabel: string;
  monthlyLabel: string;
  pendingLabel?: string;
  format?: TripScheduleFormat;
}

export const formatTripScheduleLabel = ({
  date,
  recurrence = "once",
  intlLocale,
  weeklyLabel,
  monthlyLabel,
  pendingLabel = "",
  format = "short",
}: FormatTripScheduleLabelOptions) => {
  if (recurrence === "weekly") {
    return weeklyLabel;
  }

  if (recurrence === "monthly") {
    return monthlyLabel;
  }

  if (!date) {
    return pendingLabel;
  }

  return new Date(`${date}T00:00:00`).toLocaleDateString(intlLocale, {
    day: "numeric",
    month: format === "long" ? "long" : "short",
    year: "numeric",
  });
};
