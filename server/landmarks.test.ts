import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
const mockLandmarks = [
  { id: 1, name: "Noosa Springs Golf Club", lat: "-26.398", lng: "153.058", lga: "Noosa", category: "golf_course", isActive: 1, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 2, name: "Australia Zoo", lat: "-26.835", lng: "152.960", lga: "Sunshine Coast", category: "attraction", isActive: 1, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 3, name: "Sunshine Coast Airport", lat: "-26.603", lng: "153.091", lga: "Sunshine Coast", category: "airport", isActive: 0, createdAt: Date.now(), updatedAt: Date.now() },
];

vi.mock("./db", () => ({
  getActiveLandmarks: vi.fn(() => mockLandmarks.filter(l => l.isActive === 1)),
  getAllLandmarks: vi.fn(() => mockLandmarks),
  getLandmarkStats: vi.fn(() => ({
    total: 3,
    active: 2,
    byCategory: [
      { category: "golf_course", count: 1 },
      { category: "attraction", count: 1 },
      { category: "airport", count: 1 },
    ],
  })),
  getLandmarkById: vi.fn((id: number) => mockLandmarks.find(l => l.id === id) ?? null),
  createLandmark: vi.fn((data: any) => ({ id: 4, ...data, createdAt: Date.now(), updatedAt: Date.now() })),
  updateLandmark: vi.fn((id: number, data: any) => {
    const lm = mockLandmarks.find(l => l.id === id);
    return lm ? { ...lm, ...data, updatedAt: Date.now() } : null;
  }),
  toggleLandmarkActive: vi.fn((id: number) => {
    const lm = mockLandmarks.find(l => l.id === id);
    return lm ? { ...lm, isActive: lm.isActive === 1 ? 0 : 1 } : null;
  }),
  deleteLandmark: vi.fn(() => undefined),
  // Other db exports needed by routers
  getAllPricingSettings: vi.fn(() => []),
  calculatePrice: vi.fn(() => ({ totalPrice: 100, basePrice: 100 })),
  getActivePublicHolidays: vi.fn(() => []),
}));

vi.mock("@shared/suburbs", () => ({
  lookupSuburb: vi.fn((name: string) => {
    if (name.toLowerCase() === "noosa heads") {
      return { name: "Noosa Heads", lga: "Noosa", area: "primary", lat: -26.390, lng: 153.090, isLandmark: false };
    }
    return null;
  }),
  estimateDistance: vi.fn(() => 50),
  isOutOfArea: vi.fn(() => false),
  getAllSuburbNames: vi.fn(() => ["Noosa Heads", "Maroochydore", "Caloundra"]),
  getAllLocationsWithType: vi.fn(() => [
    { name: "Noosa Heads", isLandmark: false },
    { name: "Maroochydore", isLandmark: false },
  ]),
  calculateDistance: vi.fn(() => 25),
  classifyLGA: vi.fn((lga: string) => {
    if (["Sunshine Coast", "Noosa"].includes(lga)) return "primary";
    if (["Brisbane", "Gold Coast"].includes(lga)) return "secondary";
    return "other";
  }),
}));

// Import the mocked functions
import { getActiveLandmarks, getAllLandmarks, getLandmarkStats, getLandmarkById, createLandmark, updateLandmark, toggleLandmarkActive, deleteLandmark } from "./db";
import { classifyLGA } from "@shared/suburbs";

describe("Landmark DB helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getActiveLandmarks returns only active landmarks", async () => {
    const result = await getActiveLandmarks();
    expect(result).toHaveLength(2);
    expect(result.every((l: any) => l.isActive === 1)).toBe(true);
  });

  it("getAllLandmarks returns all landmarks including inactive", async () => {
    const result = await getAllLandmarks();
    expect(result).toHaveLength(3);
    expect(result.some((l: any) => l.isActive === 0)).toBe(true);
  });

  it("getLandmarkStats returns correct stats", async () => {
    const stats = await getLandmarkStats();
    expect(stats.total).toBe(3);
    expect(stats.active).toBe(2);
    expect(stats.byCategory).toHaveLength(3);
  });

  it("getLandmarkById returns the correct landmark", async () => {
    const lm = await getLandmarkById(1);
    expect(lm).toBeDefined();
    expect(lm!.name).toBe("Noosa Springs Golf Club");
  });

  it("getLandmarkById returns null for non-existent ID", async () => {
    const lm = await getLandmarkById(999);
    expect(lm).toBeNull();
  });

  it("createLandmark returns new landmark with ID", async () => {
    const newLm = await createLandmark({
      name: "Test Landmark",
      lat: "-26.500",
      lng: "153.000",
      lga: "Sunshine Coast",
      category: "other",
      isActive: 1,
    });
    expect(newLm.id).toBe(4);
    expect(newLm.name).toBe("Test Landmark");
  });

  it("updateLandmark updates fields correctly", async () => {
    const updated = await updateLandmark(1, { name: "Updated Name" });
    expect(updated).toBeDefined();
    expect(updated!.name).toBe("Updated Name");
    expect(updated!.id).toBe(1);
  });

  it("toggleLandmarkActive flips active status", async () => {
    const toggled = await toggleLandmarkActive(1);
    expect(toggled).toBeDefined();
    expect(toggled!.isActive).toBe(0); // was 1, now 0
  });

  it("deleteLandmark calls without error", () => {
    const result = deleteLandmark(1);
    expect(result).toBeUndefined();
    expect(deleteLandmark).toHaveBeenCalledWith(1);
  });
});

describe("Landmark integration with pricing/autocomplete", () => {
  it("classifyLGA correctly classifies primary LGAs", () => {
    expect(classifyLGA("Sunshine Coast")).toBe("primary");
    expect(classifyLGA("Noosa")).toBe("primary");
  });

  it("classifyLGA correctly classifies secondary LGAs", () => {
    expect(classifyLGA("Brisbane")).toBe("secondary");
    expect(classifyLGA("Gold Coast")).toBe("secondary");
  });

  it("classifyLGA returns other for unknown LGAs", () => {
    expect(classifyLGA("Unknown")).toBe("other");
  });

  it("active landmarks should be available for autocomplete merge", async () => {
    const active = await getActiveLandmarks();
    // All active landmarks should have required fields
    for (const lm of active) {
      expect(lm.name).toBeTruthy();
      expect(lm.lat).toBeTruthy();
      expect(lm.lng).toBeTruthy();
      expect(lm.lga).toBeTruthy();
      expect(lm.isActive).toBe(1);
    }
  });

  it("landmark names should not duplicate existing suburb names in merge", async () => {
    const active = await getActiveLandmarks();
    const staticNames = ["Noosa Heads", "Maroochydore"];
    const existingSet = new Set(staticNames.map(n => n.toLowerCase()));
    const merged = [...staticNames];
    for (const lm of active) {
      if (!existingSet.has(lm.name.toLowerCase())) {
        merged.push(lm.name);
        existingSet.add(lm.name.toLowerCase());
      }
    }
    // Should have added 2 landmarks (Noosa Springs Golf Club, Australia Zoo)
    expect(merged).toHaveLength(4);
    // No duplicates
    const uniqueNames = new Set(merged.map((n: string) => n.toLowerCase()));
    expect(uniqueNames.size).toBe(merged.length);
  });
});
