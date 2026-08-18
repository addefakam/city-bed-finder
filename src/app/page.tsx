"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  BedDouble,
  MapPin,
  Phone,
  Shield,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  Users,
  Clock,
  Filter,
  RefreshCw,
  Building2,
  BadgeCheck,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

// ── Types ──
interface Room {
  id: string;
  number: string;
  name: string;
  type: string;
  pricePerNight: number;
  capacity: number;
  status: string;
  amenities: string;
  description: string;
  floor: number;
}

interface Provider {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  type: string;
  licenseNo: string;
  checkInTime: string;
  checkOutTime: string;
  currency: string;
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  reservedRooms: number;
  maintenanceRooms: number;
  minPrice: number;
  maxPrice: number;
  roomTypes: string[];
  totalCapacity: number;
  rooms: Room[];
}

interface Summary {
  totalProviders: number;
  totalRooms: number;
  totalAvailable: number;
  totalOccupied: number;
  totalReserved: number;
  avgPrice: number;
}

// ── Room status config ──
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  AVAILABLE: { label: "Available", color: "text-green-700", bg: "bg-green-100 border-green-200" },
  OCCUPIED: { label: "Occupied", color: "text-red-700", bg: "bg-red-100 border-red-200" },
  RESERVED: { label: "Reserved", color: "text-amber-700", bg: "bg-amber-100 border-amber-200" },
  MAINTENANCE: { label: "Maintenance", color: "text-slate-600", bg: "bg-slate-100 border-slate-200" },
};

const ROOM_TYPE_LABELS: Record<string, string> = {
  SINGLE: "Single",
  DOUBLE: "Double",
  TWIN: "Twin",
  SUITE: "Suite",
  DELUXE: "Deluxe",
};

const POLICE_PHONE = "0913169652";
const ISSUES = [
  "Hiding available rooms",
  "Overcharging",
  "Refusing service without reason",
  "Unsafe or unclean conditions",
  "False information about availability",
  "Harassment or threats",
  "Other",
];

// ── Loading skeleton ──
function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-5 w-36 bg-slate-200 rounded" />
        <div className="h-6 w-20 bg-slate-200 rounded-full" />
      </div>
      <div className="h-4 w-full bg-slate-100 rounded mb-2" />
      <div className="h-4 w-3/4 bg-slate-100 rounded mb-4" />
      <div className="flex gap-2">
        <div className="h-10 flex-1 bg-slate-100 rounded-xl" />
        <div className="h-10 flex-1 bg-slate-100 rounded-xl" />
        <div className="h-10 flex-1 bg-slate-100 rounded-xl" />
      </div>
    </div>
  );
}

