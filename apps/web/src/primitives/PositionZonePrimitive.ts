import type {
  ISeriesPrimitiveBase,
  IPrimitivePaneView,
  IPrimitivePaneRenderer,
  ISeriesPrimitiveAxisView,
  SeriesAttachedParameter,
  PrimitivePaneViewZOrder,
  ISeriesApi,
  SeriesType,
  Time,
} from "lightweight-charts";
import type { CanvasRenderingTarget2D } from "fancy-canvas";

/**
 * V5-17: Hit test result indicating what part of the position zone was clicked
 */
export type HitTestResult =
  | "profitZone"
  | "lossZone"
  | "entryLine"
  | "slLine"
  | "tpLine"
  | null;

/**
 * Position levels for drawing entry, stop loss, and take profit zones
 */
export interface PositionLevels {
  entry: number;
  stopLoss: number;
  takeProfit: number;
  side: "long" | "short";
}

/**
 * Style configuration for the position zones
 */
export interface PositionZoneStyle {
  profitColor: string;
  lossColor: string;
  entryLineColor: string;
  slLineColor: string;
  tpLineColor: string;
  lineWidth: number;
}

const DEFAULT_STYLE: PositionZoneStyle = {
  profitColor: "rgba(52, 203, 136, 0.2)", // Green with transparency
  lossColor: "rgba(255, 97, 92, 0.2)", // Red with transparency
  entryLineColor: "#ffffff",
  slLineColor: "#ff615c",
  tpLineColor: "#34cb88",
  lineWidth: 1,
};

/**
 * Renderer that draws position zones on the canvas
 * V5-06: Canvas drawing logic for profit/loss zones
 */
class PositionZoneRenderer implements IPrimitivePaneRenderer {
  private _levels: PositionLevels | null = null;
  private _style: PositionZoneStyle;
  private _series: ISeriesApi<SeriesType, Time> | null = null;

  constructor(style: PositionZoneStyle = DEFAULT_STYLE) {
    this._style = style;
  }

  setLevels(levels: PositionLevels | null): void {
    this._levels = levels;
  }

  setSeries(series: ISeriesApi<SeriesType, Time>): void {
    this._series = series;
  }

  setStyle(style: Partial<PositionZoneStyle>): void {
    this._style = { ...this._style, ...style };
  }

  draw(target: CanvasRenderingTarget2D): void {
    if (!this._levels || !this._series) return;

    const { entry, stopLoss, takeProfit } = this._levels;

    // Convert prices to Y coordinates using series API
    const entryY = this._series.priceToCoordinate(entry);
    const slY = this._series.priceToCoordinate(stopLoss);
    const tpY = this._series.priceToCoordinate(takeProfit);

    if (entryY === null || slY === null || tpY === null) return;

    target.useBitmapCoordinateSpace((scope) => {
      const ctx = scope.context;
      const hRatio = scope.horizontalPixelRatio;
      const vRatio = scope.verticalPixelRatio;

      // Get canvas width from scope
      const width = scope.bitmapSize.width;

      // Scale Y coordinates for high-DPI displays
      const scaledEntryY = entryY * vRatio;
      const scaledSlY = slY * vRatio;
      const scaledTpY = tpY * vRatio;

      // Draw profit zone (entry to TP)
      ctx.fillStyle = this._style.profitColor;
      const profitTop = Math.min(scaledEntryY, scaledTpY);
      const profitHeight = Math.abs(scaledTpY - scaledEntryY);
      ctx.fillRect(0, profitTop, width, profitHeight);

      // Draw loss zone (entry to SL)
      ctx.fillStyle = this._style.lossColor;
      const lossTop = Math.min(scaledEntryY, scaledSlY);
      const lossHeight = Math.abs(scaledSlY - scaledEntryY);
      ctx.fillRect(0, lossTop, width, lossHeight);

      // Draw entry line (dashed)
      ctx.strokeStyle = this._style.entryLineColor;
      ctx.lineWidth = this._style.lineWidth * hRatio;
      ctx.setLineDash([5 * hRatio, 5 * hRatio]);
      ctx.beginPath();
      ctx.moveTo(0, scaledEntryY);
      ctx.lineTo(width, scaledEntryY);
      ctx.stroke();

      // Draw SL line (solid)
      ctx.strokeStyle = this._style.slLineColor;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(0, scaledSlY);
      ctx.lineTo(width, scaledSlY);
      ctx.stroke();

      // Draw TP line (solid)
      ctx.strokeStyle = this._style.tpLineColor;
      ctx.beginPath();
      ctx.moveTo(0, scaledTpY);
      ctx.lineTo(width, scaledTpY);
      ctx.stroke();
    });
  }
}

