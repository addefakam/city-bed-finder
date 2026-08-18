import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const provider = await prisma.provider.findUnique({
      where: { id },
      include: {
        rooms: true,
        settings: true,
      },
    });

    if (!provider || provider.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    const rooms = provider.rooms.map((r) => ({
      id: r.id,
      number: r.number,
      name: r.name,
      type: r.type,
      pricePerNight: r.pricePerNight,
      capacity: r.capacity,
      status: r.status,
      amenities: r.amenities,
      description: r.description,
      floor: r.floor,
    }));

    return NextResponse.json({
      id: provider.id,
      name: provider.name,
      ownerName: provider.ownerName,
      phone: provider.phone,
      email: provider.email,
      address: provider.address,
      type: provider.type,
      licenseNo: provider.licenseNo,
      checkInTime: provider.settings?.checkInTime || "14:00",
      checkOutTime: provider.settings?.checkOutTime || "12:00",
      currency: provider.settings?.currency || "ETB",
      rooms,
    });
  } catch (error) {
    console.error("Provider API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch provider" },
      { status: 500 }
    );
  }
}
