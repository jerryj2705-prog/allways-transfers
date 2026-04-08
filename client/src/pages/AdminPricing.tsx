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
} from "lucide-react";

const LOGO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/logo-white_476df209.png";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  base_airport_transfer: Plane,
  base_hourly_hire: Clock,
  base_point_to_point: Route,
  base_special_events: Star,
  rate_per_km: Car,
  rate_support_van: Car,
  surcharge_out_of_hours: Clock,
  surcharge_out_of_area: MapPin,
  surcharge_fuel_levy: Fuel,
  min_hourly_hours: Clock,
  late_cancel_charge_pct: Percent,
  distance_surcharge_per_50km: Route,
};

export default function AdminPricing() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { data: settings, isLoading, refetch } = trpc.pricing.getAll.useQuery();
  const updateMutation = trpc.pricing.update.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Pricing updated successfully");
    },
    onError: (err) => toast.error(err.message),
  });

  const [editValues, setEditValues] = useState<Record<number, { value: string; isActive: number }>>({});

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
      </main>
    </div>
  );
}
