import {
  ColorType,
  createChart as createLightWeightChart,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  LineStyle,
  UTCTimestamp,
} from "lightweight-charts";

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
  time?: number;
  newCandleInitiated?: boolean;
}

export class ChartManager {
  private candleSeries: ISeriesApi<"Candlestick">;
  private lastUpdateTime: number = 0;
  private chart: IChartApi;

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
  public update(updatedPrice: PriceUpdate) {
    if (!this.lastUpdateTime) {
      this.lastUpdateTime = new Date().getTime();
    }

    this.candleSeries.update({
      time: (this.lastUpdateTime / 1000) as UTCTimestamp,
      close: updatedPrice.close,
      low: updatedPrice.low,
      high: updatedPrice.high,
      open: updatedPrice.open,
    });

    if (updatedPrice.newCandleInitiated && updatedPrice.time !== undefined) {
      this.lastUpdateTime = updatedPrice.time;
    }
  }
  public destroy() {
    this.chart.remove();
  }
}
