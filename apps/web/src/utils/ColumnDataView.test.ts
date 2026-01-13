import { describe, expect, test } from "bun:test";
import {
  ColumnDataView,
  RowView,
  ColumnPayload,
  ColumnPayloadError,
  DepthRow,
  TradeRow,
  DEPTH_COLUMNS,
  createDepthView,
  createTradesView,
} from "./ColumnDataView";

// =============================================================================
// Test Data Fixtures
// =============================================================================

// Use exported constant to ensure consistency with implementation
const TEST_DEPTH_COLUMNS = [...DEPTH_COLUMNS] as (keyof DepthRow)[];

const validDepthPayload: ColumnPayload<DepthRow> = {
  columns: TEST_DEPTH_COLUMNS,
  data: [
    ["100.50", "1.5"],
    ["100.25", "2.0"],
    ["100.00", "3.5"],
  ],
  timestamp: 1234567890,
  nonce: 42,
};

const emptyPayload: ColumnPayload<DepthRow> = {
  columns: TEST_DEPTH_COLUMNS,
  data: [],
  timestamp: 1234567890,
};

const tradePayload: ColumnPayload<TradeRow> = {
  columns: ["trade_id", "price", "quantity", "timestamp", "is_buyer_maker"],
  data: [
    [123, "100.50", "1.5", 1234567890, true],
    [124, "100.25", "2.0", 1234567891, false],
  ],
  timestamp: 1234567890,
};

// =============================================================================
// ColumnDataView Tests
// =============================================================================