/**
 * Pane view wrapper for the renderer
 */
class PositionZonePaneView implements IPrimitivePaneView {
  private _renderer: PositionZoneRenderer;

  constructor(renderer: PositionZoneRenderer) {
    this._renderer = renderer;
  }

  zOrder(): PrimitivePaneViewZOrder {
    // Render below candlesticks but above grid
    return "bottom";
  }

  renderer(): IPrimitivePaneRenderer | null {
    return this._renderer;
  }
}

/**
 * V5-19: Price axis label view for entry/SL/TP prices
 * Shows colored labels on the right price axis
 */
class PositionPriceAxisView implements ISeriesPrimitiveAxisView {
  private _price: number;
  private _text: string;
  private _textColor: string;
  private _backColor: string;
  private _series: ISeriesApi<SeriesType, Time> | null = null;

  constructor(
    price: number,
    label: string,
    textColor: string,
    backColor: string
  ) {
    this._price = price;
    this._text = `${label} ${price.toFixed(2)}`;
    this._textColor = textColor;
    this._backColor = backColor;
  }

  setSeries(series: ISeriesApi<SeriesType, Time> | null): void {
    this._series = series;
  }

  setPrice(price: number, label: string): void {
    this._price = price;
    this._text = `${label} ${price.toFixed(2)}`;
  }

  coordinate(): number {
    if (!this._series) return -1;
    return this._series.priceToCoordinate(this._price) ?? -1;
  }

  text(): string {
    return this._text;
  }

  textColor(): string {
    return this._textColor;
  }

  backColor(): string {
    return this._backColor;
  }
}

/**
 * V5 Series Primitive for rendering position zones on the chart canvas
 * V5-05: Implements ISeriesPrimitiveBase interface
 *
 * This primitive renders:
 * - Profit zone (green area between entry and TP)
 * - Loss zone (red area between entry and SL)
 * - Entry line (dashed white)
 * - Stop loss line (solid red)
 * - Take profit line (solid green)
 *
 * The zones automatically pan and zoom with the chart because they're
 * rendered in canvas coordinates that get recalculated on each frame.
 */
