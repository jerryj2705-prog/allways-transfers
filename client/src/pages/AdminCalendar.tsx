import { useState, useMemo, useRef, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  ChevronLeft, ChevronRight, LogOut, Home, DollarSign, MessageSquare,
  LayoutDashboard, CalendarDays, Clock, MapPin, Users, Car, ArrowRight,
  AlertTriangle, Grid3X3, List, GripVertical,
} from "lucide-react";
import { SERVICE_TYPES, BOOKING_STATUSES } from "@shared/types";
import type { ServiceType, BookingStatus } from "@shared/types";

const LOGO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/logo-white_476df209.png";

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string; block: string; blockBorder: string }> = {
  quote: { bg: "bg-purple-500/20", text: "text-purple-400", dot: "bg-purple-400", block: "bg-purple-500/10 border-dashed border border-purple-400/40", blockBorder: "border-l-purple-400 border-l-[3px] border-dashed" },
  pending: { bg: "bg-amber-500/20", text: "text-amber-400", dot: "bg-amber-400", block: "bg-amber-500/15", blockBorder: "border-l-amber-400" },
  confirmed: { bg: "bg-blue-500/20", text: "text-blue-400", dot: "bg-blue-400", block: "bg-blue-500/15", blockBorder: "border-l-blue-400" },
  completed: { bg: "bg-green-500/20", text: "text-green-400", dot: "bg-green-400", block: "bg-green-500/15", blockBorder: "border-l-green-400" },
  cancelled: { bg: "bg-red-500/20", text: "text-red-400", dot: "bg-red-400", block: "bg-red-500/10 opacity-50", blockBorder: "border-l-red-400" },
  expired: { bg: "bg-zinc-500/15", text: "text-zinc-500", dot: "bg-zinc-400", block: "bg-zinc-500/10 opacity-40", blockBorder: "border-l-zinc-400" },
};

const STATUS_BADGE_STYLES: Record<string, string> = {
  quote: "bg-purple-100 text-purple-800 border-purple-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  expired: "bg-zinc-100 text-zinc-800 border-zinc-200",
};

// ─── Helpers ───

function getMonthStart(year: number, month: number): Date {
  return new Date(year, month, 1);
}

function getMonthEnd(year: number, month: number): Date {
  return new Date(year, month + 1, 0, 23, 59, 59, 999);
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Australia/Brisbane",
  });
}

function formatDateFull(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Australia/Brisbane",
  });
}

function isToday(year: number, month: number, day: number): boolean {
  const now = new Date();
  const local = new Date(now.toLocaleString("en-US", { timeZone: "Australia/Brisbane" }));
  return local.getFullYear() === year && local.getMonth() === month && local.getDate() === day;
}

function getHourFromTimestamp(timestamp: number): number {
  const d = new Date(timestamp);
  const local = new Date(d.toLocaleString("en-US", { timeZone: "Australia/Brisbane" }));
  return local.getHours() + local.getMinutes() / 60;
}