describe("ColumnDataView", () => {
  describe("constructor", () => {
    test("builds column map from payload", () => {
      const view = new ColumnDataView(validDepthPayload);
      expect(view.length).toBe(3);
    });

    test("handles empty payload", () => {
      const view = new ColumnDataView(emptyPayload);
      expect(view.length).toBe(0);
      expect(view.isEmpty()).toBe(true);
    });

    test("preserves timestamp and nonce", () => {
      const view = new ColumnDataView(validDepthPayload);
      expect(view.timestamp).toBe(1234567890);
      expect(view.nonce).toBe(42);
    });
  });

  describe("length and isEmpty", () => {
    test("returns correct length for populated data", () => {
      const view = new ColumnDataView(validDepthPayload);
      expect(view.length).toBe(3);
      expect(view.isEmpty()).toBe(false);
    });

    test("returns zero for empty data", () => {
      const view = new ColumnDataView(emptyPayload);
      expect(view.length).toBe(0);
      expect(view.isEmpty()).toBe(true);
    });
  });

  describe("row()", () => {
    test("returns RowView for valid index", () => {
      const view = new ColumnDataView(validDepthPayload);
      const row = view.row(0);
      expect(row).toBeDefined();
      expect(row?.get("price")).toBe("100.50");
    });

    test("returns undefined for out-of-bounds index", () => {
      const view = new ColumnDataView(validDepthPayload);
      expect(view.row(-1)).toBeUndefined();
      expect(view.row(100)).toBeUndefined();
    });
  });

  describe("rows() generator", () => {
    test("iterates over all rows", () => {
      const view = new ColumnDataView(validDepthPayload);
      const prices: string[] = [];
      for (const row of view.rows()) {
        prices.push(row.getString("price"));
      }
      expect(prices).toEqual(["100.50", "100.25", "100.00"]);
    });

    test("handles empty data", () => {
      const view = new ColumnDataView(emptyPayload);
      const rows = [...view.rows()];
      expect(rows).toEqual([]);
    });
  });

  describe("map()", () => {
    test("transforms rows correctly", () => {
      const view = new ColumnDataView(validDepthPayload);
      const result = view.map((row) => row.getNumber("price"));
      expect(result).toEqual([100.5, 100.25, 100.0]);
    });

    test("passes index to callback", () => {
      const view = new ColumnDataView(validDepthPayload);
      const result = view.map((_, index) => index);
      expect(result).toEqual([0, 1, 2]);
    });

    test("returns empty array for empty data", () => {
      const view = new ColumnDataView(emptyPayload);
      const result = view.map((row) => row.get("price"));
      expect(result).toEqual([]);
    });
  });

  describe("filter()", () => {
    test("filters rows based on predicate", () => {
      const view = new ColumnDataView(validDepthPayload);
      // quantity values: 1.5, 2.0, 3.5 - only 3.5 is > 2
      const result = view.filter((row) => row.getNumber("quantity") > 2);
      expect(result.length).toBe(1);
      expect(result[0].get("price")).toBe("100.00");
    });

    test("returns empty array when no matches", () => {
      const view = new ColumnDataView(validDepthPayload);
      const result = view.filter((row) => row.getNumber("quantity") > 100);
      expect(result).toEqual([]);
    });
  });

  describe("find()", () => {
    test("finds first matching row", () => {
      const view = new ColumnDataView(validDepthPayload);
      // quantity values: 1.5, 2.0, 3.5 - first > 2 is 3.5 at index 2
      const row = view.find((r) => r.getNumber("quantity") > 2);
      expect(row?.get("price")).toBe("100.00");
    });

    test("returns undefined when no match", () => {
      const view = new ColumnDataView(validDepthPayload);
      const row = view.find((r) => r.getNumber("quantity") > 100);
      expect(row).toBeUndefined();
    });
  });

  describe("column()", () => {
    test("extracts column values", () => {
      const view = new ColumnDataView(validDepthPayload);
      const prices = view.column("price");
      expect(prices).toEqual(["100.50", "100.25", "100.00"]);
    });

    test("returns empty array for unknown column", () => {
      const view = new ColumnDataView(validDepthPayload);
      const unknown = view.column("unknown" as keyof DepthRow);
      expect(unknown).toEqual([]);
    });
  });

  describe("sumColumn()", () => {
    test("sums string numeric values", () => {
      const view = new ColumnDataView(validDepthPayload);
      const total = view.sumColumn("quantity");
      expect(total).toBe(7.0); // 1.5 + 2.0 + 3.5
    });

    test("returns 0 for empty data", () => {
      const view = new ColumnDataView(emptyPayload);
      expect(view.sumColumn("quantity")).toBe(0);
    });

    test("returns 0 for unknown column", () => {
      const view = new ColumnDataView(validDepthPayload);
      expect(view.sumColumn("unknown" as keyof DepthRow)).toBe(0);
    });
  });

  describe("minColumn()", () => {
    test("finds minimum value", () => {
      const view = new ColumnDataView(validDepthPayload);
      expect(view.minColumn("price")).toBe(100.0);
      expect(view.minColumn("quantity")).toBe(1.5);
    });

    test("returns Infinity for empty data", () => {
      const view = new ColumnDataView(emptyPayload);
      expect(view.minColumn("price")).toBe(Infinity);
    });
  });

  describe("maxColumn()", () => {
    test("finds maximum value", () => {
      const view = new ColumnDataView(validDepthPayload);
      expect(view.maxColumn("price")).toBe(100.5);
      expect(view.maxColumn("quantity")).toBe(3.5);
    });

    test("returns -Infinity for empty data", () => {
      const view = new ColumnDataView(emptyPayload);
      expect(view.maxColumn("price")).toBe(-Infinity);
    });
  });

  describe("toObjects()", () => {
    test("converts to array of objects", () => {
      const view = new ColumnDataView(validDepthPayload);
      const objects = view.toObjects();
      expect(objects).toEqual([
        { price: "100.50", quantity: "1.5" },
        { price: "100.25", quantity: "2.0" },
        { price: "100.00", quantity: "3.5" },
      ]);
    });

    test("returns empty array for empty data", () => {
      const view = new ColumnDataView(emptyPayload);
      expect(view.toObjects()).toEqual([]);
    });
  });

  describe("fromObjects()", () => {
    test("creates view from objects", () => {
      const objects = [
        { price: "100.50", quantity: "1.5" },
        { price: "100.25", quantity: "2.0" },
      ];
      const view = ColumnDataView.fromObjects(objects, TEST_DEPTH_COLUMNS);
      expect(view.length).toBe(2);
      expect(view.row(0)?.get("price")).toBe("100.50");
    });

    test("handles empty array", () => {
      const view = ColumnDataView.fromObjects<DepthRow>([], TEST_DEPTH_COLUMNS);
      expect(view.length).toBe(0);
    });
  });
});

