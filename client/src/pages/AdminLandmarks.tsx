import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  Search, MapPin, ArrowLeft, LogOut, Plus, Pencil, Trash2, Eye, EyeOff,
  Hotel, Trees, Landmark as LandmarkIcon, GraduationCap, Plane, ShoppingBag,
  Trophy, Ticket, Star, CircleDot, ChevronLeft, ChevronRight,
} from "lucide-react";

const LOGO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486426022/2tTLZKCNzV8jFwxBsLMjpn/logo-white_476df209.png";

const CATEGORIES = [
  { value: "resort", label: "Resort", icon: Hotel },
  { value: "golf_course", label: "Golf Course", icon: Trees },
  { value: "venue", label: "Venue", icon: LandmarkIcon },
  { value: "hospital", label: "Hospital", icon: Plus },
  { value: "university", label: "University", icon: GraduationCap },
  { value: "airport", label: "Airport", icon: Plane },
  { value: "shopping", label: "Shopping", icon: ShoppingBag },
  { value: "stadium", label: "Stadium", icon: Trophy },
  { value: "theme_park", label: "Theme Park", icon: Ticket },
  { value: "attraction", label: "Attraction", icon: Star },
  { value: "other", label: "Other", icon: CircleDot },
] as const;

type CategoryValue = typeof CATEGORIES[number]["value"];

const CATEGORY_STYLES: Record<string, string> = {
  resort: "bg-purple-100 text-purple-800 border-purple-200",
  golf_course: "bg-green-100 text-green-800 border-green-200",
  venue: "bg-blue-100 text-blue-800 border-blue-200",
  hospital: "bg-red-100 text-red-800 border-red-200",
  university: "bg-indigo-100 text-indigo-800 border-indigo-200",
  airport: "bg-sky-100 text-sky-800 border-sky-200",
  shopping: "bg-pink-100 text-pink-800 border-pink-200",
  stadium: "bg-orange-100 text-orange-800 border-orange-200",
  theme_park: "bg-amber-100 text-amber-800 border-amber-200",
  attraction: "bg-teal-100 text-teal-800 border-teal-200",
  other: "bg-gray-100 text-gray-800 border-gray-200",
};

const LGA_OPTIONS = [
  "Sunshine Coast", "Noosa", "Brisbane", "Gold Coast", "Moreton Bay",
  "Ipswich", "Toowoomba", "Fraser Coast", "Gympie", "Somerset",
  "Logan", "Redland", "Scenic Rim",
];

function getCategoryLabel(cat: string): string {
  return CATEGORIES.find(c => c.value === cat)?.label ?? cat;
}

function getCategoryIcon(cat: string) {
  return CATEGORIES.find(c => c.value === cat)?.icon ?? CircleDot;
}

interface LandmarkFormData {
  name: string;
  lat: string;
  lng: string;
  lga: string;
  category: CategoryValue;
  address: string;
  isActive: number;
}

const emptyForm: LandmarkFormData = {
  name: "",
  lat: "",
  lng: "",
  lga: "Sunshine Coast",
  category: "other",
  address: "",
  isActive: 1,
};

