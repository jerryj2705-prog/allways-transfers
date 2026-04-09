import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import {
  ChevronLeft, ChevronRight, LogOut, Home, DollarSign, MessageSquare,
  LayoutDashboard, CalendarDays, Clock, MapPin, Users, Car, ArrowRight,
} from "lucide-react";
import { SERVICE_TYPES, BOOKING_STATUSES, PAYMENT_METHODS } from "@shared/types";
import type { ServiceType, BookingStatus, PaymentMethod } from "@shared/types";

const LOGO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/logo-white_476df209.png";

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: "bg-amber-500/20", text: "text-amber-400", dot: "bg-amber-400" },
  confirmed: { bg: "bg-blue-500/20", text: "text-blue-400", dot: "bg-blue-400" },
  completed: { bg: "bg-green-500/20", text: "text-green-400", dot: "bg-green-400" },
  cancelled: { bg: "bg-red-500/20", text: "text-red-400", dot: "bg-red-400" },
};

const STATUS_BADGE_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
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
  // 0 = Sunday, adjust to Monday start: Mon=0, Tue=1, ..., Sun=6
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

function isSameDay(ts: number, year: number, month: number, day: number): boolean {
  const d = new Date(ts);
  const local = new Date(d.toLocaleString("en-US", { timeZone: "Australia/Brisbane" }));
  return local.getFullYear() === year && local.getMonth() === month && local.getDate() === day;
}

function isToday(year: number, month: number, day: number): boolean {
  const now = new Date();
  const local = new Date(now.toLocaleString("en-US", { timeZone: "Australia/Brisbane" }));
  return local.getFullYear() === year && local.getMonth() === month && local.getDate() === day;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
};

