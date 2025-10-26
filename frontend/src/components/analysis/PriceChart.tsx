import React, { useEffect, useRef } from 'react'
import { ColorType, createChart } from 'lightweight-charts'
import type { IChartApi, Time } from 'lightweight-charts'

type OHLCV = {
  Date: string
  Open?: number | string
  High?: number | string
  Low?: number | string
  Close?: number | string
  Volume?: number | string
}

interface PriceChartProps {
  data: OHLCV[]
  height?: number
  analysisDate?: string
  mode?: 'candles' | 'line'
}

const PriceChart: React.FC<PriceChartProps> = ({
  data,
  height = 280,
  analysisDate,
  mode = 'candles',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<IChartApi | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Use colors that work well in both light and dark themes
    // Detect if we're in dark mode
    const isDark = document.documentElement.classList.contains('dark')

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: isDark ? '#09090b' : '#ffffff' },
        textColor: isDark ? '#a1a1aa' : '#71717a',
      },
      grid: {
        vertLines: { color: isDark ? '#27272a' : '#e4e4e7' },
        horzLines: { color: isDark ? '#27272a' : '#e4e4e7' },
      },
      rightPriceScale: {
        borderColor: isDark ? '#27272a' : '#e4e4e7',
      },
      timeScale: {
        borderColor: isDark ? '#27272a' : '#e4e4e7',
      },
      crosshair: { mode: 1 },
    })

    chartRef.current = chart

    // Choose series type based on mode
    const series: any =
      mode === 'line'
        ? chart.addLineSeries({
            color: isDark ? '#60a5fa' : '#3b82f6',
            lineWidth: 2,
          })
        : chart.addCandlestickSeries({
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderUpColor: '#22c55e',
            borderDownColor: '#ef4444',
            wickUpColor: '#22c55e',
            wickDownColor: '#ef4444',
          })

    // Prepare data depending on chart mode
    const candleData = (data || [])
      .filter((d) => d.Date && d.Open != null && d.High != null && d.Low != null && d.Close != null)
      .map((d) => ({
        time: d.Date as Time,
        open: Number(d.Open),
        high: Number(d.High),
        low: Number(d.Low),
        close: Number(d.Close),
      }))
      .sort((a, b) => (a.time as string).localeCompare(b.time as string))

    const lineData = (data || [])
      .filter((d) => d.Date && d.Close != null)
      .map((d) => ({
        time: d.Date as Time,
        value: Number(d.Close),
      }))
      .sort((a, b) => (a.time as string).localeCompare(b.time as string))

    if (mode === 'line') {
      series.setData(lineData)
    } else {
      series.setData(candleData)
    }

    // Add a marker for the analysis date if provided
    if (analysisDate && candleData.length > 0) {
      const marker = {
        time: analysisDate as Time,
        position: 'inBar' as const,
        color: '#ff9800',
        shape: 'arrowDown' as const,
        text: 'Analysis',
      }
      series.setMarkers([marker])
    }

    chart.timeScale().fitContent()

    // Cleanup on unmount
    return () => {
      chart.remove()
    }
  }, [data, height, analysisDate, mode])

  return (
    <div className="border mb-4">
      <div ref={containerRef} style={{ width: '100%', height }} />
    </div>
  )
}

export { PriceChart }