export class PositionZonePrimitive
  implements ISeriesPrimitiveBase<SeriesAttachedParameter<Time>>
{
  private _renderer: PositionZoneRenderer;
  private _paneView: PositionZonePaneView;
  private _paneViews: readonly IPrimitivePaneView[];
  private _requestUpdate: (() => void) | null = null;
  private _levels: PositionLevels | null = null;
  private _series: ISeriesApi<SeriesType, Time> | null = null;
  // V5-19: Price axis labels
  private _entryAxisView: PositionPriceAxisView;
  private _slAxisView: PositionPriceAxisView;
  private _tpAxisView: PositionPriceAxisView;
  private _priceAxisViews: ISeriesPrimitiveAxisView[] = [];

  constructor(style?: Partial<PositionZoneStyle>) {
    const mergedStyle = style ? { ...DEFAULT_STYLE, ...style } : DEFAULT_STYLE;
    this._renderer = new PositionZoneRenderer(mergedStyle);
    this._paneView = new PositionZonePaneView(this._renderer);
    this._paneViews = [this._paneView];

    // V5-19: Initialize price axis views with placeholder values
    this._entryAxisView = new PositionPriceAxisView(0, "Entry", "#000000", mergedStyle.entryLineColor);
    this._slAxisView = new PositionPriceAxisView(0, "SL", "#000000", mergedStyle.slLineColor);
    this._tpAxisView = new PositionPriceAxisView(0, "TP", "#000000", mergedStyle.tpLineColor);
  }

  /**
   * Called when the primitive is attached to a series
   */
  attached(param: SeriesAttachedParameter<Time>): void {
    this._requestUpdate = param.requestUpdate;
    this._series = param.series;
    this._renderer.setSeries(param.series);
    // V5-19: Set series on axis views
    this._entryAxisView.setSeries(param.series);
    this._slAxisView.setSeries(param.series);
    this._tpAxisView.setSeries(param.series);
  }

  /**
   * Called when the primitive is detached from the series
   */
  detached(): void {
    this._requestUpdate = null;
    this._series = null;
    // V5-19: Clear series from axis views
    this._entryAxisView.setSeries(null);
    this._slAxisView.setSeries(null);
    this._tpAxisView.setSeries(null);
    this._priceAxisViews = [];
  }

  /**
   * Returns the pane views for rendering
   */
  paneViews(): readonly IPrimitivePaneView[] {
    return this._paneViews;
  }

  /**
   * V5-19: Returns price axis views for rendering labels on the price axis
   */
  priceAxisViews(): readonly ISeriesPrimitiveAxisView[] {
    return this._priceAxisViews;
  }

  /**
   * Called when the viewport changes (pan/zoom)
   * The renderer will recalculate coordinates on next draw
   */
  updateAllViews(): void {
    // No caching needed - we recalculate coordinates in draw()
  }

  /**
   * V5-08: Update position levels and trigger repaint
   * @param levels - New position levels, or null to hide
   */
  updateLevels(levels: PositionLevels | null): void {
    this._levels = levels;
    this._renderer.setLevels(levels);

    // V5-19: Update price axis views
    if (levels) {
      this._entryAxisView.setPrice(levels.entry, "Entry");
      this._slAxisView.setPrice(levels.stopLoss, "SL");
      this._tpAxisView.setPrice(levels.takeProfit, "TP");
      this._priceAxisViews = [this._entryAxisView, this._slAxisView, this._tpAxisView];
    } else {
      this._priceAxisViews = [];
    }

    this._requestUpdate?.();
  }

  /**
   * Get current position levels
   */
  getLevels(): PositionLevels | null {
    return this._levels;
  }

  /**
   * Update style options
   */
  setStyle(style: Partial<PositionZoneStyle>): void {
    this._renderer.setStyle(style);
    this._requestUpdate?.();
  }

  /**
   * V5-17: Hit test to determine what part of the position zone was clicked
   *
   * @param y - Y coordinate in pixels (from chart container top)
   * @returns What was hit: 'profitZone', 'lossZone', 'entryLine', 'slLine', 'tpLine', or null
   */
  hitTestZone(y: number): HitTestResult {
    if (!this._levels || !this._series) return null;

    const { entry, stopLoss, takeProfit } = this._levels;

    // Convert prices to Y coordinates
    const entryY = this._series.priceToCoordinate(entry);
    const slY = this._series.priceToCoordinate(stopLoss);
    const tpY = this._series.priceToCoordinate(takeProfit);

    if (entryY === null || slY === null || tpY === null) return null;

    // Line hit tolerance in pixels
    const lineTolerance = 4;

    // Check line hits first (higher priority)
    if (Math.abs(y - entryY) <= lineTolerance) return "entryLine";
    if (Math.abs(y - slY) <= lineTolerance) return "slLine";
    if (Math.abs(y - tpY) <= lineTolerance) return "tpLine";

    // Check zone hits
    const profitTop = Math.min(entryY, tpY);
    const profitBottom = Math.max(entryY, tpY);
    const lossTop = Math.min(entryY, slY);
    const lossBottom = Math.max(entryY, slY);

    if (y >= profitTop && y <= profitBottom) return "profitZone";
    if (y >= lossTop && y <= lossBottom) return "lossZone";

    return null;
  }

  /**
   * V5-17: Check if a point is within the position zone area (either profit or loss zone)
   *
   * @param y - Y coordinate in pixels (from chart container top)
   * @returns true if the point is within either zone
   */
  isPointInZone(y: number): boolean {
    return this.hitTestZone(y) !== null;
  }
}
