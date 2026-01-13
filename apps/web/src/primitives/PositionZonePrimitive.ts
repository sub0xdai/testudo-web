import type {
  ISeriesPrimitiveBase,
  IPrimitivePaneView,
  IPrimitivePaneRenderer,
  SeriesAttachedParameter,
  PrimitivePaneViewZOrder,
  ISeriesApi,
  SeriesType,
  Time,
} from "lightweight-charts";
import type { CanvasRenderingTarget2D } from "fancy-canvas";

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

  constructor(style?: Partial<PositionZoneStyle>) {
    this._renderer = new PositionZoneRenderer(
      style ? { ...DEFAULT_STYLE, ...style } : DEFAULT_STYLE
    );
    this._paneView = new PositionZonePaneView(this._renderer);
    this._paneViews = [this._paneView];
  }

  /**
   * Called when the primitive is attached to a series
   */
  attached(param: SeriesAttachedParameter<Time>): void {
    this._requestUpdate = param.requestUpdate;
    this._renderer.setSeries(param.series);
  }

  /**
   * Called when the primitive is detached from the series
   */
  detached(): void {
    this._requestUpdate = null;
  }

  /**
   * Returns the pane views for rendering
   */
  paneViews(): readonly IPrimitivePaneView[] {
    return this._paneViews;
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
}