/** Convert hour decimal (e.g. 14.5) to a formatted time string */
function hourToTimeString(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Snap hour to nearest 15-minute interval */
function snapToQuarter(hour: number): number {
  return Math.round(hour * 4) / 4;
}

/** Estimate booking duration in minutes based on service type */
function getEstimatedDurationMinutes(booking: CalendarBooking): number {
  if (booking.estimatedDuration && booking.estimatedDuration > 0) {
    return booking.estimatedDuration;
  }
  switch (booking.serviceType) {
    case "airport_transfer": return 90;
    case "point_to_point": return 60;
    case "hourly_hire": return 180;
    case "special_events": return 240;
    default: return 60;
  }
}

/** Check if two bookings overlap in time */
function bookingsOverlap(a: CalendarBooking, b: CalendarBooking): boolean {
  const aStart = a.pickupDate;
  const aEnd = a.pickupDate + getEstimatedDurationMinutes(a) * 60 * 1000;
  const bStart = b.pickupDate;
  const bEnd = b.pickupDate + getEstimatedDurationMinutes(b) * 60 * 1000;
  return aStart < bEnd && bStart < aEnd;
}

/** Build new pickup timestamp from a base date and a target hour */
function buildNewPickupDate(baseDate: Date, targetHour: number): number {
  const d = new Date(baseDate);
  const h = Math.floor(targetHour);
  const m = Math.round((targetHour - h) * 60);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TIMELINE_HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 60; // px per hour

type CalendarBooking = {
  id: number;
  referenceNumber: string;
  clientName: string;
  clientEmail: string;
  serviceType: string;
  pickupAddress: string;
  dropoffAddress: string | null;
  pickupDate: number;
  passengerCount: number;
  vehicleName: string;
  totalPrice: string | null;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  estimatedDuration: number | null;
};

type ViewMode = "month" | "day";

type DragState = {
  bookingId: number;
  startY: number;
  startHour: number;
  currentHour: number;
};

type RescheduleConfirm = {
  booking: CalendarBooking;
  oldTime: string;
  newTime: string;
  newPickupDate: number;
  hasOverlap: boolean;
};

type ResizeState = {
  bookingId: number;
  startY: number;
  originalDurationMin: number;
  currentDurationMin: number;
};

type ResizeConfirm = {
  booking: CalendarBooking;
  oldDuration: number;
  newDuration: number;
  hasOverlap: boolean;
};

export default function AdminCalendar() {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();

  const now = new Date();
  const localNow = new Date(now.toLocaleString("en-US", { timeZone: "Australia/Brisbane" }));
  const [viewYear, setViewYear] = useState(localNow.getFullYear());
  const [viewMonth, setViewMonth] = useState(localNow.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(localNow.getDate());
  const [viewMode, setViewMode] = useState<ViewMode>("month");

  // Calculate date range for the query (full month in AEST)
  const dateRange = useMemo(() => {
    const start = getMonthStart(viewYear, viewMonth);
    const end = getMonthEnd(viewYear, viewMonth);
    return { startMs: start.getTime(), endMs: end.getTime() };
  }, [viewYear, viewMonth]);

  const { data: calendarBookings } = trpc.bookings.calendarBookings.useQuery(
    dateRange,
    { enabled: !!user && user.role === "admin" }
  );

  const utils = trpc.useUtils();

  // Group bookings by day
  const bookingsByDay = useMemo(() => {
    const map = new Map<number, CalendarBooking[]>();
    if (!calendarBookings) return map;
    for (const b of calendarBookings) {
      const d = new Date(b.pickupDate);
      const local = new Date(d.toLocaleString("en-US", { timeZone: "Australia/Brisbane" }));
      const day = local.getDate();
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(b as CalendarBooking);
    }
    return map;
  }, [calendarBookings]);

  // Selected day bookings
  const selectedBookings = selectedDay ? (bookingsByDay.get(selectedDay) ?? []) : [];
  const activeSelectedBookings = selectedBookings.filter(b => b.status !== "cancelled" && b.status !== "expired");

  // Detect overlaps
  const overlappingIds = useMemo(() => {
    const ids = new Set<number>();
    const active = activeSelectedBookings;
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        if (bookingsOverlap(active[i], active[j])) {
          ids.add(active[i].id);
          ids.add(active[j].id);
        }
      }
    }
    return ids;
  }, [activeSelectedBookings]);

  // Navigation
  function prevMonth() {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else { setViewMonth(viewMonth - 1); }
    setSelectedDay(null);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else { setViewMonth(viewMonth + 1); }
    setSelectedDay(null);
  }
  function goToToday() {
    const n = new Date();
    const l = new Date(n.toLocaleString("en-US", { timeZone: "Australia/Brisbane" }));
    setViewYear(l.getFullYear()); setViewMonth(l.getMonth()); setSelectedDay(l.getDate());
  }
  function prevDay() {
    if (!selectedDay || selectedDay <= 1) {
      if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); setSelectedDay(getDaysInMonth(viewYear - 1, 11)); }
      else { setViewMonth(viewMonth - 1); setSelectedDay(getDaysInMonth(viewYear, viewMonth - 1)); }
    } else { setSelectedDay(selectedDay - 1); }
  }
  function nextDay() {
    const dim = getDaysInMonth(viewYear, viewMonth);
    if (!selectedDay || selectedDay >= dim) {
      if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
      else { setViewMonth(viewMonth + 1); }
      setSelectedDay(1);
    } else { setSelectedDay(selectedDay + 1); }
  }
  function selectDayAndSwitchToTimeline(day: number) {
    setSelectedDay(day); setViewMode("day");
  }

  // Auth guards
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="font-heading text-2xl font-bold">Admin Access Required</h2>
          <p className="text-muted-foreground">Please sign in to access the admin calendar.</p>
          <Button onClick={() => { window.location.href = getLoginUrl(); }} className="gold-gradient text-gold-foreground border-0">Sign In</Button>
        </div>
      </div>
    );
  }
  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="font-heading text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">You do not have admin privileges.</p>
          <Button onClick={() => setLocation("/")} variant="outline" className="bg-background">Return Home</Button>
        </div>
      </div>
    );
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayOffset = getFirstDayOfWeek(viewYear, viewMonth);
  const getActiveCount = (day: number) => (bookingsByDay.get(day) ?? []).filter(b => b.status !== "cancelled" && b.status !== "expired").length;

  const daysWithOverlaps = (() => {
    const days = new Set<number>();
    bookingsByDay.forEach((dayBookings, day) => {
      const active = dayBookings.filter(b => b.status !== "cancelled" && b.status !== "expired");
      for (let i = 0; i < active.length; i++) {
        for (let j = i + 1; j < active.length; j++) {
          if (bookingsOverlap(active[i], active[j])) { days.add(day); return; }
        }
      }
    });
    return days;
  })();

  // Build base date for the selected day (AEST)
  const selectedDayBaseDate = selectedDay ? new Date(viewYear, viewMonth, selectedDay) : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky Header */}
      <div className="border-b border-border/50 bg-background/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center justify-between h-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setLocation("/")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Home className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <img src={LOGO_IMG} alt="All Ways Transfers" className="h-16 w-auto" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setLocation("/admin")} className="gap-1 bg-background">
              <LayoutDashboard className="w-3.5 h-3.5" /><span className="hidden sm:inline">Bookings</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLocation("/admin/pricing")} className="gap-1 bg-background">
              <DollarSign className="w-3.5 h-3.5" /><span className="hidden sm:inline">Pricing</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLocation("/admin/enquiries")} className="gap-1 bg-background">
              <MessageSquare className="w-3.5 h-3.5" /><span className="hidden sm:inline">Enquiries</span>
            </Button>
            <span className="text-sm text-muted-foreground hidden sm:inline">{user.name}</span>
            <Button variant="outline" size="sm" onClick={logout} className="gap-1 bg-background">
              <LogOut className="w-3.5 h-3.5" /><span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* View Toggle & Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-6 h-6 text-[#d4a843]" />
            <h1 className="font-heading text-2xl font-bold">
              {viewMode === "month"
                ? `${MONTH_NAMES[viewMonth]} ${viewYear}`
                : selectedDay
                  ? formatDateFull(new Date(viewYear, viewMonth, selectedDay).getTime())
                  : `${MONTH_NAMES[viewMonth]} ${viewYear}`
              }
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-border/50 rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode("month")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5
                  ${viewMode === "month" ? "bg-[#d4a843]/20 text-[#d4a843]" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Grid3X3 className="w-3.5 h-3.5" />Month
              </button>
              <button
                onClick={() => { setViewMode("day"); if (!selectedDay) setSelectedDay(localNow.getDate()); }}
                className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5
                  ${viewMode === "day" ? "bg-[#d4a843]/20 text-[#d4a843]" : "text-muted-foreground hover:text-foreground"}`}
              >
                <List className="w-3.5 h-3.5" />Day
              </button>
            </div>
            <Button variant="outline" size="sm" onClick={goToToday} className="bg-background text-xs">Today</Button>
            {viewMode === "month" ? (
              <>
                <Button variant="outline" size="icon" onClick={prevMonth} className="bg-background h-8 w-8"><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" size="icon" onClick={nextMonth} className="bg-background h-8 w-8"><ChevronRight className="w-4 h-4" /></Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="icon" onClick={prevDay} className="bg-background h-8 w-8"><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" size="icon" onClick={nextDay} className="bg-background h-8 w-8"><ChevronRight className="w-4 h-4" /></Button>
              </>
            )}
          </div>
        </div>

        {/* Overlap Warning */}
        {viewMode === "day" && overlappingIds.size > 0 && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span><strong>{overlappingIds.size} booking{overlappingIds.size > 1 ? "s" : ""}</strong> have overlapping time slots on this day. Review the timeline below.</span>
          </div>
        )}

        {viewMode === "month" ? (
          /* ─── MONTH VIEW ─── */
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <Card className="border-border/50 overflow-hidden">
                <CardContent className="p-0">
                  <div className="grid grid-cols-7 border-b border-border/50">
                    {DAY_NAMES.map((name) => (
                      <div key={name} className="py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">{name}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7">
                    {Array.from({ length: firstDayOffset }).map((_, i) => (
                      <div key={`empty-${i}`} className="min-h-[80px] sm:min-h-[100px] border-b border-r border-border/30 bg-muted/20" />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const dayBookings = bookingsByDay.get(day) ?? [];
                      const activeCount = getActiveCount(day);
                      const todayFlag = isToday(viewYear, viewMonth, day);
                      const isSelected = selectedDay === day;
                      const hasBookings = dayBookings.length > 0;
                      const hasOverlap = daysWithOverlaps.has(day);
                      return (
                        <div
                          key={day}
                          onClick={() => setSelectedDay(day)}
                          onDoubleClick={() => selectDayAndSwitchToTimeline(day)}
                          className={`min-h-[80px] sm:min-h-[100px] border-b border-r border-border/30 p-1.5 sm:p-2 cursor-pointer transition-colors relative
                            ${isSelected ? "bg-[#d4a843]/10 ring-1 ring-[#d4a843]/50 ring-inset" : "hover:bg-muted/30"}
                            ${todayFlag ? "bg-accent/30" : ""}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1">
                              <span className={`text-sm font-medium leading-none
                                ${todayFlag ? "bg-[#d4a843] text-[#0a0a0a] w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" : ""}
                                ${isSelected && !todayFlag ? "text-[#d4a843]" : ""}`}>
                                {day}
                              </span>
                              {hasOverlap && <AlertTriangle className="w-3 h-3 text-red-400" />}
                            </div>
                            {activeCount > 0 && (
                              <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 rounded-full px-1.5 py-0.5">{activeCount}</span>
                            )}
                          </div>
                          <div className="space-y-0.5">
                            {dayBookings.slice(0, 3).map((b) => {
                              const colors = STATUS_COLORS[b.status] ?? STATUS_COLORS.pending;
                              return (
                                <div key={b.id} className={`${colors.bg} rounded px-1 py-0.5 truncate hidden sm:block`}>
                                  <span className={`text-[10px] font-medium ${colors.text} leading-tight`}>
                                    {formatTime(b.pickupDate)} {b.clientName.split(" ")[0]}
                                  </span>
                                </div>
                              );
                            })}
                            {dayBookings.length > 3 && <div className="text-[10px] text-muted-foreground pl-1 hidden sm:block">+{dayBookings.length - 3} more</div>}
                            {hasBookings && (
                              <div className="flex gap-0.5 sm:hidden mt-1">
                                {dayBookings.slice(0, 4).map((b) => {
                                  const colors = STATUS_COLORS[b.status] ?? STATUS_COLORS.pending;
                                  return <div key={b.id} className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />;
                                })}
                                {dayBookings.length > 4 && <span className="text-[8px] text-muted-foreground">+{dayBookings.length - 4}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {Array.from({ length: (7 - ((firstDayOffset + daysInMonth) % 7)) % 7 }).map((_, i) => (
                      <div key={`end-empty-${i}`} className="min-h-[80px] sm:min-h-[100px] border-b border-r border-border/30 bg-muted/20" />
                    ))}
                  </div>
                </CardContent>
              </Card>
              <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
                {Object.entries(STATUS_COLORS).filter(([s]) => s !== "expired").map(([status, colors]) => (
                  <div key={status} className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${colors.dot} ${status === "quote" ? "border border-dashed border-purple-400" : ""}`} />
                    <span className="capitalize">{status === "quote" ? "Quote (Provisional)" : status}</span>
                  </div>
                ))}
                <div className="flex items-center gap-1.5"><AlertTriangle className="w-3 h-3 text-red-400" /><span>Overlap</span></div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Double-click a day to open the daily timeline view.</p>
            </div>

            {/* Day Detail Panel (month view) */}
            <div className="lg:w-[380px] xl:w-[420px]">
              <Card className="border-border/50 sticky top-28">
                <CardContent className="p-0">
                  <div className="p-4 border-b border-border/50">
                    <h2 className="font-heading text-lg font-bold">
                      {selectedDay ? formatDateFull(new Date(viewYear, viewMonth, selectedDay).getTime()) : "Select a day"}
                    </h2>
                    {selectedDay && (
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-muted-foreground">
                          {selectedBookings.length === 0 ? "No bookings" : `${selectedBookings.length} booking${selectedBookings.length > 1 ? "s" : ""}`}
                        </p>
                        {selectedBookings.length > 0 && (
                          <Button variant="outline" size="sm" onClick={() => setViewMode("day")} className="text-xs h-6 px-2 bg-background">
                            <List className="w-3 h-3 mr-1" />Timeline
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  <ScrollArea className="max-h-[calc(100vh-280px)]">
                    <div className="p-4 space-y-3">
                      {!selectedDay && (
                        <div className="text-center py-8 text-muted-foreground">
                          <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
                          <p className="text-sm">Click a day on the calendar to view bookings</p>
                        </div>
                      )}
                      {selectedDay && selectedBookings.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
                          <p className="text-sm">No bookings on this day</p>
                        </div>
                      )}
                      {selectedBookings
                        .sort((a, b) => a.pickupDate - b.pickupDate)
                        .map((booking) => (
                          <BookingCard
                            key={booking.id}
                            booking={booking}
                            overlappingIds={overlappingIds}
                            onClick={() => setLocation(`/admin/booking/${booking.id}`)}
                          />
                        ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* ─── DAY TIMELINE VIEW ─── */
          <DayTimelineView
            bookings={activeSelectedBookings}
            allBookings={selectedBookings}
            overlappingIds={overlappingIds}
            onBookingClick={(id) => setLocation(`/admin/booking/${id}`)}
            baseDate={selectedDayBaseDate!}
            onRescheduled={() => utils.bookings.calendarBookings.invalidate()}
          />
        )}
      </div>
    </div>
  );
}

// ─── Booking Card (shared between month panel and day panel) ───

function BookingCard({
  booking, overlappingIds, onClick, showDuration,
}: {
  booking: CalendarBooking;
  overlappingIds: Set<number>;
  onClick: () => void;
  showDuration?: boolean;
}) {
  const statusStyle = STATUS_BADGE_STYLES[booking.status] || "";
  const serviceLabel = SERVICE_TYPES[booking.serviceType as ServiceType]?.label ?? booking.serviceType;
  const isOverlapping = overlappingIds.has(booking.id);
  const duration = getEstimatedDurationMinutes(booking);
  const endTime = booking.pickupDate + duration * 60 * 1000;

  return (
    <div
      onClick={onClick}
      className={`border rounded-lg p-3.5 cursor-pointer hover:bg-muted/30 transition-colors
        ${isOverlapping ? "border-red-500/50 bg-red-500/5" : "border-border/50"}
        ${booking.status === "cancelled" ? "opacity-50" : ""}`}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-medium text-[#d4a843]">{booking.referenceNumber}</span>
          {isOverlapping && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
        </div>
        <Badge variant="outline" className={`text-[10px] ${statusStyle}`}>
          {BOOKING_STATUSES[booking.status as BookingStatus]?.label ?? booking.status}
        </Badge>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium">
          {showDuration ? `${formatTime(booking.pickupDate)} – ${formatTime(endTime)}` : formatTime(booking.pickupDate)}
        </span>
        {showDuration && <span className="text-[10px] text-muted-foreground">({duration}min)</span>}
        {!showDuration && <span className="text-sm text-muted-foreground">—</span>}
        <span className="text-sm font-medium truncate">{booking.clientName}</span>
      </div>
      <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
        <Car className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{serviceLabel} · {booking.vehicleName}</span>
      </div>
      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <div className="truncate">
          <span>{booking.pickupAddress}</span>
          {booking.dropoffAddress && (
            <><ArrowRight className="w-3 h-3 inline mx-1 opacity-50" /><span>{booking.dropoffAddress}</span></>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/30">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="w-3 h-3" /><span>{booking.passengerCount} pax</span>
        </div>
        <span className="text-sm font-semibold text-[#d4a843]">${parseFloat(booking.totalPrice ?? "0").toFixed(2)}</span>
      </div>
    </div>
  );
}

// ─── Day Timeline Sub-Component with Drag-and-Drop ───

function DayTimelineView({
  bookings,
  allBookings,
  overlappingIds,
  onBookingClick,
  baseDate,
  onRescheduled,
}: {
  bookings: CalendarBooking[];
  allBookings: CalendarBooking[];
  overlappingIds: Set<number>;
  onBookingClick: (id: number) => void;
  baseDate: Date;
  onRescheduled: () => void;
}) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [rescheduleConfirm, setRescheduleConfirm] = useState<RescheduleConfirm | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [resizeConfirm, setResizeConfirm] = useState<ResizeConfirm | null>(null);
  const resizeRef = useRef<ResizeState | null>(null);
  const justInteractedRef = useRef(false);

  const adminModify = trpc.bookings.adminModify.useMutation({
    onSuccess: () => {
      toast.success("Booking rescheduled successfully");
      onRescheduled();
      setRescheduleConfirm(null);
    },
    onError: (err) => {
      toast.error(`Failed to reschedule: ${err.message}`);
      setRescheduleConfirm(null);
    },
  });

  // Column layout for overlapping blocks
  const blockLayout = useMemo(() => {
    const sorted = [...bookings].sort((a, b) => a.pickupDate - b.pickupDate);
    const layout: Map<number, { column: number; totalColumns: number }> = new Map();
    const columns: CalendarBooking[][] = [];

    for (const booking of sorted) {
      const startMs = booking.pickupDate;
      let placed = false;
      for (let col = 0; col < columns.length; col++) {
        const lastInCol = columns[col][columns[col].length - 1];
        const lastEnd = lastInCol.pickupDate + getEstimatedDurationMinutes(lastInCol) * 60 * 1000;
        if (startMs >= lastEnd) {
          columns[col].push(booking);
          layout.set(booking.id, { column: col, totalColumns: 0 });
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([booking]);
        layout.set(booking.id, { column: columns.length - 1, totalColumns: 0 });
      }
    }

    for (const booking of sorted) {
      const entry = layout.get(booking.id)!;
      let maxCol = entry.column;
      for (const other of sorted) {
        if (other.id === booking.id) continue;
        if (bookingsOverlap(booking, other)) {
          const otherEntry = layout.get(other.id)!;
          maxCol = Math.max(maxCol, otherEntry.column);
        }
      }
      entry.totalColumns = maxCol + 1;
    }
    return layout;
  }, [bookings]);

  // ─── Drag handlers ───

  const getHourFromY = useCallback((clientY: number): number => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const y = clientY - rect.top + timelineRef.current.scrollTop;
    return Math.max(0, Math.min(23.75, y / HOUR_HEIGHT));
  }, []);

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, booking: CalendarBooking) => {
    e.preventDefault();
    e.stopPropagation();
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const startHour = getHourFromTimestamp(booking.pickupDate);
    const state: DragState = {
      bookingId: booking.id,
      startY: clientY,
      startHour,
      currentHour: startHour,
    };
    dragRef.current = state;
    setDragState(state);

    const handleMove = (ev: MouseEvent | TouchEvent) => {
      const cy = "touches" in ev ? ev.touches[0].clientY : ev.clientY;
      if (!dragRef.current || !timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const scrollContainer = timelineRef.current.closest("[data-radix-scroll-area-viewport]");
      const scrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
      const y = cy - rect.top + scrollTop;
      const rawHour = y / HOUR_HEIGHT;
      // Offset: keep the grab point relative to block top
      const grabOffset = dragRef.current.startHour - (dragRef.current.startY - rect.top + scrollTop) / HOUR_HEIGHT;
      const targetHour = snapToQuarter(Math.max(0, Math.min(23.75, rawHour + grabOffset)));
      dragRef.current = { ...dragRef.current, currentHour: targetHour };
      setDragState({ ...dragRef.current });
    };

    const handleEnd = () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleEnd);

      const finalState = dragRef.current;
      if (!finalState) return;

      const snappedHour = snapToQuarter(finalState.currentHour);
      const originalHour = getHourFromTimestamp(booking.pickupDate);

      // Only trigger if moved more than 5 minutes
      if (Math.abs(snappedHour - originalHour) < 0.08) {
        setDragState(null);
        dragRef.current = null;
        return;
      }

      const newPickupDate = buildNewPickupDate(baseDate, snappedHour);

      // Check for overlaps with the new time
      const tempBooking = { ...booking, pickupDate: newPickupDate };
      const wouldOverlap = bookings.some(b => {
        if (b.id === booking.id) return false;
        return bookingsOverlap(tempBooking, b);
      });

      setRescheduleConfirm({
        booking,
        oldTime: formatTime(booking.pickupDate),
        newTime: hourToTimeString(snappedHour),
        newPickupDate,
        hasOverlap: wouldOverlap,
      });

      setDragState(null);
      dragRef.current = null;
      justInteractedRef.current = true;
      setTimeout(() => { justInteractedRef.current = false; }, 300);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchmove", handleMove, { passive: false });
    document.addEventListener("touchend", handleEnd);
  }, [bookings, baseDate, getHourFromY]);

  const confirmReschedule = () => {
    if (!rescheduleConfirm) return;
    adminModify.mutate({
      bookingId: rescheduleConfirm.booking.id,
      pickupDate: rescheduleConfirm.newPickupDate,
    });
  };

  // ─── Resize handlers ───

  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent, booking: CalendarBooking) => {
    e.preventDefault();
    e.stopPropagation();
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const originalDuration = getEstimatedDurationMinutes(booking);
    const state: ResizeState = {
      bookingId: booking.id,
      startY: clientY,
      originalDurationMin: originalDuration,
      currentDurationMin: originalDuration,
    };
    resizeRef.current = state;
    setResizeState(state);
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";

    const handleMove = (ev: MouseEvent | TouchEvent) => {
      const cy = "touches" in ev ? ev.touches[0].clientY : ev.clientY;
      if (!resizeRef.current) return;
      const deltaY = cy - resizeRef.current.startY;
      const deltaMinutes = (deltaY / HOUR_HEIGHT) * 60;
      const newDuration = Math.max(15, Math.round((resizeRef.current.originalDurationMin + deltaMinutes) / 15) * 15);
      resizeRef.current = { ...resizeRef.current, currentDurationMin: newDuration };
      setResizeState({ ...resizeRef.current });
    };

    const handleEnd = () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleEnd);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      const finalState = resizeRef.current;
      if (!finalState) return;

      const newDuration = finalState.currentDurationMin;
      const originalDuration = finalState.originalDurationMin;

      if (newDuration === originalDuration) {
        setResizeState(null);
        resizeRef.current = null;
        return;
      }

      // Check for overlaps with the new duration
      const tempBooking = { ...booking, estimatedDuration: newDuration };
      const wouldOverlap = bookings.some(b => {
        if (b.id === booking.id) return false;
        return bookingsOverlap(tempBooking, b);
      });

      setResizeConfirm({
        booking,
        oldDuration: originalDuration,
        newDuration,
        hasOverlap: wouldOverlap,
      });

      setResizeState(null);
      resizeRef.current = null;
      justInteractedRef.current = true;
      setTimeout(() => { justInteractedRef.current = false; }, 300);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchmove", handleMove, { passive: false });
    document.addEventListener("touchend", handleEnd);
  }, [bookings]);

  const confirmResize = () => {
    if (!resizeConfirm) return;
    adminModify.mutate({
      bookingId: resizeConfirm.booking.id,
      estimatedDuration: resizeConfirm.newDuration,
    }, {
      onSuccess: () => {
        toast.success("Duration updated successfully");
        onRescheduled();
        setResizeConfirm(null);
      },
      onError: (err) => {
        toast.error(`Failed to update duration: ${err.message}`);
        setResizeConfirm(null);
      },
    });
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Timeline */}
        <div className="flex-1">
          <Card className="border-border/50 overflow-hidden">
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-260px)]" style={{ scrollBehavior: "smooth" }}>
                <div
                  ref={timelineRef}
                  className="relative select-none"
                  style={{ height: `${24 * HOUR_HEIGHT}px`, minWidth: "300px" }}
                >
                  {/* Hour lines */}
                  {TIMELINE_HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="absolute w-full border-t border-border/30 flex"
                      style={{ top: `${hour * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                    >
                      <div className="w-16 shrink-0 pr-2 pt-1 text-right">
                        <span className="text-xs text-muted-foreground font-mono">
                          {String(hour).padStart(2, "0")}:00
                        </span>
                      </div>
                      <div className="flex-1 relative">
                        {/* 15-min grid lines */}
                        <div className="absolute w-full border-t border-border/10" style={{ top: "25%" }} />
                        <div className="absolute w-full border-t border-border/15" style={{ top: "50%" }} />
                        <div className="absolute w-full border-t border-border/10" style={{ top: "75%" }} />
                      </div>
                    </div>
                  ))}

                  {/* Current time indicator */}
                  {(() => {
                    const nowLocal = new Date(new Date().toLocaleString("en-US", { timeZone: "Australia/Brisbane" }));
                    const currentHour = nowLocal.getHours() + nowLocal.getMinutes() / 60;
                    return (
                      <div className="absolute left-16 right-0 z-20 pointer-events-none" style={{ top: `${currentHour * HOUR_HEIGHT}px` }}>
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                          <div className="flex-1 h-[2px] bg-red-500/70" />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Drop target indicator when dragging */}
                  {dragState && (
                    <div
                      className="absolute left-16 right-0 z-15 pointer-events-none"
                      style={{ top: `${dragState.currentHour * HOUR_HEIGHT}px` }}
                    >
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-[#d4a843] -ml-1" />
                        <div className="flex-1 h-[2px] bg-[#d4a843]/70 border-dashed" />
                      </div>
                      <span className="absolute -top-5 left-0 text-[10px] font-mono font-bold text-[#d4a843] bg-background/90 px-1 rounded">
                        {hourToTimeString(dragState.currentHour)}
                      </span>
                    </div>
                  )}

                  {/* Booking blocks */}
                  {bookings.map((booking) => {
                    const isDragging = dragState?.bookingId === booking.id;
                    const isResizing = resizeState?.bookingId === booking.id;
                    const displayHour = isDragging ? dragState!.currentHour : getHourFromTimestamp(booking.pickupDate);
                    const currentDurationMin = isResizing ? resizeState!.currentDurationMin : getEstimatedDurationMinutes(booking);
                    const durationHours = currentDurationMin / 60;
                    const colors = STATUS_COLORS[booking.status] ?? STATUS_COLORS.pending;
                    const isOverlapping = overlappingIds.has(booking.id);
                    const layoutInfo = blockLayout.get(booking.id);
                    const column = layoutInfo?.column ?? 0;
                    const totalColumns = layoutInfo?.totalColumns ?? 1;
                    const serviceLabel = SERVICE_TYPES[booking.serviceType as ServiceType]?.label ?? booking.serviceType;

                    const blockTop = displayHour * HOUR_HEIGHT;
                    const blockHeight = Math.max(durationHours * HOUR_HEIGHT, 36);

                    const availableWidth = 100;
                    const colWidth = availableWidth / totalColumns;
                    const colLeft = column * colWidth;

                    return (
                      <div
                        key={booking.id}
                        onClick={() => { if (!isDragging && !isResizing && !justInteractedRef.current) onBookingClick(booking.id); }}
                        className={`absolute z-10 rounded-r-md border-l-[3px] group
                          ${colors.block} ${colors.blockBorder}
                          ${isOverlapping && !isDragging && !isResizing ? "ring-1 ring-red-500/50" : ""}
                          ${isDragging ? "z-40 opacity-80 shadow-xl ring-2 ring-[#d4a843]/60 scale-[1.02]" : ""}
                          ${isResizing ? "z-40 ring-2 ring-[#d4a843]/60" : ""}
                          ${!isDragging && !isResizing ? "cursor-pointer hover:z-30 hover:brightness-110" : ""}
                          transition-shadow
                        `}
                        style={{
                          top: `${blockTop}px`,
                          height: `${blockHeight}px`,
                          left: `calc(4rem + ${colLeft}%)`,
                          width: `calc(${colWidth}% - 4rem / ${totalColumns} - 4px)`,
                          maxWidth: `calc(${colWidth}% - 4px)`,
                          transition: isDragging || isResizing ? "none" : "box-shadow 0.15s, transform 0.15s",
                        }}
                      >
                        {/* Drag handle */}
                        <div
                          onMouseDown={(e) => handleDragStart(e, booking)}
                          onTouchStart={(e) => handleDragStart(e, booking)}
                          className="absolute top-0 left-0 w-full h-6 cursor-grab active:cursor-grabbing flex items-center justify-center z-10"
                          title="Drag to reschedule"
                        >
                          <GripVertical className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity" />
                        </div>

                        <div className="p-2 h-full overflow-hidden pt-3">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {isOverlapping && <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />}
                            <span className={`text-xs font-bold ${colors.text} truncate`}>
                              {isDragging ? hourToTimeString(dragState!.currentHour) : formatTime(booking.pickupDate)}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              ({currentDurationMin}min)
                            </span>
                          </div>
                          {blockHeight > 50 && (
                            <div className="text-xs font-medium text-foreground/80 truncate">{booking.clientName}</div>
                          )}
                          {blockHeight > 70 && (
                            <div className="text-[10px] text-muted-foreground truncate mt-0.5">{serviceLabel} · {booking.vehicleName}</div>
                          )}
                          {blockHeight > 90 && (
                            <div className="text-[10px] text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5 shrink-0" />
                              {booking.pickupAddress}
                              {booking.dropoffAddress && (
                                <><ArrowRight className="w-2.5 h-2.5 shrink-0" />{booking.dropoffAddress}</>
                              )}
                            </div>
                          )}
                          {blockHeight > 110 && (
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                              <span className="font-mono text-[#d4a843]">{booking.referenceNumber}</span>
                              <span>{booking.passengerCount} pax</span>
                              <span className="font-semibold text-[#d4a843]">${parseFloat(booking.totalPrice ?? "0").toFixed(2)}</span>
                            </div>
                          )}
                        </div>

                        {/* Resize handle (bottom edge) */}
                        <div
                          onMouseDown={(e) => handleResizeStart(e, booking)}
                          onTouchStart={(e) => handleResizeStart(e, booking)}
                          className="absolute bottom-0 left-0 w-full h-3 cursor-ns-resize z-20 flex items-center justify-center hover:bg-black/10 transition-colors rounded-b-md"
                          title="Drag to extend/shorten duration"
                        >
                          <div className="w-10 h-1.5 rounded-full bg-muted-foreground/40 group-hover:bg-[#d4a843] transition-colors shadow-sm" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
            {Object.entries(STATUS_COLORS).filter(([s]) => s !== "cancelled" && s !== "expired").map(([status, colors]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${colors.dot} ${status === "quote" ? "border border-dashed border-purple-400" : ""}`} />
                <span className="capitalize">{status === "quote" ? "Quote (Provisional)" : status}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5"><AlertTriangle className="w-3 h-3 text-red-400" /><span>Overlap</span></div>
            <div className="flex items-center gap-1.5"><GripVertical className="w-3 h-3 text-muted-foreground" /><span>Drag to reschedule</span></div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Hover over a booking block and drag the handle at the top to reschedule, or drag the bottom edge to extend/shorten duration. Time snaps to 15-minute intervals.
          </p>
        </div>

        {/* Booking List Panel */}
        <div className="lg:w-[380px] xl:w-[420px]">
          <Card className="border-border/50 sticky top-28">
            <CardContent className="p-0">
              <div className="p-4 border-b border-border/50">
                <h2 className="font-heading text-lg font-bold">All Bookings</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {allBookings.length === 0 ? "No bookings" : `${allBookings.length} total · ${allBookings.filter(b => b.status !== "cancelled").length} active`}
                </p>
              </div>
              <ScrollArea className="max-h-[calc(100vh-280px)]">
                <div className="p-4 space-y-3">
                  {allBookings.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No bookings on this day</p>
                    </div>
                  )}
                  {allBookings
                    .sort((a, b) => a.pickupDate - b.pickupDate)
                    .map((booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        overlappingIds={overlappingIds}
                        onClick={() => onBookingClick(booking.id)}
                        showDuration
                      />
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reschedule Confirmation Dialog */}
      <Dialog open={!!rescheduleConfirm} onOpenChange={(open) => { if (!open) setRescheduleConfirm(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#d4a843]" />
              Reschedule Booking
            </DialogTitle>
            <DialogDescription>
              Confirm the new pickup time for this booking.
            </DialogDescription>
          </DialogHeader>

          {rescheduleConfirm && (
            <div className="space-y-4 py-2">
              <div className="border border-border/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-medium text-[#d4a843]">
                    {rescheduleConfirm.booking.referenceNumber}
                  </span>
                  <span className="text-sm font-medium">{rescheduleConfirm.booking.clientName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">From</p>
                    <p className="text-lg font-bold text-red-400 line-through">{rescheduleConfirm.oldTime}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">To</p>
                    <p className="text-lg font-bold text-green-400">{rescheduleConfirm.newTime}</p>
                  </div>
                </div>
              </div>

              {rescheduleConfirm.hasOverlap && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>This time slot overlaps with another booking.</span>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRescheduleConfirm(null)} className="bg-background">
              Cancel
            </Button>
            <Button
              onClick={confirmReschedule}
              disabled={adminModify.isPending}
              className="gold-gradient text-gold-foreground border-0"
            >
              {adminModify.isPending ? "Saving..." : "Confirm Reschedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resize Duration Confirmation Dialog */}
      <Dialog open={!!resizeConfirm} onOpenChange={(open) => { if (!open) setResizeConfirm(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#d4a843]" />
              Adjust Duration
            </DialogTitle>
            <DialogDescription>
              Confirm the new duration for this booking.
            </DialogDescription>
          </DialogHeader>

          {resizeConfirm && (
            <div className="space-y-4 py-2">
              <div className="border border-border/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-medium text-[#d4a843]">
                    {resizeConfirm.booking.referenceNumber}
                  </span>
                  <span className="text-sm font-medium">{resizeConfirm.booking.clientName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">From</p>
                    <p className="text-lg font-bold text-red-400 line-through">{resizeConfirm.oldDuration}min</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">To</p>
                    <p className="text-lg font-bold text-green-400">{resizeConfirm.newDuration}min</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  {formatTime(resizeConfirm.booking.pickupDate)} – {formatTime(resizeConfirm.booking.pickupDate + resizeConfirm.newDuration * 60 * 1000)}
                </div>
              </div>

              {resizeConfirm.hasOverlap && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>This duration overlaps with another booking.</span>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setResizeConfirm(null)} className="bg-background">
              Cancel
            </Button>
            <Button
              onClick={confirmResize}
              disabled={adminModify.isPending}
              className="gold-gradient text-gold-foreground border-0"
            >
              {adminModify.isPending ? "Saving..." : "Confirm Duration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
