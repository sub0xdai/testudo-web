/**
 * Columnar Data View - Type-safe wrapper for dense payload structures
 *
 * Provides row.get('price') API while maintaining zero-copy access to underlying data.
 * Wire format: { columns: [...], data: [[...], [...]] }
 *
 * @example
 * const payload = { columns: ['price', 'quantity'], data: [['100', '1.5'], ['99', '2.0']] };
 * const view = new ColumnDataView<DepthRow>(payload);
 * for (const row of view.rows()) {
 *   console.log(row.get('price'), row.getNumber('quantity'));
 * }
 */

/**
 * Wire format for columnar data from API
 */
export interface ColumnPayload<T extends Record<string, unknown>> {
  columns: (keyof T)[];
  data: unknown[][];
  timestamp?: number;
  nonce?: number;
}

/**
 * Row accessor that provides typed column access
 */
export class RowView<T extends Record<string, unknown>> {
  constructor(
    private readonly columnMap: Map<keyof T, number>,
    private readonly row: unknown[]
  ) {}

  /**
   * Get value by column name - O(1) lookup
   */
  get<K extends keyof T>(column: K): T[K] | undefined {
    const index = this.columnMap.get(column);
    if (index === undefined) return undefined;
    return this.row[index] as T[K];
  }

  /**
   * Get value with default fallback
   */
  getOr<K extends keyof T>(column: K, defaultValue: T[K]): T[K] {
    return this.get(column) ?? defaultValue;
  }

  /**
   * Get numeric value (handles string-based decimals)
   */
  getNumber(column: keyof T): number {
    const val = this.get(column);
    if (typeof val === "number") return val;
    if (typeof val === "string") return parseFloat(val);
    return 0;
  }

  /**
   * Get string value
   */
  getString(column: keyof T): string {
    const val = this.get(column);
    if (typeof val === "string") return val;
    if (val != null) return String(val);
    return "";
  }

  /**
   * Get boolean value
   */
  getBoolean(column: keyof T): boolean {
    const val = this.get(column);
    return Boolean(val);
  }
}

/**
 * Error thrown when columnar payload is malformed
 */
export class ColumnPayloadError extends Error {
  constructor(message: string) {
    super(`ColumnPayload validation failed: ${message}`);
    this.name = "ColumnPayloadError";
  }
}

/**
 * DataView provides efficient iteration and access to columnar data
 */
export class ColumnDataView<T extends Record<string, unknown>> {
  private readonly columnMap: Map<keyof T, number>;

  constructor(private readonly payload: ColumnPayload<T>) {
    // Validate payload structure
    this.validatePayload(payload);

    // Build column index map once at construction (~0.1ms for 60 rows)
    this.columnMap = new Map();
    payload.columns.forEach((col, index) => {
      this.columnMap.set(col, index);
    });
  }

  /**
   * Validate payload structure on construction (fail fast)
   */
  private validatePayload(payload: ColumnPayload<T>): void {
    if (!payload) {
      throw new ColumnPayloadError("payload is null or undefined");
    }
    if (!Array.isArray(payload.columns)) {
      throw new ColumnPayloadError("columns must be an array");
    }
    if (!Array.isArray(payload.data)) {
      throw new ColumnPayloadError("data must be an array");
    }
    if (payload.columns.length === 0 && payload.data.length > 0) {
      throw new ColumnPayloadError("columns is empty but data is not");
    }

    // Check for duplicate column names
    const seen = new Set<keyof T>();
    for (const col of payload.columns) {
      if (seen.has(col)) {
        throw new ColumnPayloadError(`duplicate column name: ${String(col)}`);
      }
      seen.add(col);
    }

    // Check row lengths match column count (sample first 5 rows for performance)
    const expectedLen = payload.columns.length;
    const samplesToCheck = Math.min(payload.data.length, 5);
    for (let i = 0; i < samplesToCheck; i++) {
      const row = payload.data[i];
      if (!Array.isArray(row)) {
        throw new ColumnPayloadError(`row ${i} is not an array`);
      }
      if (row.length !== expectedLen) {
        throw new ColumnPayloadError(
          `row ${i} has ${row.length} columns, expected ${expectedLen}`
        );
      }
    }
  }

  /**
   * Get number of rows
   */
  get length(): number {
    return this.payload.data.length;
  }

  /**
   * Get timestamp if present
   */
  get timestamp(): number | undefined {
    return this.payload.timestamp;
  }

  /**
   * Get nonce if present
   */
  get nonce(): number | undefined {
    return this.payload.nonce;
  }

  /**
   * Check if empty
   */
  isEmpty(): boolean {
    return this.payload.data.length === 0;
  }

  /**
   * Get row view at index - O(1)
   */
  row(index: number): RowView<T> | undefined {
    const rowData = this.payload.data[index];
    if (!rowData) return undefined;
    return new RowView(this.columnMap, rowData);
  }

