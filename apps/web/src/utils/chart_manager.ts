import {
  ColorType,
  createChart as createLightWeightChart,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  IPriceLine,
  LineStyle,
  LineWidth,
  UTCTimestamp,
  MouseEventParams,
  Time,
} from "lightweight-charts";

export interface PriceLineConfig {
  price: number;
  color: string;
  lineWidth?: LineWidth;
  lineStyle?: LineStyle;
  axisLabelVisible?: boolean;
  title?: string;
}

export type PriceLineId = 'entry' | 'stopLoss' | 'takeProfit';

export type ChartMouseEventHandler = (param: MouseEventParams<Time>) => void;

interface CandleData {
  timestamp: number | Date;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface PriceUpdate {
  open: number;
  high: number;
  low: number;
  close: number;
  /** Unix timestamp in SECONDS (not milliseconds) for lightweight-charts compatibility */
  time?: number;
  newCandleInitiated?: boolean;
}

export class ChartManager {
  private candleSeries: ISeriesApi<"Candlestick">;
  private lastUpdateTime: number = 0;
  private chart: IChartApi;
  private priceLines: Map<PriceLineId, IPriceLine> = new Map();

  constructor(
    ref: HTMLElement,
    initialData: CandleData[],
    layout: { background: string; color: string }
  ) {
    const chart = createLightWeightChart(ref, {
      autoSize: true,
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "#707070",
          width: 1,
          style: LineStyle.LargeDashed,
        },
        horzLine: {
          color: "#707070",
          width: 1,
          style: LineStyle.LargeDashed,
        },
      },
      rightPriceScale: {
        visible: true,
        ticksVisible: true,
        entireTextOnly: true,
        borderVisible: true,
        borderColor: "#555",
        textColor: "#fff",
      },
      grid: {
        horzLines: {
          visible: true,
          color: "#262626",
        },
        vertLines: {
          visible: true,
          color: "#262626",
        },
      },
      layout: {
        background: {
          type: ColorType.Solid,
          color: layout.background,
        },
        textColor: "white", // White text for better readability
      },
      timeScale: {
        borderColor: "#555",
      },
    });

    // Create the Candlestick Series with custom colors
    const candleSeries = chart.addCandlestickSeries({
      upColor: "#34cb88", // Green color for bullish candles
      downColor: "#ff615c", // Red color for bearish candles
      borderVisible: false,
      wickUpColor: "#5dd5a0",
      wickDownColor: "#ff887f",
    });

    this.chart = chart;
    this.candleSeries = candleSeries;

    this.candleSeries.setData(
      initialData.map((data) => {
        const timestamp = data.timestamp instanceof Date
          ? data.timestamp.getTime()
          : data.timestamp;
        return {
          time: (timestamp / 1000) as UTCTimestamp,
          open: data.open,
          high: data.high,
          low: data.low,
          close: data.close,
        };
      })
    );

    this.chart.timeScale().fitContent();
  }
  /**
   * Update the chart with new candle data
   * @param updatedPrice - Price update with OHLC values and timestamp in SECONDS
   */
  public update(updatedPrice: PriceUpdate) {
    // Initialize lastUpdateTime in seconds if not set
    if (!this.lastUpdateTime) {
      this.lastUpdateTime = Math.floor(Date.now() / 1000);
    }

    // Use provided time (in seconds) or fall back to lastUpdateTime
    const candleTime = updatedPrice.time ?? this.lastUpdateTime;

    this.candleSeries.update({
      time: candleTime as UTCTimestamp,
      close: updatedPrice.close,
      low: updatedPrice.low,
      high: updatedPrice.high,
      open: updatedPrice.open,
    });

    // When a candle closes, update lastUpdateTime to the new candle's time
    if (updatedPrice.newCandleInitiated && updatedPrice.time !== undefined) {
      this.lastUpdateTime = updatedPrice.time;
    }
  }
  public destroy() {
    this.removeAllPriceLines();
    this.chart.remove();
  }

  /**
   * Get the chart's container element for attaching mouse event handlers
   */
  public getChartElement(): HTMLElement {
    return this.chart.chartElement();
  }

  /**
   * Convert a Y coordinate (pixels) to a price value
   * DRAW-01: Foundation for drawable position tool
   */
  public coordinateToPrice(y: number): number | null {
    return this.candleSeries.coordinateToPrice(y);
  }

  /**
   * Convert a price value to a Y coordinate (pixels)
   * DRAW-01: Foundation for drawable position tool
   */
  public priceToCoordinate(price: number): number | null {
    return this.candleSeries.priceToCoordinate(price);
  }

  /**
   * Create a horizontal price line on the chart
   * DRAW-04: Visual feedback for entry/SL/TP levels
   */
  public createPriceLine(id: PriceLineId, config: PriceLineConfig): void {
    // Remove existing line with same id if present
    this.removePriceLine(id);

    const priceLine = this.candleSeries.createPriceLine({
      price: config.price,
      color: config.color,
      lineWidth: config.lineWidth ?? (2 as LineWidth),
      lineStyle: config.lineStyle ?? (id === 'entry' ? LineStyle.Dashed : LineStyle.Solid),
      axisLabelVisible: config.axisLabelVisible ?? true,
      title: config.title ?? '',
    });
    this.priceLines.set(id, priceLine);
  }

  /**
   * Update an existing price line's price
   */
  public updatePriceLine(id: PriceLineId, price: number): void {
    const priceLine = this.priceLines.get(id);
    if (priceLine) {
      priceLine.applyOptions({ price });
    }
  }

  /**
   * Remove a specific price line
   */
  public removePriceLine(id: PriceLineId): void {
    const priceLine = this.priceLines.get(id);
    if (priceLine) {
      this.candleSeries.removePriceLine(priceLine);
      this.priceLines.delete(id);
    }
  }

  /**
   * Remove all price lines
   */
  public removeAllPriceLines(): void {
    for (const [id] of this.priceLines) {
      this.removePriceLine(id);
    }
  }

  /**
   * Subscribe to crosshair move events
   * Returns unsubscribe function
   */
  public subscribeCrosshairMove(handler: ChartMouseEventHandler): () => void {
    this.chart.subscribeCrosshairMove(handler);
    return () => this.chart.unsubscribeCrosshairMove(handler);
  }

  /**
   * Subscribe to chart click events
   * Returns unsubscribe function
   */
  public subscribeClick(handler: ChartMouseEventHandler): () => void {
    this.chart.subscribeClick(handler);
    return () => this.chart.unsubscribeClick(handler);
  }
}