// =============================================================================
// RowView Tests
// =============================================================================

describe("RowView", () => {
  const columnMap = new Map<keyof DepthRow, number>([
    ["price", 0],
    ["quantity", 1],
  ]);
  const rowData = ["100.50", "1.5"];

  describe("get()", () => {
    test("returns value for valid column", () => {
      const row = new RowView<DepthRow>(columnMap, rowData);
      expect(row.get("price")).toBe("100.50");
      expect(row.get("quantity")).toBe("1.5");
    });

    test("returns undefined for unknown column", () => {
      const row = new RowView<DepthRow>(columnMap, rowData);
      expect(row.get("unknown" as keyof DepthRow)).toBeUndefined();
    });
  });

  describe("getOr()", () => {
    test("returns value when present", () => {
      const row = new RowView<DepthRow>(columnMap, rowData);
      expect(row.getOr("price", "default")).toBe("100.50");
    });

    test("returns default when undefined", () => {
      const row = new RowView<DepthRow>(columnMap, rowData);
      expect(row.getOr("unknown" as keyof DepthRow, "default")).toBe("default");
    });
  });

  describe("getNumber()", () => {
    test("parses string to number", () => {
      const row = new RowView<DepthRow>(columnMap, rowData);
      expect(row.getNumber("price")).toBe(100.5);
    });

    test("returns number directly if already number", () => {
      const tradeColumnMap = new Map<keyof TradeRow, number>([
        ["trade_id", 0],
        ["price", 1],
      ]);
      const tradeData = [123, "100.50"];
      const row = new RowView<TradeRow>(tradeColumnMap, tradeData);
      expect(row.getNumber("trade_id")).toBe(123);
    });

    test("returns 0 for unknown column", () => {
      const row = new RowView<DepthRow>(columnMap, rowData);
      expect(row.getNumber("unknown" as keyof DepthRow)).toBe(0);
    });
  });

  describe("getString()", () => {
    test("returns string value", () => {
      const row = new RowView<DepthRow>(columnMap, rowData);
      expect(row.getString("price")).toBe("100.50");
    });

    test("converts number to string", () => {
      const tradeColumnMap = new Map<keyof TradeRow, number>([
        ["trade_id", 0],
      ]);
      const tradeData = [123];
      const row = new RowView<TradeRow>(tradeColumnMap, tradeData);
      expect(row.getString("trade_id")).toBe("123");
    });

    test("returns empty string for unknown column", () => {
      const row = new RowView<DepthRow>(columnMap, rowData);
      expect(row.getString("unknown" as keyof DepthRow)).toBe("");
    });
  });

  describe("getBoolean()", () => {
    test("returns boolean for truthy value", () => {
      const tradeColumnMap = new Map<keyof TradeRow, number>([
        ["is_buyer_maker", 0],
      ]);
      const tradeData = [true];
      const row = new RowView<TradeRow>(tradeColumnMap, tradeData);
      expect(row.getBoolean("is_buyer_maker")).toBe(true);
    });

    test("returns false for unknown column", () => {
      const row = new RowView<DepthRow>(columnMap, rowData);
      expect(row.getBoolean("unknown" as keyof DepthRow)).toBe(false);
    });
  });
});

// =============================================================================
// Factory Function Tests
// =============================================================================

