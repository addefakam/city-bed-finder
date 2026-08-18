import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const roomType = searchParams.get("roomType") || "";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sortBy = searchParams.get("sortBy") || "available"; // available, price-asc, price-desc, name

    // Only show APPROVED, non-suspended providers
    const providers = await prisma.provider.findMany({
      where: {
        status: "APPROVED",
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { address: { contains: search, mode: "insensitive" } },
                { type: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        rooms: {
          where: {
            ...(roomType && roomType !== "ALL"
              ? { type: roomType as never }
              : {}),
            ...(minPrice || maxPrice
              ? {
                  pricePerNight: {
                    ...(minPrice ? { gte: parseFloat(minPrice) } : {}),
                    ...(maxPrice ? { lte: parseFloat(maxPrice) } : {}),
                  },
                }
              : {}),
          },
        },
        settings: true,
      },
    });

    // Build response with computed availability
    const result = providers
      .map((p) => {
        const rooms = p.rooms;
        const available = rooms.filter((r) => r.status === "AVAILABLE").length;
        const total = rooms.length;
        const occupied = rooms.filter((r) => r.status === "OCCUPIED").length;
        const reserved = rooms.filter((r) => r.status === "RESERVED").length;
        const maintenance = rooms.filter((r) => r.status === "MAINTENANCE").length;
        const prices = rooms.map((r) => r.pricePerNight);
        const minRoomPrice = prices.length ? Math.min(...prices) : 0;
        const maxRoomPrice = prices.length ? Math.max(...prices) : 0;
        const types = [...new Set(rooms.map((r) => r.type))];
        const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);

        return {
          id: p.id,
          name: p.name,
          ownerName: p.ownerName,
          phone: p.phone,
          address: p.address,
          type: p.type,
          licenseNo: p.licenseNo,
          checkInTime: p.settings?.checkInTime || "14:00",
          checkOutTime: p.settings?.checkOutTime || "12:00",
          currency: p.settings?.currency || "ETB",
          totalRooms: total,
          availableRooms: available,
          occupiedRooms: occupied,
          reservedRooms: reserved,
          maintenanceRooms: maintenance,
          minPrice: minRoomPrice,
          maxPrice: maxRoomPrice,
          roomTypes: types,
          totalCapacity: totalCapacity,
          rooms: rooms.map((r) => ({
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
          })),
        };
      })
      .filter((p) => p.totalRooms > 0); // Only show providers with rooms

    // Sort
    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => a.minPrice - b.minPrice);
        break;
      case "price-desc":
        result.sort((a, b) => b.minPrice - a.minPrice);
        break;
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "available":
      default:
        result.sort((a, b) => b.availableRooms - a.availableRooms);
        break;
    }

    // City-wide summary
    const summary = {
      totalProviders: result.length,
      totalRooms: result.reduce((s, p) => s + p.totalRooms, 0),
      totalAvailable: result.reduce((s, p) => s + p.availableRooms, 0),
      totalOccupied: result.reduce((s, p) => s + p.occupiedRooms, 0),
      totalReserved: result.reduce((s, p) => s + p.reservedRooms, 0),
      avgPrice:
        result.length > 0
          ? Math.round(
              result.reduce(
                (s, p) => s + (p.minPrice + p.maxPrice) / 2,
                0
              ) / result.length
            )
          : 0,
    };

    return NextResponse.json({ summary, providers: result });
  } catch (error) {
    console.error("Availability API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}
