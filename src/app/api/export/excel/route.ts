import { NextResponse } from "next/server";

import { parseExportScenarioPostBody } from "../parse-export-body";
import { buildExcelExportResponse } from "../server-export-pipeline";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  let rawText: string;
  try {
    rawText = await req.text();
  } catch {
    return NextResponse.json(
      { code: "bad_request", message: "Could not read request body" },
      { status: 400 },
    );
  }

  const parsed = parseExportScenarioPostBody(rawText);
  if (!parsed.ok) {
    return NextResponse.json(parsed.payload, { status: parsed.status });
  }

  return buildExcelExportResponse(parsed.input);
}