describe("Factory Functions", () => {
  describe("createDepthView()", () => {
    test("creates view with correct type", () => {
      const view = createDepthView(validDepthPayload);
      expect(view.length).toBe(3);
      expect(view.row(0)?.get("price")).toBe("100.50");
    });
  });

  describe("createTradesView()", () => {
    test("creates view with correct type", () => {
      const view = createTradesView(tradePayload);
      expect(view.length).toBe(2);
      expect(view.row(0)?.getNumber("trade_id")).toBe(123);
      expect(view.row(0)?.getBoolean("is_buyer_maker")).toBe(true);
    });
  });
});

// =============================================================================
// Payload Validation Tests
// =============================================================================

describe("Payload Validation", () => {
  test("throws on null payload", () => {
    expect(() => new ColumnDataView(null as unknown as ColumnPayload<DepthRow>)).toThrow(
      ColumnPayloadError
    );
  });

  test("throws on undefined payload", () => {
    expect(
      () => new ColumnDataView(undefined as unknown as ColumnPayload<DepthRow>)
    ).toThrow(ColumnPayloadError);
  });

  test("throws when columns is not an array", () => {
    const payload = {
      columns: "not-an-array",
      data: [],
    } as unknown as ColumnPayload<DepthRow>;
    expect(() => new ColumnDataView(payload)).toThrow("columns must be an array");
  });

  test("throws when data is not an array", () => {
    const payload = {
      columns: ["price", "quantity"],
      data: "not-an-array",
    } as unknown as ColumnPayload<DepthRow>;
    expect(() => new ColumnDataView(payload)).toThrow("data must be an array");
  });

  test("throws when columns is empty but data is not", () => {
    const payload = {
      columns: [],
      data: [["100", "1"]],
    } as unknown as ColumnPayload<DepthRow>;
    expect(() => new ColumnDataView(payload)).toThrow("columns is empty but data is not");
  });

  test("throws on duplicate column names", () => {
    const payload = {
      columns: ["price", "price"],
      data: [["100", "200"]],
    } as unknown as ColumnPayload<DepthRow>;
    expect(() => new ColumnDataView(payload)).toThrow("duplicate column name: price");
  });

  test("throws when row is not an array", () => {
    const payload = {
      columns: TEST_DEPTH_COLUMNS,
      data: ["not-an-array"],
    } as unknown as ColumnPayload<DepthRow>;
    expect(() => new ColumnDataView(payload)).toThrow("row 0 is not an array");
  });

  test("throws when row has wrong column count", () => {
    const payload: ColumnPayload<DepthRow> = {
      columns: TEST_DEPTH_COLUMNS,
      data: [["100"]], // Only 1 column, expected 2
    };
    expect(() => new ColumnDataView(payload)).toThrow(
      "row 0 has 1 columns, expected 2"
    );
  });

  test("validates only first 5 rows for performance", () => {
    // Create payload where row 6 has wrong length - should not throw
    const data = Array.from({ length: 10 }, (_, i) =>
      i === 6 ? ["100"] : ["100", "1"]
    );
    const payload: ColumnPayload<DepthRow> = {
      columns: TEST_DEPTH_COLUMNS,
      data,
    };
    // Should NOT throw because we only validate first 5 rows
    const view = new ColumnDataView(payload);
    expect(view.length).toBe(10);
  });

  test("accepts valid empty payload", () => {
    const payload: ColumnPayload<DepthRow> = {
      columns: TEST_DEPTH_COLUMNS,
      data: [],
    };
    const view = new ColumnDataView(payload);
    expect(view.length).toBe(0);
  });
});

// =============================================================================
// Edge Case Tests
// =============================================================================