export default function AdminLandmarks() {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [lgaFilter, setLgaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const pageSize = 25;

  // Dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingLandmark, setEditingLandmark] = useState<any | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [formData, setFormData] = useState<LandmarkFormData>({ ...emptyForm });

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useMemo(() => {
    const id = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(id);
  }, [searchQuery]);

  // Queries
  const { data: stats } = trpc.landmarks.stats.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const { data: allLandmarks, isLoading } = trpc.landmarks.list.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  // Mutations
  const createMutation = trpc.landmarks.create.useMutation({
    onSuccess: () => {
      toast.success("Landmark created successfully");
      utils.landmarks.list.invalidate();
      utils.landmarks.stats.invalidate();
      utils.landmarks.active.invalidate();
      setShowCreateDialog(false);
      setFormData({ ...emptyForm });
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.landmarks.update.useMutation({
    onSuccess: () => {
      toast.success("Landmark updated successfully");
      utils.landmarks.list.invalidate();
      utils.landmarks.stats.invalidate();
      utils.landmarks.active.invalidate();
      setEditingLandmark(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleMutation = trpc.landmarks.toggleActive.useMutation({
    onSuccess: (data) => {
      toast.success(`Landmark ${data?.isActive ? "activated" : "deactivated"}`);
      utils.landmarks.list.invalidate();
      utils.landmarks.stats.invalidate();
      utils.landmarks.active.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.landmarks.delete.useMutation({
    onSuccess: () => {
      toast.success("Landmark deleted");
      utils.landmarks.list.invalidate();
      utils.landmarks.stats.invalidate();
      utils.landmarks.active.invalidate();
      setDeleteConfirmId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  // Client-side filtering and pagination
  const filteredLandmarks = useMemo(() => {
    if (!allLandmarks) return [];
    return allLandmarks.filter((lm: any) => {
      if (debouncedSearch && !lm.name.toLowerCase().includes(debouncedSearch.toLowerCase())) return false;
      if (categoryFilter !== "all" && lm.category !== categoryFilter) return false;
      if (lgaFilter !== "all" && lm.lga !== lgaFilter) return false;
      if (statusFilter === "active" && lm.isActive !== 1) return false;
      if (statusFilter === "inactive" && lm.isActive !== 0) return false;
      return true;
    });
  }, [allLandmarks, debouncedSearch, categoryFilter, lgaFilter, statusFilter]);

  const totalFiltered = filteredLandmarks.length;
  const totalPages = Math.ceil(totalFiltered / pageSize);
  const paginatedLandmarks = filteredLandmarks.slice(page * pageSize, (page + 1) * pageSize);

  // Stat cards
  const statCards = [
    { label: "Total", value: stats?.total ?? 0, icon: MapPin, color: "text-blue-400" },
    { label: "Active", value: stats?.active ?? 0, icon: Eye, color: "text-green-400" },
    { label: "Inactive", value: (stats?.total ?? 0) - (stats?.active ?? 0), icon: EyeOff, color: "text-gray-400" },
  ];

  // Handlers
  const handleCreate = () => {
    if (!formData.name.trim()) { toast.error("Name is required"); return; }
    if (!formData.lat || !formData.lng) { toast.error("Latitude and longitude are required"); return; }
    createMutation.mutate({
      name: formData.name.trim(),
      lat: formData.lat,
      lng: formData.lng,
      lga: formData.lga,
      category: formData.category,
      address: formData.address.trim() || undefined,
      isActive: formData.isActive,
    });
  };

  const handleUpdate = () => {
    if (!editingLandmark) return;
    if (!formData.name.trim()) { toast.error("Name is required"); return; }
    updateMutation.mutate({
      id: editingLandmark.id,
      name: formData.name.trim(),
      lat: formData.lat,
      lng: formData.lng,
      lga: formData.lga,
      category: formData.category,
      address: formData.address.trim() || undefined,
      isActive: formData.isActive,
    });
  };

  const openEditDialog = (landmark: any) => {
    setEditingLandmark(landmark);
    setFormData({
      name: landmark.name,
      lat: String(landmark.lat),
      lng: String(landmark.lng),
      lga: landmark.lga,
      category: landmark.category,
      address: landmark.address || "",
      isActive: landmark.isActive,
    });
  };

  const openCreateDialog = () => {
    setFormData({ ...emptyForm });
    setShowCreateDialog(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Auth guard
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <MapPin className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Admin Access Required</h2>
            <p className="text-muted-foreground mb-6">Please sign in with an admin account.</p>
            <Button onClick={() => window.location.href = getLoginUrl()} className="bg-amber-600 hover:bg-amber-700 text-white">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Form fields component (shared between create and edit dialogs)
  const renderFormFields = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="lm-name">Name</Label>
        <Input
          id="lm-name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g. Noosa Springs Golf Club"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="lm-lat">Latitude</Label>
          <Input
            id="lm-lat"
            value={formData.lat}
            onChange={(e) => setFormData(prev => ({ ...prev, lat: e.target.value }))}
            placeholder="-26.398"
          />
        </div>
        <div>
          <Label htmlFor="lm-lng">Longitude</Label>
          <Input
            id="lm-lng"
            value={formData.lng}
            onChange={(e) => setFormData(prev => ({ ...prev, lng: e.target.value }))}
            placeholder="153.058"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="lm-lga">LGA</Label>
          <Select value={formData.lga} onValueChange={(v) => setFormData(prev => ({ ...prev, lga: v }))}>
            <SelectTrigger id="lm-lga">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LGA_OPTIONS.map(lga => (
                <SelectItem key={lga} value={lga}>{lga}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="lm-cat">Category</Label>
          <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v as CategoryValue }))}>
            <SelectTrigger id="lm-cat">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="lm-address">Address</Label>
        <Input
          id="lm-address"
          value={formData.address}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          placeholder="e.g. 1 Links Drive, Noosa Heads QLD 4567"
        />
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor="lm-active">Status</Label>
        <Select value={String(formData.isActive)} onValueChange={(v) => setFormData(prev => ({ ...prev, isActive: parseInt(v) }))}>
          <SelectTrigger id="lm-active" className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Active</SelectItem>
            <SelectItem value="0">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/admin")} className="gap-1">
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <img src={LOGO_IMG} alt="All Ways Transfers" className="h-10 w-auto" />
              <span className="text-lg font-bold hidden sm:inline">Landmarks</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={openCreateDialog}
              className="gap-1 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Landmark</span>
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
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {statCards.map((stat) => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color} opacity-60`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Category breakdown */}
        {stats?.byCategory && stats.byCategory.length > 0 && (
          <Card className="mb-6 border-border/50">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2">
                {stats.byCategory.map((cat: any) => {
                  const CatIcon = getCategoryIcon(cat.category);
                  return (
                    <Badge
                      key={cat.category}
                      variant="outline"
                      className={`${CATEGORY_STYLES[cat.category] || CATEGORY_STYLES.other} cursor-pointer`}
                      onClick={() => { setCategoryFilter(cat.category); setPage(0); }}
                    >
                      <CatIcon className="w-3 h-3 mr-1" />
                      {getCategoryLabel(cat.category)}: {cat.count}
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-6 border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search landmarks..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(0); }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={lgaFilter} onValueChange={(v) => { setLgaFilter(v); setPage(0); }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All LGAs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All LGAs</SelectItem>
                  {LGA_OPTIONS.map(lga => (
                    <SelectItem key={lga} value={lga}>{lga}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(searchQuery || categoryFilter !== "all" || lgaFilter !== "all" || statusFilter !== "all") && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{totalFiltered} result{totalFiltered !== 1 ? "s" : ""}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setSearchQuery(""); setCategoryFilter("all"); setLgaFilter("all"); setStatusFilter("all"); setPage(0); }}
                  className="text-xs h-7"
                >
                  Clear filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-border/50">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : paginatedLandmarks.length === 0 ? (
              <div className="text-center py-20">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                <p className="text-muted-foreground">No landmarks found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="hidden md:table-cell">LGA</TableHead>
                    <TableHead className="hidden lg:table-cell">Coordinates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLandmarks.map((lm: any) => {
                    const CatIcon = getCategoryIcon(lm.category);
                    return (
                      <TableRow key={lm.id} className={`${lm.isActive === 0 ? "opacity-50" : ""}`}>
                        <TableCell className="font-medium max-w-[250px]">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            <span className="truncate">{lm.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${CATEGORY_STYLES[lm.category] || CATEGORY_STYLES.other} text-xs`}>
                            <CatIcon className="w-3 h-3 mr-1" />
                            {getCategoryLabel(lm.category)}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{lm.lga}</TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground text-sm font-mono">
                          {Number(lm.lat).toFixed(3)}, {Number(lm.lng).toFixed(3)}
                        </TableCell>
                        <TableCell>
                          {lm.isActive === 1 ? (
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-xs">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200 text-xs">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(lm)}
                              className="h-8 w-8 p-0"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleMutation.mutate({ id: lm.id })}
                              className="h-8 w-8 p-0"
                              title={lm.isActive === 1 ? "Deactivate" : "Activate"}
                            >
                              {lm.isActive === 1 ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-green-500" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirmId(lm.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, totalFiltered)} of {totalFiltered}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm">
                    Page {page + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(p => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-500" />
              Add New Landmark
            </DialogTitle>
          </DialogHeader>
          {renderFormFields()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {createMutation.isPending ? "Creating..." : "Create Landmark"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingLandmark} onOpenChange={(open) => { if (!open) setEditingLandmark(null); }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-amber-500" />
              Edit Landmark
            </DialogTitle>
          </DialogHeader>
          {renderFormFields()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLandmark(null)}>Cancel</Button>
            <Button
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <Trash2 className="w-5 h-5" />
              Delete Landmark
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to permanently delete this landmark? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => { if (deleteConfirmId) deleteMutation.mutate({ id: deleteConfirmId }); }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
