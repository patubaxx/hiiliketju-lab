/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ScenarioInputApp } from "@/features/scenario/input-ui/scenario-input-app";
import { translate } from "@/i18n/messages";
import { LocaleProvider } from "@/i18n/locale-context";

import { waitForStoredLocaleEnApplied } from "./wait-for-stored-locale";

const LOCALE_KEY = "hiiliketju.locale";

afterEach(() => {
  localStorage.removeItem(LOCALE_KEY);
});

describe("WP27 – home hero partner logos", () => {
  it("renders static partner logo images with expected src and English alt text", async () => {
    localStorage.setItem(LOCALE_KEY, "en");
    render(
      <LocaleProvider>
        <ScenarioInputApp />
      </LocaleProvider>,
    );
    await waitForStoredLocaleEnApplied();
    const region = screen.getByTestId("hero-partner-logos");
    expect(region).toBeTruthy();
    expect(screen.queryByText("Partners", { exact: true })).toBeNull();
    expect(screen.queryByText("Kumppanit", { exact: true })).toBeNull();
    expect(screen.queryByText("Samarbetspartners", { exact: true })).toBeNull();

    const altBf = translate("en", "app.hero.logos.businessFinlandAlt");
    const altLab = translate("en", "app.hero.logos.labAlt");
    const bf = screen.getByRole("img", { name: altBf });
    const lab = screen.getByRole("img", { name: altLab });
    expect(bf.getAttribute("src")).toBe("/business-finland-logo.svg");
    expect(lab.getAttribute("src")).toBe("/lab-logo.svg");
  });
});
