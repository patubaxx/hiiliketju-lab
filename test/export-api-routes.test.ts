import { describe, expect, it } from "vitest";

import { POST as postExcel } from "@/app/api/export/excel/route";
import { POST as postPdf } from "@/app/api/export/pdf/route";

import { minimalExportScenarioWire } from "./fixtures/export-minimal-scenario";

describe("POST /api/export/excel", () => {
  it("returns 400 for invalid JSON", async () => {
    const req = new Request("http://localhost/api/export/excel", {
      method: "POST",
      body: "not-json",
      headers: { "Content-Type": "application/json" },
    });
    const res = await postExcel(req);
    expect(res.status).toBe(400);
    const j = (await res.json()) as { code: string };
    expect(j.code).toBe("invalid_json");
  });

  it("returns 200 and an .xlsx for a valid scenario", async () => {
    const req = new Request("http://localhost/api/export/excel", {
      method: "POST",
      body: JSON.stringify({ scenario: minimalExportScenarioWire() }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await postExcel(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("spreadsheetml");
    const cd = res.headers.get("Content-Disposition");
    expect(cd).toContain("attachment");
    expect(cd).toContain("hiiliketju_API_export_test.xlsx");
    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(500);
  });
});

describe("POST /api/export/pdf", () => {
  it("returns 200 and PDF bytes for a valid scenario", async () => {
    const req = new Request("http://localhost/api/export/pdf", {
      method: "POST",
      body: JSON.stringify({ scenario: minimalExportScenarioWire() }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await postPdf(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    const buf = new Uint8Array(await res.arrayBuffer());
    expect(buf.byteLength).toBeGreaterThan(200);
    expect(String.fromCharCode(buf[0]!, buf[1]!, buf[2]!, buf[3]!)).toBe("%PDF");
  });
});
