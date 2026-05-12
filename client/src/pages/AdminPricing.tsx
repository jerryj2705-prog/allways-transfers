import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  ChevronLeft, DollarSign, Percent, Save, Fuel, Clock, MapPin, Plane, Car, Star, Route,
  CalendarDays, Plus, Trash2, Pencil, X, Check, Dog, Package,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

const LOGO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/logo-white_476df209.png";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  base_airport_transfer: Plane,
  base_hourly_hire: Clock,
  base_point_to_point: Route,
  base_special_events: Star,
  base_freight: Package,
  rate_per_km: Car,
  rate_support_van: Car,
  surcharge_out_of_hours: Clock,
  surcharge_out_of_area: MapPin,
  surcharge_fuel_levy: Fuel,
  surcharge_additional_stop: MapPin,
  surcharge_public_holiday: CalendarDays,
  min_hourly_hours: Clock,
  late_cancel_charge_pct: Percent,
  surcharge_pet: Dog,
};

export default function AdminPricing() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { data: settings, isLoading, refetch } = trpc.pricing.getAll.useQuery();
  const { data: holidays, isLoading: holidaysLoading, refetch: refetchHolidays } = trpc.publicHolidays.list.useQuery();
  const createHolidayMutation = trpc.publicHolidays.create.useMutation({
    onSuccess: () => { refetchHolidays(); toast.success("Holiday added"); setHolidayDialogOpen(false); },
    onError: (err) => toast.error(err.message),
  });
  const updateHolidayMutation = trpc.publicHolidays.update.useMutation({
    onSuccess: () => { refetchHolidays(); toast.success("Holiday updated"); setHolidayDialogOpen(false); },
    onError: (err) => toast.error(err.message),
  });
  const deleteHolidayMutation = trpc.publicHolidays.delete.useMutation({
    onSuccess: () => { refetchHolidays(); toast.success("Holiday deleted"); },
    onError: (err) => toast.error(err.message),
  });
  const updateMutation = trpc.pricing.update.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Pricing updated successfully");
    },
    onError: (err) => toast.error(err.message),
  });

  const [editValues, setEditValues] = useState<Record<number, { value: string; isActive: number }>>({});
  const [holidayDialogOpen, setHolidayDialogOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<{ id?: number; name: string; date: string; isRecurring: number } | null>(null);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <h2 className="font-heading text-xl font-bold">Admin Access Required</h2>
            <p className="text-muted-foreground">Please sign in with an admin account.</p>
            <Button onClick={() => window.location.href = getLoginUrl()} className="gold-gradient text-gold-foreground">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getEditValue = (id: number, original: { settingValue: string; isActive: number }) => {
    return editValues[id] ?? { value: original.settingValue, isActive: original.isActive };
  };

  const handleValueChange = (id: number, value: string, isActive: number) => {
    setEditValues(prev => ({ ...prev, [id]: { value, isActive } }));
  };

  const handleSave = (id: number) => {
    const edit = editValues[id];
    if (!edit) return;
    updateMutation.mutate({ id, value: edit.value, isActive: edit.isActive });
    setEditValues(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const hasChanges = (id: number, original: { settingValue: string; isActive: number }) => {
    const edit = editValues[id];
    if (!edit) return false;
    return edit.value !== original.settingValue || edit.isActive !== original.isActive;
  };

  // Group settings by category
  const basePrices = settings?.filter(s => s.category === "base_price") ?? [];
  const rates = settings?.filter(s => s.category === "rate") ?? [];
  const surcharges = settings?.filter(s => s.category === "surcharge") ?? [];
  const toggles = settings?.filter(s => s.category === "toggle") ?? [];

  const renderSettingCard = (setting: typeof settings extends (infer T)[] | undefined ? T : never) => {
    if (!setting) return null;
    const edit = getEditValue(setting.id, { settingValue: setting.settingValue, isActive: setting.isActive });
    const Icon = CATEGORY_ICONS[setting.settingKey] || DollarSign;
    const isToggle = setting.category === "toggle";
    const isPercent = setting.settingKey === "surcharge_fuel_levy" || setting.settingKey === "late_cancel_charge_pct";
    const isHours = setting.settingKey === "min_hourly_hours";
    const changed = hasChanges(setting.id, { settingValue: setting.settingValue, isActive: setting.isActive });

    return (
      <Card key={setting.id} className={`transition-all ${changed ? "ring-2 ring-primary" : ""}`}>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-gold-foreground" />
              </div>
              <div>
                <h3 className="font-heading text-sm font-semibold">{setting.label}</h3>
                <p className="text-xs text-muted-foreground">{setting.description}</p>
              </div>
            </div>
            {(setting.category === "surcharge" || isToggle) && (
              <div className="flex items-center gap-2 shrink-0">
                <Label className="text-xs text-muted-foreground">Active</Label>
                <Switch
                  checked={edit.isActive === 1}
                  onCheckedChange={(checked) =>
                    handleValueChange(setting.id, edit.value, checked ? 1 : 0)
                  }
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                {isHours ? "hrs" : isPercent ? "%" : "$"}
              </span>
              <Input
                type="number"
                step={isHours ? "1" : "0.01"}
                min={isHours ? "1" : "0"}
                value={edit.value}
                onChange={(e) => handleValueChange(setting.id, e.target.value, edit.isActive)}
                className="pl-8"
              />
            </div>
            {changed && (
              <Button
                size="sm"
                onClick={() => handleSave(setting.id)}
                disabled={updateMutation.isPending}
                className="gold-gradient text-gold-foreground"
              >
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 h-20 border-b border-border/30 bg-background/95 backdrop-blur-md">
        <div className="container h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/admin")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Dashboard
            </Button>
            <img src={LOGO_IMG} alt="All Ways Transfers" className="h-16 w-auto" />
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="font-heading text-3xl font-bold">Pricing Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage base prices, per-km rates, and surcharges. Changes take effect immediately for new bookings.
          </p>
        </div>

        {/* Base Prices */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <h2 className="font-heading text-xl font-semibold">Base Prices</h2>
          </div>
          <p className="text-sm text-muted-foreground">Starting price for each service type. Displayed on service cards.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {basePrices.map(renderSettingCard)}
          </div>
        </section>

        {/* Rates */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-primary" />
            <h2 className="font-heading text-xl font-semibold">Rates</h2>
          </div>
          <p className="text-sm text-muted-foreground">Per-kilometre and support van rates applied to bookings.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {rates.map(renderSettingCard)}
          </div>
        </section>

        {/* Surcharges */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-primary" />
            <h2 className="font-heading text-xl font-semibold">Surcharges</h2>
          </div>
          <p className="text-sm text-muted-foreground">Additional charges applied based on conditions. Toggle active/inactive.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {surcharges.map(renderSettingCard)}
          </div>
        </section>

        {/* Fuel Levy */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Fuel className="w-5 h-5 text-primary" />
            <h2 className="font-heading text-xl font-semibold">Fuel Levy</h2>
          </div>
          <p className="text-sm text-muted-foreground">Percentage-based levy applied to base price + distance charges. Toggle to enable/disable.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {toggles.map(renderSettingCard)}
          </div>
        </section>

        {/* Public Holidays */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              <h2 className="font-heading text-xl font-semibold">Public Holidays</h2>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEditingHoliday({ name: "", date: "", isRecurring: 0 });
                setHolidayDialogOpen(true);
              }}
              className="gold-gradient text-gold-foreground"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Holiday
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage public holidays. A surcharge is automatically applied when a booking pickup date falls on an active holiday.
            Recurring holidays match the same date every year (e.g., Christmas on Dec 25).
          </p>

          {holidaysLoading ? (
            <div className="text-muted-foreground text-sm animate-pulse">Loading holidays...</div>
          ) : !holidays || holidays.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No public holidays configured yet.</p>
                <p className="text-xs mt-1">Add holidays to automatically apply surcharges.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {holidays.map((h) => (
                <Card key={h.id} className={`transition-all ${h.isActive !== 1 ? "opacity-50" : ""}`}>
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${h.isActive === 1 ? "gold-gradient" : "bg-muted"}`}>
                        <CalendarDays className={`w-5 h-5 ${h.isActive === 1 ? "text-gold-foreground" : "text-muted-foreground"}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading text-sm font-semibold truncate">{h.name}</h3>
                          {h.isRecurring === 1 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium shrink-0">Recurring</span>
                          )}
                          {h.isActive !== 1 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-medium shrink-0">Inactive</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {h.isRecurring === 1
                            ? `Every ${new Date(h.date + "T00:00:00").toLocaleDateString("en-AU", { month: "long", day: "numeric" })}`
                            : new Date(h.date + "T00:00:00").toLocaleDateString("en-AU", { weekday: "short", year: "numeric", month: "long", day: "numeric" })
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={h.isActive === 1}
                        onCheckedChange={(checked) => {
                          updateHolidayMutation.mutate({ id: h.id, isActive: checked ? 1 : 0 });
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingHoliday({ id: h.id, name: h.name, date: h.date, isRecurring: h.isRecurring });
                          setHolidayDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm(`Delete "${h.name}"?`)) {
                            deleteHolidayMutation.mutate({ id: h.id });
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Holiday Add/Edit Dialog */}
      <Dialog open={holidayDialogOpen} onOpenChange={setHolidayDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingHoliday?.id ? "Edit Holiday" : "Add Public Holiday"}</DialogTitle>
            <DialogDescription>
              {editingHoliday?.id ? "Update the holiday details below." : "Add a new public holiday. Bookings on this date will have a surcharge applied."}
            </DialogDescription>
          </DialogHeader>
          {editingHoliday && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Holiday Name</Label>
                <Input
                  placeholder="e.g. Christmas Day"
                  value={editingHoliday.name}
                  onChange={(e) => setEditingHoliday({ ...editingHoliday, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={editingHoliday.date}
                  onChange={(e) => setEditingHoliday({ ...editingHoliday, date: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={editingHoliday.isRecurring === 1}
                  onCheckedChange={(checked) => setEditingHoliday({ ...editingHoliday, isRecurring: checked ? 1 : 0 })}
                />
                <div>
                  <Label>Recurring (same date every year)</Label>
                  <p className="text-xs text-muted-foreground">E.g., Christmas is always Dec 25</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setHolidayDialogOpen(false)}>Cancel</Button>
            <Button
              className="gold-gradient text-gold-foreground"
              disabled={!editingHoliday?.name || !editingHoliday?.date || createHolidayMutation.isPending || updateHolidayMutation.isPending}
              onClick={() => {
                if (!editingHoliday) return;
                if (editingHoliday.id) {
                  updateHolidayMutation.mutate({
                    id: editingHoliday.id,
                    name: editingHoliday.name,
                    date: editingHoliday.date,
                    isRecurring: editingHoliday.isRecurring,
                  });
                } else {
                  createHolidayMutation.mutate({
                    name: editingHoliday.name,
                    date: editingHoliday.date,
                    isRecurring: editingHoliday.isRecurring,
                  });
                }
              }}
            >
              {editingHoliday?.id ? "Update" : "Add Holiday"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
