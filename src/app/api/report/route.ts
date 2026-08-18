import { NextResponse } from "next/server";
import { prisma, ensureReportTable } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    await ensureReportTable();

    const body = await request.json();
    const { providerId, providerName, reporterName, reporterPhone, issue, description } = body;

    if (!providerId || !issue) {
      return NextResponse.json(
        { error: "Provider and issue are required" },
        { status: 400 }
      );
    }

    // Use raw SQL to avoid Prisma model mismatch with shared DB
    const result = await prisma.$queryRawUnsafe(
      `INSERT INTO "GuestReport" ("id", "providerId", "providerName", "reporterName", "reporterPhone", "issue", "description")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6) RETURNING "id"`,
      providerId,
      providerName || "",
      reporterName || "",
      reporterPhone || "",
      issue,
      description || ""
    );

    const row = result as { id: string }[];
    return NextResponse.json({ success: true, id: row[0]?.id });
  } catch (error) {
    console.error("Report API error:", error);
    return NextResponse.json(
      { error: "Failed to submit report" },
      { status: 500 }
    );
  }
}