describe("Edge Cases", () => {
  test("handles NaN in numeric columns", () => {
    const payload: ColumnPayload<DepthRow> = {
      columns: TEST_DEPTH_COLUMNS,
      data: [["not-a-number", "invalid"]],
    };
    const view = new ColumnDataView(payload);
    expect(view.row(0)?.getNumber("price")).toBeNaN();
  });

  test("handles null/undefined values in rows", () => {
    const payload: ColumnPayload<DepthRow> = {
      columns: TEST_DEPTH_COLUMNS,
      data: [[null, undefined] as unknown as string[]],
    };
    const view = new ColumnDataView(payload);
    expect(view.row(0)?.get("price")).toBeNull();
    expect(view.row(0)?.get("quantity")).toBeUndefined();
    expect(view.row(0)?.getNumber("price")).toBe(0); // parseFloat(null) = NaN, fallback 0
  });

  test("handles very large datasets", () => {
    const largeData = Array.from({ length: 10000 }, (_, i) => [
      String(100 + i * 0.01),
      String(i),
    ]);
    const payload: ColumnPayload<DepthRow> = {
      columns: TEST_DEPTH_COLUMNS,
      data: largeData,
    };
    const view = new ColumnDataView(payload);
    expect(view.length).toBe(10000);
    expect(view.sumColumn("quantity")).toBe((10000 * 9999) / 2); // Sum of 0..9999
  });

  test("handles single row", () => {
    const payload: ColumnPayload<DepthRow> = {
      columns: TEST_DEPTH_COLUMNS,
      data: [["100.00", "1.0"]],
    };
    const view = new ColumnDataView(payload);
    expect(view.length).toBe(1);
    expect(view.sumColumn("quantity")).toBe(1.0);
    expect(view.minColumn("price")).toBe(100.0);
    expect(view.maxColumn("price")).toBe(100.0);
  });
});

// =============================================================================
// Integration Tests (Rust-to-TypeScript wire format)
// =============================================================================

describe("Wire Format Integration", () => {
  test("parses Rust-serialized DepthColumnStore correctly", () => {
    // This simulates actual JSON from the Rust backend
    const wirePayload = `{
      "columns": ["price", "quantity"],
      "data": [["50123.45", "1.234"], ["50122.00", "0.567"]],
      "timestamp": 1705123456789,
      "nonce": 42
    }`;
    const payload = JSON.parse(wirePayload) as ColumnPayload<DepthRow>;
    const view = new ColumnDataView(payload);

    expect(view.length).toBe(2);
    expect(view.timestamp).toBe(1705123456789);
    expect(view.nonce).toBe(42);
    expect(view.row(0)?.getNumber("price")).toBe(50123.45);
    expect(view.row(0)?.getNumber("quantity")).toBe(1.234);
  });

  test("parses Rust-serialized ColumnarOrderBook correctly", () => {
    // This simulates actual JSON from v2 API endpoint
    const wireResponse = `{
      "symbol": "SOLUSDT",
      "bids": {
        "columns": ["price", "quantity"],
        "data": [["180.50", "100.5"], ["180.25", "50.0"]],
        "timestamp": 1705123456789
      },
      "asks": {
        "columns": ["price", "quantity"],
        "data": [["180.75", "25.0"], ["181.00", "75.0"]],
        "timestamp": 1705123456789
      },
      "nonce": 12345
    }`;
    const response = JSON.parse(wireResponse);

    // Verify structure matches expected format
    expect(response.symbol).toBe("SOLUSDT");
    expect(response.nonce).toBe(12345);

    // Parse bids and asks
    const bidsView = new ColumnDataView<DepthRow>(response.bids);
    const asksView = new ColumnDataView<DepthRow>(response.asks);

    expect(bidsView.length).toBe(2);
    expect(asksView.length).toBe(2);
    expect(bidsView.sumColumn("quantity")).toBe(150.5);
    expect(asksView.sumColumn("quantity")).toBe(100.0);
  });

  test("DEPTH_COLUMNS constant matches Rust schema", () => {
    // Verify the exported constant matches expected schema
    expect(DEPTH_COLUMNS).toEqual(["price", "quantity"]);
    expect(DEPTH_COLUMNS.length).toBe(2);
  });
});
