/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { FINLAND_2025_DAILY_EUR_PER_MWH, FINLAND_2025_HOURLY_EUR_PER_MWH } from "@/data/electricity-defaults-2025-fi";
import {
  BUNDLED_FINLAND_2025_IMPORTED_DAILY_SERIES_TEXT,
  BUNDLED_FINLAND_2025_IMPORTED_HOURLY_SERIES_TEXT,
  computeNumericSeriesStats,
} from "@/features/scenario/input-ui/imported-electricity-series";
import { ScenarioInputApp } from "@/features/scenario/input-ui/scenario-input-app";
import { LocaleProvider } from "@/i18n/locale-context";

import { waitForStoredLocaleEnApplied } from "./wait-for-stored-locale";

beforeEach(() => {
  localStorage.setItem("hiiliketju.locale", "en");
});
afterEach(() => {
  cleanup();
  localStorage.removeItem("hiiliketju.locale");
});

async function renderApp() {
  const utils = render(
    <LocaleProvider>
      <ScenarioInputApp />
    </LocaleProvider>,
  );
  await waitForStoredLocaleEnApplied();
  return utils;
}

describe("WP20 – imported market data UX (VAT disclosure + stats)", () => {
  it("does not show imported-mode VAT or stats on constant electricity by default", async () => {
    await renderApp();
    expect(screen.queryByTestId("electricity-imported-vat-notice")).toBeNull();
    expect(screen.queryByTestId("electricity-imported-stats")).toBeNull();
  });

  it("shows a visible VAT notice and inline stats in imported market data mode", async () => {
    await renderApp();
    const mode = screen.getByLabelText("Purchase price mode");
    fireEvent.change(mode, { target: { value: "historical_market_data_imported" } });

    const vat = screen.getByTestId("electricity-imported-vat-notice");
    expect(vat).toBeTruthy();
    expect(within(vat).getByText(/Price basis/i)).toBeTruthy();
    expect(within(vat).getByText(/25\.5 %/i)).toBeTruthy();

    const stats = screen.getByTestId("electricity-imported-stats");
    expect(stats.textContent).toMatch(/Finland 2025 bundled default data/);
    expect(stats.textContent).toMatch(/Daily \(365 values\)/);
  });

  it("shows daily vs hourly summary stats for bundled defaults and updates when resolution changes", async () => {
    await renderApp();
    fireEvent.change(screen.getByLabelText("Purchase price mode"), {
      target: { value: "historical_market_data_imported" },
    });

    const daily = computeNumericSeriesStats(FINLAND_2025_DAILY_EUR_PER_MWH);
    if (!daily) throw new Error("expected daily stats");
    const dailyMean = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(daily.mean);

    let stats = screen.getByTestId("electricity-imported-stats");
    expect(stats.textContent).toContain(dailyMean);
    const dailyText = stats.textContent ?? "";

    fireEvent.change(screen.getByLabelText("Imported series resolution"), {
      target: { value: "hourly" },
    });

    stats = screen.getByTestId("electricity-imported-stats");
    expect(stats.textContent).toMatch(/Hourly \(8,760 values\)/);
    expect(stats.textContent).not.toBe(dailyText);

    const hourly = computeNumericSeriesStats(FINLAND_2025_HOURLY_EUR_PER_MWH);
    if (!hourly) throw new Error("expected hourly stats");
    const hourlyMean = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(hourly.mean);
    expect(stats.textContent).toContain(hourlyMean);
  });

  it("labels stats as user-provided when the series is no longer the bundled default (exact text)", async () => {
    await renderApp();
    fireEvent.change(screen.getByLabelText("Purchase price mode"), {
      target: { value: "historical_market_data_imported" },
    });

    const area = screen.getByLabelText(/Daily purchase prices/i);
    fireEvent.change(area, {
      target: { value: BUNDLED_FINLAND_2025_IMPORTED_DAILY_SERIES_TEXT + "\n0" },
    });

    const stats = screen.getByTestId("electricity-imported-stats");
    expect(stats.textContent).toMatch(/Current series \(edited, pasted, or imported\)/);
    expect(stats.textContent).not.toMatch(/Finland 2025 bundled default data/);
  });

  it("keeps a single VAT notice in imported mode even when the user overrides defaults", async () => {
    await renderApp();
    fireEvent.change(screen.getByLabelText("Purchase price mode"), {
      target: { value: "historical_market_data_imported" },
    });
    expect(screen.getAllByTestId("electricity-imported-vat-notice")).toHaveLength(1);
    const area = screen.getByLabelText(/Daily purchase prices/i);
    fireEvent.change(area, { target: { value: "1\n" + "1\n".repeat(400) } });
    expect(screen.getAllByTestId("electricity-imported-vat-notice")).toHaveLength(1);
  });

  it("matches bundled default hourly text after switching to hourly (no stale daily stats)", async () => {
    await renderApp();
    fireEvent.change(screen.getByLabelText("Purchase price mode"), {
      target: { value: "historical_market_data_imported" },
    });
    const hourlyAreaValue = () => (screen.getByLabelText(/Hourly purchase prices/i) as HTMLTextAreaElement).value;

    fireEvent.change(screen.getByLabelText("Imported series resolution"), {
      target: { value: "hourly" },
    });
    expect(hourlyAreaValue()).toBe(BUNDLED_FINLAND_2025_IMPORTED_HOURLY_SERIES_TEXT);
  });
});