export default function AdminCalendar() {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();

  // Current displayed month
  const now = new Date();
  const localNow = new Date(now.toLocaleString("en-US", { timeZone: "Australia/Brisbane" }));
  const [viewYear, setViewYear] = useState(localNow.getFullYear());
  const [viewMonth, setViewMonth] = useState(localNow.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(localNow.getDate());

  // Calculate date range for the query (full month in AEST)
  const dateRange = useMemo(() => {
    const start = getMonthStart(viewYear, viewMonth);
    const end = getMonthEnd(viewYear, viewMonth);
    // Convert AEST to UTC ms (AEST = UTC+10)
    const startMs = start.getTime();
    const endMs = end.getTime();
    return { startMs, endMs };
  }, [viewYear, viewMonth]);

  const { data: calendarBookings, isLoading } = trpc.bookings.calendarBookings.useQuery(
    dateRange,
    { enabled: !!user && user.role === "admin" }
  );

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

  // Navigation
  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
    setSelectedDay(null);
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
    setSelectedDay(null);
  }

  function goToToday() {
    const n = new Date();
    const l = new Date(n.toLocaleString("en-US", { timeZone: "Australia/Brisbane" }));
    setViewYear(l.getFullYear());
    setViewMonth(l.getMonth());
    setSelectedDay(l.getDate());
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
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            className="gold-gradient text-gold-foreground border-0"
          >
            Sign In
          </Button>
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
          <Button onClick={() => setLocation("/")} variant="outline" className="bg-background">
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayOffset = getFirstDayOfWeek(viewYear, viewMonth);

  // Selected day bookings
  const selectedBookings = selectedDay ? (bookingsByDay.get(selectedDay) ?? []) : [];

  // Count active (non-cancelled) bookings per day for indicators
  const getActiveCount = (day: number) => {
    const dayBookings = bookingsByDay.get(day) ?? [];
    return dayBookings.filter(b => b.status !== "cancelled").length;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky Header */}
      <div className="border-b border-border/50 bg-background/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center justify-between h-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation("/")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <img src={LOGO_IMG} alt="All Ways Transfers" className="h-16 w-auto" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/admin")}
              className="gap-1 bg-background"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bookings</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/admin/pricing")}
              className="gap-1 bg-background"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pricing</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/admin/enquiries")}
              className="gap-1 bg-background"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Enquiries</span>
            </Button>
            <span className="text-sm text-muted-foreground hidden sm:inline">{user.name}</span>
            <Button variant="outline" size="sm" onClick={logout} className="gap-1 bg-background">
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Calendar Grid */}
          <div className="flex-1">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <CalendarDays className="w-6 h-6 text-[#d4a843]" />
                <h1 className="font-heading text-2xl font-bold">
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goToToday} className="bg-background text-xs">
                  Today
                </Button>
                <Button variant="outline" size="icon" onClick={prevMonth} className="bg-background h-8 w-8">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={nextMonth} className="bg-background h-8 w-8">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Calendar */}
            <Card className="border-border/50 overflow-hidden">
              <CardContent className="p-0">
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-border/50">
                  {DAY_NAMES.map((name) => (
                    <div key={name} className="py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {name}
                    </div>
                  ))}
                </div>

                {/* Calendar cells */}
                <div className="grid grid-cols-7">
                  {/* Empty cells before first day */}
                  {Array.from({ length: firstDayOffset }).map((_, i) => (
                    <div key={`empty-${i}`} className="min-h-[80px] sm:min-h-[100px] border-b border-r border-border/30 bg-muted/20" />
                  ))}

                  {/* Day cells */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dayBookings = bookingsByDay.get(day) ?? [];
                    const activeCount = getActiveCount(day);
                    const todayFlag = isToday(viewYear, viewMonth, day);
                    const isSelected = selectedDay === day;
                    const hasBookings = dayBookings.length > 0;

                    return (
                      <div
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`min-h-[80px] sm:min-h-[100px] border-b border-r border-border/30 p-1.5 sm:p-2 cursor-pointer transition-colors relative
                          ${isSelected ? "bg-[#d4a843]/10 ring-1 ring-[#d4a843]/50 ring-inset" : "hover:bg-muted/30"}
                          ${todayFlag ? "bg-accent/30" : ""}
                        `}
                      >
                        {/* Day number */}
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-medium leading-none
                            ${todayFlag ? "bg-[#d4a843] text-[#0a0a0a] w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" : ""}
                            ${isSelected && !todayFlag ? "text-[#d4a843]" : ""}
                          `}>
                            {day}
                          </span>
                          {activeCount > 0 && (
                            <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 rounded-full px-1.5 py-0.5">
                              {activeCount}
                            </span>
                          )}
                        </div>

                        {/* Booking indicators */}
                        <div className="space-y-0.5">
                          {dayBookings.slice(0, 3).map((b) => {
                            const colors = STATUS_COLORS[b.status] ?? STATUS_COLORS.pending;
                            return (
                              <div
                                key={b.id}
                                className={`${colors.bg} rounded px-1 py-0.5 truncate hidden sm:block`}
                              >
                                <span className={`text-[10px] font-medium ${colors.text} leading-tight`}>
                                  {formatTime(b.pickupDate)} {b.clientName.split(" ")[0]}
                                </span>
                              </div>
                            );
                          })}
                          {dayBookings.length > 3 && (
                            <div className="text-[10px] text-muted-foreground pl-1 hidden sm:block">
                              +{dayBookings.length - 3} more
                            </div>
                          )}
                          {/* Mobile: just dots */}
                          {hasBookings && (
                            <div className="flex gap-0.5 sm:hidden mt-1">
                              {dayBookings.slice(0, 4).map((b) => {
                                const colors = STATUS_COLORS[b.status] ?? STATUS_COLORS.pending;
                                return (
                                  <div key={b.id} className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                                );
                              })}
                              {dayBookings.length > 4 && (
                                <span className="text-[8px] text-muted-foreground">+{dayBookings.length - 4}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Empty cells after last day */}
                  {Array.from({ length: (7 - ((firstDayOffset + daysInMonth) % 7)) % 7 }).map((_, i) => (
                    <div key={`end-empty-${i}`} className="min-h-[80px] sm:min-h-[100px] border-b border-r border-border/30 bg-muted/20" />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
              {Object.entries(STATUS_COLORS).map(([status, colors]) => (
                <div key={status} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                  <span className="capitalize">{status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Day Detail Panel */}
          <div className="lg:w-[380px] xl:w-[420px]">
            <Card className="border-border/50 sticky top-28">
              <CardContent className="p-0">
                {/* Panel Header */}
                <div className="p-4 border-b border-border/50">
                  <h2 className="font-heading text-lg font-bold">
                    {selectedDay
                      ? formatDateFull(new Date(viewYear, viewMonth, selectedDay).getTime())
                      : "Select a day"
                    }
                  </h2>
                  {selectedDay && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedBookings.length === 0
                        ? "No bookings"
                        : `${selectedBookings.length} booking${selectedBookings.length > 1 ? "s" : ""}`
                      }
                    </p>
                  )}
                </div>

                {/* Bookings List */}
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
                      .map((booking) => {
                        const statusStyle = STATUS_BADGE_STYLES[booking.status] || "";
                        const serviceLabel = SERVICE_TYPES[booking.serviceType as ServiceType]?.label ?? booking.serviceType;
                        return (
                          <div
                            key={booking.id}
                            onClick={() => setLocation(`/admin/booking/${booking.id}`)}
                            className="border border-border/50 rounded-lg p-3.5 cursor-pointer hover:bg-muted/30 transition-colors group"
                          >
                            {/* Header row */}
                            <div className="flex items-center justify-between mb-2.5">
                              <span className="font-mono text-xs font-medium text-[#d4a843]">
                                {booking.referenceNumber}
                              </span>
                              <Badge variant="outline" className={`text-[10px] ${statusStyle}`}>
                                {BOOKING_STATUSES[booking.status as BookingStatus]?.label ?? booking.status}
                              </Badge>
                            </div>

                            {/* Time & Client */}
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span className="text-sm font-medium">{formatTime(booking.pickupDate)}</span>
                              <span className="text-sm text-muted-foreground">—</span>
                              <span className="text-sm font-medium truncate">{booking.clientName}</span>
                            </div>

                            {/* Service & Vehicle */}
                            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                              <Car className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{serviceLabel} · {booking.vehicleName}</span>
                            </div>

                            {/* Route */}
                            <div className="flex items-start gap-2 text-xs text-muted-foreground">
                              <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <div className="truncate">
                                <span>{booking.pickupAddress}</span>
                                {booking.dropoffAddress && (
                                  <>
                                    <ArrowRight className="w-3 h-3 inline mx-1 opacity-50" />
                                    <span>{booking.dropoffAddress}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/30">
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Users className="w-3 h-3" />
                                <span>{booking.passengerCount} pax</span>
                              </div>
                              <span className="text-sm font-semibold text-[#d4a843]">
                                ${parseFloat(booking.totalPrice ?? "0").toFixed(2)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
