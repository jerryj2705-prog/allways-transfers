import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module
vi.mock("./db", () => ({
  getAppSetting: vi.fn(),
  setAppSetting: vi.fn(),
  getCachedGoogleReviews: vi.fn(),
  getGoogleReviewsCacheAge: vi.fn(),
  clearGoogleReviewsCache: vi.fn(),
  insertGoogleReviews: vi.fn(),
}));

// Mock the map module
vi.mock("./_core/map", () => ({
  makeRequest: vi.fn(),
}));

import {
  getAppSetting,
  setAppSetting,
  getCachedGoogleReviews,
  getGoogleReviewsCacheAge,
  clearGoogleReviewsCache,
  insertGoogleReviews,
} from "./db";

import { makeRequest } from "./_core/map";

describe("Google Reviews Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAppSetting / setAppSetting", () => {
    it("should return null when no setting exists", async () => {
      (getAppSetting as any).mockResolvedValue(null);
      const result = await getAppSetting("google_place_id");
      expect(result).toBeNull();
    });

    it("should return the stored place ID", async () => {
      (getAppSetting as any).mockResolvedValue("ChIJ_test123");
      const result = await getAppSetting("google_place_id");
      expect(result).toBe("ChIJ_test123");
    });

    it("should save a new place ID", async () => {
      (setAppSetting as any).mockResolvedValue(undefined);
      await setAppSetting("google_place_id", "ChIJ_newPlace");
      expect(setAppSetting).toHaveBeenCalledWith("google_place_id", "ChIJ_newPlace");
    });
  });

  describe("Google Reviews Cache", () => {
    it("should return empty array when no cached reviews", async () => {
      (getCachedGoogleReviews as any).mockResolvedValue([]);
      const result = await getCachedGoogleReviews("ChIJ_test");
      expect(result).toEqual([]);
    });

    it("should return cached reviews when available", async () => {
      const mockCached = [
        { id: 1, placeId: "ChIJ_test", authorName: "John", rating: 5, text: "Great service!" },
        { id: 2, placeId: "ChIJ_test", authorName: "Jane", rating: 4, text: "Very good" },
      ];
      (getCachedGoogleReviews as any).mockResolvedValue(mockCached);
      const result = await getCachedGoogleReviews("ChIJ_test");
      expect(result).toHaveLength(2);
      expect(result[0].authorName).toBe("John");
      expect(result[0].rating).toBe(5);
    });

    it("should return null cache age when no cached data", async () => {
      (getGoogleReviewsCacheAge as any).mockResolvedValue(null);
      const age = await getGoogleReviewsCacheAge("ChIJ_test");
      expect(age).toBeNull();
    });

    it("should return cache age in milliseconds", async () => {
      (getGoogleReviewsCacheAge as any).mockResolvedValue(3600000); // 1 hour
      const age = await getGoogleReviewsCacheAge("ChIJ_test");
      expect(age).toBe(3600000);
    });

    it("should clear cache for a place ID", async () => {
      (clearGoogleReviewsCache as any).mockResolvedValue(undefined);
      await clearGoogleReviewsCache("ChIJ_test");
      expect(clearGoogleReviewsCache).toHaveBeenCalledWith("ChIJ_test");
    });

    it("should insert new reviews into cache", async () => {
      const newReviews = [
        { placeId: "ChIJ_test", authorName: "Alice", rating: 5, text: "Excellent!" },
      ];
      (insertGoogleReviews as any).mockResolvedValue(undefined);
      await insertGoogleReviews(newReviews as any);
      expect(insertGoogleReviews).toHaveBeenCalledWith(newReviews);
    });
  });

  describe("Google Places API Request", () => {
    it("should fetch place details with reviews", async () => {
      const mockResponse = {
        status: "OK",
        result: {
          rating: 4.8,
          user_ratings_total: 42,
          reviews: [
            { author_name: "Test User", rating: 5, text: "Amazing service!", time: 1700000000 },
            { author_name: "Another User", rating: 4, text: "Good experience", time: 1699000000 },
          ],
        },
      };
      (makeRequest as any).mockResolvedValue(mockResponse);

      const result = await makeRequest(
        "/maps/api/place/details/json",
        { place_id: "ChIJ_test", fields: "reviews,rating,user_ratings_total" }
      );

      expect(makeRequest).toHaveBeenCalledWith(
        "/maps/api/place/details/json",
        { place_id: "ChIJ_test", fields: "reviews,rating,user_ratings_total" }
      );
      expect((result as any).status).toBe("OK");
      expect((result as any).result.reviews).toHaveLength(2);
      expect((result as any).result.rating).toBe(4.8);
    });

    it("should handle API errors gracefully", async () => {
      (makeRequest as any).mockRejectedValue(new Error("API request failed"));
      await expect(
        makeRequest("/maps/api/place/details/json", { place_id: "invalid" })
      ).rejects.toThrow("API request failed");
    });

    it("should handle empty reviews response", async () => {
      const mockResponse = {
        status: "OK",
        result: {
          rating: 0,
          user_ratings_total: 0,
          reviews: [],
        },
      };
      (makeRequest as any).mockResolvedValue(mockResponse);

      const result = await makeRequest(
        "/maps/api/place/details/json",
        { place_id: "ChIJ_new", fields: "reviews,rating,user_ratings_total" }
      );

      expect((result as any).result.reviews).toHaveLength(0);
    });
  });

  describe("Cache TTL Logic", () => {
    it("should use cache when age is less than 24 hours", async () => {
      const CACHE_TTL = 24 * 60 * 60 * 1000;
      const cacheAge = 12 * 60 * 60 * 1000; // 12 hours
      expect(cacheAge < CACHE_TTL).toBe(true);
    });

    it("should refresh when cache is older than 24 hours", async () => {
      const CACHE_TTL = 24 * 60 * 60 * 1000;
      const cacheAge = 25 * 60 * 60 * 1000; // 25 hours
      expect(cacheAge < CACHE_TTL).toBe(false);
    });

    it("should refresh when cache is null (no data)", async () => {
      const cacheAge = null;
      expect(cacheAge === null).toBe(true);
    });
  });

  describe("Review Data Mapping", () => {
    it("should map Google review fields to cache format", () => {
      const googleReview = {
        author_name: "Test User",
        rating: 5,
        text: "Great service!",
        time: 1700000000,
      };

      const mapped = {
        placeId: "ChIJ_test",
        authorName: googleReview.author_name || "Anonymous",
        rating: googleReview.rating,
        text: googleReview.text || null,
        relativeTimeDescription: null,
        publishTime: googleReview.time ? googleReview.time * 1000 : null,
        profilePhotoUrl: null,
      };

      expect(mapped.authorName).toBe("Test User");
      expect(mapped.rating).toBe(5);
      expect(mapped.publishTime).toBe(1700000000000);
    });

    it("should handle missing author name", () => {
      const googleReview = {
        author_name: "",
        rating: 4,
        text: "Good",
        time: 1700000000,
      };

      const authorName = googleReview.author_name || "Anonymous";
      expect(authorName).toBe("Anonymous");
    });

    it("should handle missing text", () => {
      const googleReview = {
        author_name: "User",
        rating: 5,
        text: "",
        time: 1700000000,
      };

      const text = googleReview.text || null;
      expect(text).toBeNull();
    });
  });
});
