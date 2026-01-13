import { describe, expect, test, beforeEach } from "bun:test";
import {
  PositionZonePrimitive,
  type PositionLevels,
  type PositionZoneStyle,
} from "./PositionZonePrimitive";

// =============================================================================
// Test Data Fixtures
// GEOM-07: Updated to include startTime for time-anchored zones
// =============================================================================

const longPosition: PositionLevels = {
  entry: 100.0,
  stopLoss: 95.0,
  takeProfit: 110.0,
  side: "long",
  startTime: 1704067200 as number, // 2024-01-01 00:00:00 UTC (as Time)
};

const shortPosition: PositionLevels = {
  entry: 100.0,
  stopLoss: 105.0,
  takeProfit: 90.0,
  side: "short",
  startTime: 1704067200 as number, // 2024-01-01 00:00:00 UTC (as Time)
};

const customStyle: Partial<PositionZoneStyle> = {
  profitColor: "rgba(0, 255, 0, 0.3)",
  lossColor: "rgba(255, 0, 0, 0.3)",
  lineWidth: 2,
};

// =============================================================================
// PositionZonePrimitive Constructor Tests
// =============================================================================

describe("PositionZonePrimitive", () => {
  describe("constructor", () => {
    test("creates instance with default style", () => {
      const primitive = new PositionZonePrimitive();
      expect(primitive).toBeDefined();
      expect(primitive.getLevels()).toBeNull();
    });

    test("creates instance with custom style", () => {
      const primitive = new PositionZonePrimitive(customStyle);
      expect(primitive).toBeDefined();
    });
  });

  // ===========================================================================
  // updateLevels() Tests
  // ===========================================================================

  describe("updateLevels()", () => {
    let primitive: PositionZonePrimitive;

    beforeEach(() => {
      primitive = new PositionZonePrimitive();
    });

    test("stores long position levels", () => {
      primitive.updateLevels(longPosition);
      const levels = primitive.getLevels();

      expect(levels).not.toBeNull();
      expect(levels?.entry).toBe(100.0);
      expect(levels?.stopLoss).toBe(95.0);
      expect(levels?.takeProfit).toBe(110.0);
      expect(levels?.side).toBe("long");
    });

    test("stores short position levels", () => {
      primitive.updateLevels(shortPosition);
      const levels = primitive.getLevels();

      expect(levels).not.toBeNull();
      expect(levels?.entry).toBe(100.0);
      expect(levels?.stopLoss).toBe(105.0);
      expect(levels?.takeProfit).toBe(90.0);
      expect(levels?.side).toBe("short");
    });

    test("clears levels when null passed", () => {
      primitive.updateLevels(longPosition);
      expect(primitive.getLevels()).not.toBeNull();

      primitive.updateLevels(null);
      expect(primitive.getLevels()).toBeNull();
    });

    test("overwrites previous levels", () => {
      primitive.updateLevels(longPosition);
      primitive.updateLevels(shortPosition);

      const levels = primitive.getLevels();
      expect(levels?.side).toBe("short");
      expect(levels?.stopLoss).toBe(105.0);
    });

    // GEOM-07: startTime tests
    test("stores startTime for time-anchored zones", () => {
      primitive.updateLevels(longPosition);
      const levels = primitive.getLevels();

      expect(levels?.startTime).toBe(1704067200);
    });

    test("handles different startTime values", () => {
      const positionWithDifferentTime: PositionLevels = {
        ...longPosition,
        startTime: 1704153600 as number, // 2024-01-02 00:00:00 UTC
      };
      primitive.updateLevels(positionWithDifferentTime);
      const levels = primitive.getLevels();

      expect(levels?.startTime).toBe(1704153600);
    });
  });

  // ===========================================================================
  // paneViews() Tests
  // ===========================================================================

  describe("paneViews()", () => {
    test("returns array with one pane view", () => {
      const primitive = new PositionZonePrimitive();
      const views = primitive.paneViews();

      expect(views).toBeDefined();
      expect(views.length).toBe(1);
    });

    test("returns same views regardless of levels", () => {
      const primitive = new PositionZonePrimitive();
      const viewsBefore = primitive.paneViews();

      primitive.updateLevels(longPosition);
      const viewsAfter = primitive.paneViews();

      expect(viewsBefore).toBe(viewsAfter);
    });
  });

  // ===========================================================================
  // priceAxisViews() Tests (V5-19)
  // ===========================================================================

  describe("priceAxisViews()", () => {
    let primitive: PositionZonePrimitive;

    beforeEach(() => {
      primitive = new PositionZonePrimitive();
    });

    test("returns empty array when no levels set", () => {
      const views = primitive.priceAxisViews();
      expect(views.length).toBe(0);
    });

    test("returns three axis views when levels set", () => {
      primitive.updateLevels(longPosition);
      const views = primitive.priceAxisViews();

      expect(views.length).toBe(3);
    });

    test("clears axis views when levels cleared", () => {
      primitive.updateLevels(longPosition);
      expect(primitive.priceAxisViews().length).toBe(3);

      primitive.updateLevels(null);
      expect(primitive.priceAxisViews().length).toBe(0);
    });
  });

  // ===========================================================================
  // hitTestZone() Tests (V5-17)
  // Note: These tests verify behavior when series is not attached
  // Full hit-testing requires a real chart which isn't available in unit tests
  // ===========================================================================

  describe("hitTestZone()", () => {
    test("returns null when no series attached", () => {
      const primitive = new PositionZonePrimitive();
      primitive.updateLevels(longPosition);

      // Without attached series, hit test returns null
      const result = primitive.hitTestZone(50);
      expect(result).toBeNull();
    });

    test("returns null when no levels set", () => {
      const primitive = new PositionZonePrimitive();
      const result = primitive.hitTestZone(50);
      expect(result).toBeNull();
    });
  });

  // ===========================================================================
  // isPointInZone() Tests (V5-17)
  // ===========================================================================

  describe("isPointInZone()", () => {
    test("returns false when no series attached", () => {
      const primitive = new PositionZonePrimitive();
      primitive.updateLevels(longPosition);

      expect(primitive.isPointInZone(50)).toBe(false);
    });

    test("returns false when no levels set", () => {
      const primitive = new PositionZonePrimitive();
      expect(primitive.isPointInZone(50)).toBe(false);
    });
  });

  // ===========================================================================
  // Position Calculation Tests
  // These verify the mathematical properties of positions
  // ===========================================================================

  describe("position calculations", () => {
    test("long position: entry > stopLoss, takeProfit > entry", () => {
      const primitive = new PositionZonePrimitive();
      primitive.updateLevels(longPosition);
      const levels = primitive.getLevels()!;

      expect(levels.entry).toBeGreaterThan(levels.stopLoss);
      expect(levels.takeProfit).toBeGreaterThan(levels.entry);
    });

    test("short position: entry < stopLoss, takeProfit < entry", () => {
      const primitive = new PositionZonePrimitive();
      primitive.updateLevels(shortPosition);
      const levels = primitive.getLevels()!;

      expect(levels.entry).toBeLessThan(levels.stopLoss);
      expect(levels.takeProfit).toBeLessThan(levels.entry);
    });

    test("risk/reward ratio calculation for long", () => {
      const primitive = new PositionZonePrimitive();
      primitive.updateLevels(longPosition);
      const levels = primitive.getLevels()!;

      const risk = levels.entry - levels.stopLoss; // 100 - 95 = 5
      const reward = levels.takeProfit - levels.entry; // 110 - 100 = 10
      const rr = reward / risk;

      expect(risk).toBe(5);
      expect(reward).toBe(10);
      expect(rr).toBe(2); // 2:1 R:R
    });

    test("risk/reward ratio calculation for short", () => {
      const primitive = new PositionZonePrimitive();
      primitive.updateLevels(shortPosition);
      const levels = primitive.getLevels()!;

      const risk = levels.stopLoss - levels.entry; // 105 - 100 = 5
      const reward = levels.entry - levels.takeProfit; // 100 - 90 = 10
      const rr = reward / risk;

      expect(risk).toBe(5);
      expect(reward).toBe(10);
      expect(rr).toBe(2); // 2:1 R:R
    });
  });

  // ===========================================================================
  // Lifecycle Tests
  // ===========================================================================

  describe("lifecycle", () => {
    test("detached clears internal state", () => {
      const primitive = new PositionZonePrimitive();
      primitive.updateLevels(longPosition);
      expect(primitive.priceAxisViews().length).toBe(3);

      // Simulate detach
      primitive.detached();
      expect(primitive.priceAxisViews().length).toBe(0);
    });
  });
});
