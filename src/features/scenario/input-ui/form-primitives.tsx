import * as React from "react";

import { cn } from "@/lib/utils";

/** Shared callout / notice surfaces (WP-UX2). */
export type CalloutVariant = "info" | "assumption" | "warning" | "success";

export function calloutClassName(variant: CalloutVariant = "info"): string {
  return cn(
    "rounded-lg border border-l-[3px] px-4 py-3 text-sm leading-relaxed [text-wrap:pretty] whitespace-pre-line",
    variant === "info" &&
      "border-consultancy/20 border-l-consultancy/60 bg-consultancy-subtle/75 text-muted-foreground dark:border-consultancy/25 dark:border-l-consultancy/55 dark:bg-consultancy-subtle/35",
    variant === "assumption" &&
      "border-amber-500/20 border-l-amber-600/55 bg-amber-500/[0.11] text-muted-foreground dark:border-amber-500/25 dark:bg-amber-950/[0.12]",
    variant === "warning" &&
      "border-amber-600/25 border-l-amber-700/65 bg-amber-500/[0.14] text-muted-foreground dark:border-amber-500/30 dark:bg-amber-950/[0.18]",
    variant === "success" &&
      "border-teal-600/20 border-l-teal-600/55 bg-emerald-500/[0.11] text-foreground/90 dark:border-emerald-500/25 dark:border-l-teal-500/50 dark:bg-emerald-950/[0.14]",
  );
}

/** Task panel header + stacked groups — flat inside the app frame (WP-UX2). */
export function ShellSetupRegion({
  title,
  lead,
  children,
}: {
  title: string;
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-8">
      <header className="max-w-3xl space-y-2 border-b border-border/55 pb-5">
        <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">{title}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{lead}</p>
      </header>
      <div className="space-y-8 sm:space-y-10">{children}</div>
    </div>
  );
}

export type SectionVariant = "primary" | "subtle" | "technical" | "results";

const sectionVariantClass: Record<SectionVariant, string> = {
  primary:
    "rounded-xl border border-border/60 border-l-4 border-l-structural/50 bg-surface-inset px-6 py-7 shadow-[var(--shadow-panel)] sm:px-7 sm:py-8 dark:border-border/50 dark:border-l-structural/55 dark:bg-surface-inset/50 dark:shadow-[var(--shadow-panel)]",
  subtle:
    "rounded-lg border border-border/60 bg-card/45 px-5 py-5 shadow-[var(--shadow-tile)] sm:px-6 sm:py-6 dark:bg-card/28",
  technical:
    "rounded-lg border border-border/55 bg-surface-inset/70 px-5 py-5 shadow-[var(--shadow-tile)] sm:px-6 sm:py-6 dark:border-border/45 dark:bg-surface-inset/35",
  results:
    "rounded-xl border border-border/65 bg-card px-5 py-5 shadow-[var(--shadow-tile)] sm:px-6 sm:py-6 dark:bg-card/85",
};

export function Section({
  title,
  description,
  children,
  className,
  variant = "subtle",
  headingAccent = true,
  "data-testid": dataTestId,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  variant?: SectionVariant;
  /** Vertical accent bar beside the heading; omitted when the section uses a strong border (e.g. primary). */
  headingAccent?: boolean;
  "data-testid"?: string;
}) {
  const showBar = headingAccent && variant !== "primary";

  return (
    <section
      data-testid={dataTestId}
      className={cn(sectionVariantClass[variant], className)}
    >
      <header
        className={cn(
          "flex gap-3 sm:gap-4",
          variant === "primary" ? "mb-6 sm:mb-7" : "mb-5 sm:mb-6",
          !showBar && "gap-0",
        )}
      >
        {showBar ? (
          <span
            className="hidden w-[3px] shrink-0 self-stretch rounded-full bg-consultancy/45 sm:block"
            aria-hidden
          />
        ) : null}
        <div className={cn("min-w-0 flex-1", variant === "primary" ? "space-y-2.5" : "space-y-2")}>
          <h2
            className={cn(
              "font-semibold tracking-tight text-foreground",
              variant === "primary" ? "text-[1.0625rem] sm:text-lg" : "text-base sm:text-[1.0625rem]",
            )}
          >
            {title}
          </h2>
          {description ? (
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
      {children}
    </label>
  );
}

export function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground leading-snug">{children}</p>;
}

/** Visible i18n guidance; `variant` distinguishes neutral vs assumption-style notes (WP-UX2). */
export function GuidanceCallout({
  messageId,
  t,
  variant = "info",
  "data-testid": dataTestId = `guidance-${messageId.replace(/\./g, "-")}`,
}: {
  messageId: string;
  t: (id: string) => string;
  variant?: CalloutVariant;
  "data-testid"?: string;
}) {
  return (
    <div className={calloutClassName(variant)} data-testid={dataTestId}>
      {t(messageId)}
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive font-medium">{message}</p>;
}

/**
 * Border, surface, and focus treatment so editable controls read ahead of prose (WP-UX3b).
 * Composed into `inputClassName` / `selectClassName` / `textAreaClassName`; reuse for custom controls if needed.
 */
export const userInputEmphasisClassName = cn(
  "border-structural/30 bg-card/85 shadow-[var(--shadow-tile)] transition-[color,box-shadow,border-color]",
  "dark:border-structural/38 dark:bg-card/42",
  "focus-visible:border-consultancy/50 focus-visible:ring-[3px] focus-visible:ring-consultancy/28",
);

export const inputClassName = cn(
  "flex h-10 min-h-10 w-full rounded-md border px-3 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
  userInputEmphasisClassName,
);

export const selectClassName = inputClassName;

export const textAreaClassName = cn(
  "min-h-[140px] w-full rounded-md border px-3 py-2 text-sm font-mono outline-none disabled:cursor-not-allowed disabled:opacity-50",
  userInputEmphasisClassName,
);
