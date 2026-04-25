import * as React from "react";

import { cn } from "@/lib/utils";

/** Groups all scenario input sections with a calm page-level frame (layout shell). */
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
    <div className="rounded-2xl border border-border/75 bg-surface-shell p-4 shadow-[0_4px_32px_-12px_rgba(15,23,42,0.12),0_2px_6px_-2px_rgba(15,23,42,0.05)] ring-2 ring-structural/38 ring-offset-0 sm:p-6">
      <header className="mb-5 rounded-xl border border-consultancy/18 bg-consultancy-subtle/60 px-4 py-4 sm:px-5 sm:py-4">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">{lead}</p>
      </header>
      <div className="space-y-6 rounded-xl bg-surface-inset p-3 ring-1 ring-border/40 sm:space-y-7 sm:p-4 dark:ring-border/30">
        {children}
      </div>
    </div>
  );
}

export function Section({
  title,
  description,
  children,
  className,
  headingAccent = true,
  "data-testid": dataTestId,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  /** Vertical accent bar beside the heading (setup sections); omit for outcome / plain blocks. */
  headingAccent?: boolean;
  "data-testid"?: string;
}) {
  return (
    <section
      data-testid={dataTestId}
      className={cn(
        "rounded-xl border border-border/90 bg-card px-6 py-6 text-card-foreground shadow-[0_1px_3px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.04] sm:px-7 sm:py-7 dark:ring-white/[0.06]",
        className,
      )}
    >
      <header
        className={cn("mb-6 flex gap-4 sm:gap-5", !headingAccent && "gap-0")}
      >
        {headingAccent ? (
          <span
            className="hidden w-[3px] shrink-0 self-stretch rounded-full bg-consultancy/55 sm:block"
            aria-hidden
          />
        ) : null}
        <div className="min-w-0 flex-1 space-y-2">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
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

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive font-medium">{message}</p>;
}

export const inputClassName =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

export const selectClassName = inputClassName;

export const textAreaClassName =
  "min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";