  /**
   * Iterate over all rows
   */
  *rows(): Generator<RowView<T>> {
    for (const rowData of this.payload.data) {
      yield new RowView(this.columnMap, rowData);
    }
  }

  /**
   * Map over rows (like Array.map)
   */
  map<U>(fn: (row: RowView<T>, index: number) => U): U[] {
    return this.payload.data.map((rowData, index) => {
      const row = new RowView<T>(this.columnMap, rowData);
      return fn(row, index);
    });
  }

  /**
   * Filter rows (like Array.filter)
   */
  filter(predicate: (row: RowView<T>, index: number) => boolean): RowView<T>[] {
    return this.payload.data
      .map((rowData, index) => ({ row: new RowView<T>(this.columnMap, rowData), index }))
      .filter(({ row, index }) => predicate(row, index))
      .map(({ row }) => row);
  }

  /**
   * Find first matching row
   */
  find(predicate: (row: RowView<T>) => boolean): RowView<T> | undefined {
    for (const rowData of this.payload.data) {
      const row = new RowView<T>(this.columnMap, rowData);
      if (predicate(row)) return row;
    }
    return undefined;
  }

  /**
   * Get entire column as array - useful for aggregations
   */
  column<K extends keyof T>(name: K): T[K][] {
    const index = this.columnMap.get(name);
    if (index === undefined) return [];
    return this.payload.data.map((row) => row[index] as T[K]);
  }

  /**
   * Sum numeric column
   */
  sumColumn(name: keyof T): number {
    const index = this.columnMap.get(name);
    if (index === undefined) return 0;
    return this.payload.data.reduce((sum, row) => {
      const val = row[index];
      if (typeof val === "number") return sum + val;
      if (typeof val === "string") return sum + parseFloat(val);
      return sum;
    }, 0);
  }

  /**
   * Get min value in numeric column
   */
  minColumn(name: keyof T): number {
    const index = this.columnMap.get(name);
    if (index === undefined) return Infinity;
    return this.payload.data.reduce((min, row) => {
      const val = row[index];
      const num = typeof val === "number" ? val : parseFloat(String(val));
      return isNaN(num) ? min : Math.min(min, num);
    }, Infinity);
  }

  /**
   * Get max value in numeric column
   */
  maxColumn(name: keyof T): number {
    const index = this.columnMap.get(name);
    if (index === undefined) return -Infinity;
    return this.payload.data.reduce((max, row) => {
      const val = row[index];
      const num = typeof val === "number" ? val : parseFloat(String(val));
      return isNaN(num) ? max : Math.max(max, num);
    }, -Infinity);
  }

  /**
   * Convert back to array of objects (for compatibility)
   */
  toObjects(): T[] {
    return this.payload.data.map((row) => {
      const obj: Record<string, unknown> = {};
      this.payload.columns.forEach((col, index) => {
        obj[col as string] = row[index];
      });
      return obj as T;
    });
  }

  /**
   * Create from existing array of objects (for migration)
   */
  static fromObjects<T extends Record<string, unknown>>(
    objects: T[],
    columns: (keyof T)[]
  ): ColumnDataView<T> {
    const data = objects.map((obj) => columns.map((col) => obj[col]));
    return new ColumnDataView({ columns, data });
  }
}

// =============================================================================
// Type Definitions for Testudo Data Structures
// =============================================================================

/**
 * Column schema for depth data (mirrors Rust DEPTH_COLUMNS constant)
 * Use this when constructing payloads to ensure consistency
 */
export const DEPTH_COLUMNS: readonly ["price", "quantity"] = ["price", "quantity"] as const;

/**
 * Depth row type for orderbook data
 * Note: Using type alias instead of interface to satisfy Record<string, unknown> constraint
 */
export type DepthRow = {
  price: string;
  quantity: string;
  [key: string]: unknown;
};

/**
 * Trade row type for trade data
 */
export type TradeRow = {
  trade_id: number;
  price: string;
  quantity: string;
  timestamp: number;
  is_buyer_maker: boolean;
  [key: string]: unknown;
};

// =============================================================================
// Columnar API Response Types
// =============================================================================

/**
 * Columnar orderbook response from v2 API
 * Note: nonce is at top level to avoid duplication on bids/asks
 */
export interface ColumnarOrderBookResponse {
  symbol: string;
  bids: ColumnPayload<DepthRow>;
  asks: ColumnPayload<DepthRow>;
  nonce?: number;
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create depth view from payload
 */
export function createDepthView(
  payload: ColumnPayload<DepthRow>
): ColumnDataView<DepthRow> {
  return new ColumnDataView(payload);
}

/**
 * Create trades view from payload
 */
export function createTradesView(
  payload: ColumnPayload<TradeRow>
): ColumnDataView<TradeRow> {
  return new ColumnDataView(payload);
}