// ── Main App ──
export default function Home() {
  const [data, setData] = useState<{ summary: Summary; providers: Provider[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [roomTypeFilter, setRoomTypeFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("available");
  const [showReport, setShowReport] = useState<string | null>(null);
  const [reportForm, setReportForm] = useState({ issue: "", description: "", reporterName: "", reporterPhone: "" });
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const reportModalRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roomTypeFilter !== "ALL") params.set("roomType", roomTypeFilter);
      params.set("sortBy", sortBy);

      const res = await fetch(`/api/availability?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
    } catch {
      setError("Could not load availability data. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [search, roomTypeFilter, sortBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Close report modal on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (reportModalRef.current && !reportModalRef.current.contains(e.target as Node)) {
        if (!reportSubmitting) setShowReport(null);
      }
    }
    if (showReport) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showReport, reportSubmitting]);

  const handleReport = async () => {
    if (!showReport || !reportForm.issue) return;
    setReportSubmitting(true);
    try {
      const provider = data?.providers.find((p) => p.id === showReport);
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: showReport,
          providerName: provider?.name || "",
          ...reportForm,
        }),
      });
      if (res.ok) {
        setReportSuccess(true);
        setTimeout(() => {
          setShowReport(null);
          setReportForm({ issue: "", description: "", reporterName: "", reporterPhone: "" });
          setReportSuccess(false);
        }, 2000);
      }
    } catch {
      alert("Failed to submit report. Please try calling the police directly.");
    } finally {
      setReportSubmitting(false);
    }
  };

  const callPolice = () => {
    window.location.href = `tel:${POLICE_PHONE}`;
  };

  const callProvider = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  return (
    <div className="min-h-screen pb-24 safe-bottom">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-gradient-to-b from-blue-800 to-blue-900 text-white safe-top">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <BedDouble className="w-6 h-6" />
                City Bed Finder
              </h1>
              <p className="text-blue-200 text-xs mt-0.5">
                Real-time availability across the city
              </p>
            </div>
            <button
              onClick={callPolice}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
            >
              <Shield className="w-4 h-4" />
              SOS
            </button>
          </div>

          {/* Search bar */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search by name, area, or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchData()}
              className="w-full pl-10 pr-10 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-sm text-white placeholder-blue-200/70 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
            {search && (
              <button
                onClick={() => { setSearch(""); searchRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-200 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter + sort bar */}
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${
                showFilters || roomTypeFilter !== "ALL"
                  ? "bg-white text-blue-800 font-semibold"
                  : "bg-white/10 text-blue-100 border border-white/20"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Filter{roomTypeFilter !== "ALL" ? `: ${ROOM_TYPE_LABELS[roomTypeFilter] || roomTypeFilter}` : ""}
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white/10 border border-white/20 text-blue-100 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              <option value="available" className="text-slate-900">Most Available</option>
              <option value="price-asc" className="text-slate-900">Price: Low First</option>
              <option value="price-desc" className="text-slate-900">Price: High First</option>
              <option value="name" className="text-slate-900">Name A-Z</option>
            </select>
            <button
              onClick={fetchData}
              className="ml-auto flex items-center gap-1 text-xs text-blue-200 hover:text-white transition-colors"
              disabled={loading}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="mt-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 slide-up">
              <p className="text-xs font-semibold text-blue-100 mb-2">Room Type</p>
              <div className="flex flex-wrap gap-2">
                {["ALL", "SINGLE", "DOUBLE", "TWIN", "SUITE", "DELUXE"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setRoomTypeFilter(type)}
                    className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                      roomTypeFilter === type
                        ? "bg-white text-blue-800 font-bold shadow-sm"
                        : "bg-white/10 text-blue-100 border border-white/20"
                    }`}
                  >
                    {type === "ALL" ? "All Types" : ROOM_TYPE_LABELS[type] || type}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── City Summary ── */}
      {data?.summary && !loading && (
        <div className="px-4 mt-4 fade-in">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded-xl p-3 border border-slate-100 text-center">
              <p className="text-2xl font-bold text-blue-700">{data.summary.totalAvailable}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Available Beds</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-slate-100 text-center">
              <p className="text-2xl font-bold text-slate-700">{data.summary.totalProviders}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Guest Houses</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-slate-100 text-center">
              <p className="text-2xl font-bold text-slate-700">{data.summary.avgPrice}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Avg. Price (ETB)</p>
            </div>
          </div>
          {lastUpdated && (
            <p className="text-[10px] text-slate-400 mt-2 text-center">
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
      )}

      {/* ── Info Banner ── */}
      <div className="px-4 mt-3">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Your rights:</strong> Every guest house must show real availability. If a provider refuses service or hides rooms, use the SOS button to contact police immediately.
          </p>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="px-4 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-700 font-medium">Connection Error</p>
            <p className="text-xs text-red-500 mt-1 mb-3">{error}</p>
            <button
              onClick={fetchData}
              className="text-xs bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* ── Provider List ── */}
      <div className="px-4 mt-4 space-y-3">
        {loading && !data && (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        )}

        {data && data.providers.length === 0 && !loading && (
          <div className="text-center py-12">
            <BedDouble className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">No guest houses found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters</p>
          </div>
        )}

        {data?.providers.map((provider) => {
          const isExpanded = expandedProvider === provider.id;
          const hasAvailability = provider.availableRooms > 0;
          const occupancyRate = provider.totalRooms > 0
            ? Math.round(((provider.occupiedRooms + provider.reservedRooms) / provider.totalRooms) * 100)
            : 0;

          return (
            <div key={provider.id} className="fade-in">
              {/* Provider Card */}
              <div
                className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                  isExpanded
                    ? "border-blue-200 shadow-lg shadow-blue-50"
                    : "border-slate-100 shadow-sm"
                }`}
              >
                {/* Card Header - always visible */}
                <button
                  onClick={() => setExpandedProvider(isExpanded ? null : provider.id)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="font-bold text-sm text-slate-900 truncate">
                          {provider.name}
                        </h2>
                        {provider.licenseNo && (
                          <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <p className="text-xs text-slate-500 truncate">{provider.address || "No address listed"}</p>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {provider.type.replace(/_/g, " ")}
                      </p>
                    </div>

                    {/* Availability badge */}
                    <div className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${
                      hasAvailability
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                    >
                      {provider.availableRooms} free
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-3 px-4 pb-3">
                    <div className="flex items-center gap-1">
                      <BedDouble className="w-3 h-3 text-slate-400" />
                      <span className="text-xs text-slate-600 font-medium">
                        {provider.availableRooms}/{provider.totalRooms}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      <span className="text-xs text-slate-500">{provider.totalCapacity} capacity</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-blue-700">
                        {provider.currency}{provider.minPrice}
                      </span>
                      {provider.maxPrice > provider.minPrice && (
                        <span className="text-xs text-slate-400">
                          - {provider.currency}{provider.maxPrice}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">/night</span>
                    </div>
                  </div>

                  {/* Occupancy bar */}
                  <div className="px-4 pb-3">
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${occupancyRate}%`,
                          backgroundColor:
                            occupancyRate > 90
                              ? "#dc2626"
                              : occupancyRate > 70
                              ? "#d97706"
                              : "#16a34a",
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-slate-400">0%</span>
                      <span className="text-[10px] text-slate-400">Occupied: {occupancyRate}%</span>
                      <span className="text-[10px] text-slate-400">100%</span>
                    </div>
                  </div>

                  {/* Room type pills */}
                  {provider.roomTypes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 px-4 pb-3">
                      {provider.roomTypes.map((type) => (
                        <span
                          key={type}
                          className="text-[10px] px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md border border-slate-100"
                        >
                          {ROOM_TYPE_LABELS[type] || type}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-center text-slate-400 px-4 pb-2">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {/* Expanded: Room details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 slide-up">
                    <div className="p-4">
                      <h3 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">
                        Room Details
                      </h3>
                      <div className="space-y-2">
                        {provider.rooms.map((room) => {
                          const statusCfg = STATUS_CONFIG[room.status] || STATUS_CONFIG.MAINTENANCE;
                          return (
                            <div
                              key={room.id}
                              className={`flex items-center justify-between p-3 rounded-xl border ${statusCfg.bg}`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-slate-800">
                                    {room.name || `Room ${room.number}`}
                                  </span>
                                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.color}`}>
                                    {statusCfg.label}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {ROOM_TYPE_LABELS[room.type] || room.type} &middot; Floor {room.floor} &middot; {room.capacity} person{room.capacity > 1 ? "s" : ""}
                                </p>
                                {room.amenities && (
                                  <p className="text-[10px] text-slate-400 mt-1 truncate">
                                    {room.amenities}
                                  </p>
                                )}
                              </div>
                              <div className="text-right shrink-0 ml-3">
                                <p className="text-sm font-bold text-slate-800">
                                  {provider.currency}{room.pricePerNight.toLocaleString()}
                                </p>
                                <p className="text-[10px] text-slate-400">/night</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Provider contact info */}
                      <div className="mt-4 p-3 bg-white rounded-xl border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="w-4 h-4 text-slate-500" />
                          <span className="text-xs font-semibold text-slate-700">Contact & Info</span>
                        </div>
                        <div className="space-y-1.5 text-xs text-slate-600">
                          <p>Owner: {provider.ownerName}</p>
                          <p>Address: {provider.address || "N/A"}</p>
                          <p>Check-in: {provider.checkInTime} / Check-out: {provider.checkOutTime}</p>
                          {provider.licenseNo && <p>License: {provider.licenseNo}</p>}
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => callProvider(provider.phone)}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            Call Provider
                          </button>
                          <button
                            onClick={() => setShowReport(provider.id)}
                            className="flex items-center gap-1.5 bg-amber-100 hover:bg-amber-200 active:bg-amber-300 text-amber-800 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Report
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Report Modal ── */}
      {showReport && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center fade-in">
          <div
            ref={reportModalRef}
            className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-y-auto slide-up"
          >
            <div className="sticky top-0 bg-white px-4 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Report Issue</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {data?.providers.find((p) => p.id === showReport)?.name}
                </p>
              </div>
              {!reportSubmitting && (
                <button
                  onClick={() => setShowReport(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              )}
            </div>

            <div className="p-4">
              {reportSuccess ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-800">Report Submitted</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Your report has been recorded. If in danger, call police now.
                  </p>
                  <button
                    onClick={callPolice}
                    className="mt-4 flex items-center gap-2 mx-auto bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    Call Police ({POLICE_PHONE})
                  </button>
                </div>
              ) : (
                <>
                  {/* Quick SOS */}
                  <button
                    onClick={callPolice}
                    className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold py-3 rounded-xl mb-4 transition-colors sos-pulse"
                  >
                    <Shield className="w-5 h-5" />
                    Call Police Now - {POLICE_PHONE}
                  </button>

                  <p className="text-xs font-semibold text-slate-600 mb-2">
                    Or submit a written report:
                  </p>

                  {/* Issue selection */}
                  <div className="space-y-1.5 mb-4">
                    {ISSUES.map((issue) => (
                      <button
                        key={issue}
                        onClick={() => setReportForm({ ...reportForm, issue })}
                        className={`w-full text-left text-xs px-3 py-2.5 rounded-xl border transition-colors ${
                          reportForm.issue === issue
                            ? "bg-red-50 border-red-200 text-red-800 font-semibold"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {reportForm.issue === issue && <span className="mr-1.5">✓</span>}
                        {issue}
                      </button>
                    ))}
                  </div>

                  {/* Description */}
                  <textarea
                    placeholder="Describe what happened (optional)..."
                    value={reportForm.description}
                    onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                    rows={3}
                    className="w-full text-sm p-3 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                  />

                  {/* Reporter info (optional) */}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <input
                      type="text"
                      placeholder="Your name (optional)"
                      value={reportForm.reporterName}
                      onChange={(e) => setReportForm({ ...reportForm, reporterName: e.target.value })}
                      className="text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <input
                      type="tel"
                      placeholder="Your phone (optional)"
                      value={reportForm.reporterPhone}
                      onChange={(e) => setReportForm({ ...reportForm, reporterPhone: e.target.value })}
                      className="text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <button
                    onClick={handleReport}
                    disabled={!reportForm.issue || reportSubmitting}
                    className="w-full flex items-center justify-center gap-2 mt-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold py-3 rounded-xl transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    {reportSubmitting ? "Submitting..." : "Submit Report"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Floating SOS Button ── */}
      <button
        onClick={callPolice}
        className="fixed bottom-6 right-4 z-50 w-16 h-16 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-full shadow-xl shadow-red-200 flex items-center justify-center sos-pulse safe-bottom"
        aria-label="Call Police Emergency"
      >
        <div className="text-center">
          <Shield className="w-6 h-6 mx-auto" />
          <span className="text-[9px] font-bold mt-0.5 block">SOS</span>
        </div>
      </button>

      {/* ── Footer ── */}
      <div className="px-4 pt-8 pb-4 text-center">
        <p className="text-[10px] text-slate-400">
          Data is sourced directly from the guest house management system.
          <br />
          Information shown is real and cannot be hidden by providers.
        </p>
        <div className="flex items-center justify-center gap-1.5 mt-1 text-[10px] text-blue-500">
          <Shield className="w-3 h-3" />
          <span>Protected by City Police Monitoring System</span>
        </div>
      </div>
    </div>
  );
}
