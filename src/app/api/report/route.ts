import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { providerId, providerName, reporterName, reporterPhone, issue, description } = body;

    if (!providerId || !issue) {
      return NextResponse.json(
        { error: "Provider and issue are required" },
        { status: 400 }
      );
    }

    const report = await prisma.guestReport.create({
      data: {
        providerId,
        providerName: providerName || "",
        reporterName: reporterName || "",
        reporterPhone: reporterPhone || "",
        issue,
        description: description || "",
      },
    });

    return NextResponse.json({ success: true, id: report.id });
  } catch (error) {
    console.error("Report API error:", error);
    return NextResponse.json(
      { error: "Failed to submit report" },
      { status: 500 }
    );
  }
}
