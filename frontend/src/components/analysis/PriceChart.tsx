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

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: '#0a0e14' },
        textColor: '#4da6ff',
      },
      grid: {
        vertLines: { color: 'rgba(77, 166, 255, 0.1)' },
        horzLines: { color: 'rgba(77, 166, 255, 0.1)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(77, 166, 255, 0.3)',
      },
      timeScale: {
        borderColor: 'rgba(77, 166, 255, 0.3)',
      },
      crosshair: { mode: 1 },
    })

    chartRef.current = chart

    // Choose series type based on mode
    const series: any =
      mode === 'line'
        ? chart.addLineSeries({
            color: '#4da6ff',
            lineWidth: 2,
          })
        : chart.addCandlestickSeries({
            upColor: '#00ff00',
            downColor: '#ff4444',
            borderUpColor: '#00ff00',
            borderDownColor: '#ff4444',
            wickUpColor: '#00ff00',
            wickDownColor: '#ff4444',
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

    // Add analysis date marker if provided
    if (analysisDate) {
      const analysisPrice =
        mode === 'line'
          ? lineData.find((d) => d.time === analysisDate)?.value
          : candleData.find((d) => d.time === analysisDate)?.close
      if (analysisPrice) {
        series.createPriceLine({
          price: analysisPrice,
          color: '#4da6ff',
          lineWidth: 2,
          lineStyle: 2,
          axisLabelVisible: true,
          title: 'Analysis',
        })
      }
    }

    // Focus on last 60 days of data
    const baseData: any[] = mode === 'line' ? lineData : candleData
    if (baseData.length > 60) {
      const recentData = baseData.slice(-60)
      chart.timeScale().setVisibleRange({
        from: recentData[0].time,
        to: recentData[recentData.length - 1].time,
      })
    }

    const handleResize = () => {
      if (!containerRef.current || !chartRef.current) return
      const width = containerRef.current.clientWidth
      chartRef.current.applyOptions({ width })
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [data, height, analysisDate, mode])

  return (
    <div style={{ border: '1px solid rgba(77, 166, 255, 0.3)', marginBottom: '1rem' }}>
      <div ref={containerRef} style={{ width: '100%', height }} />
    </div>
  )
}

export { PriceChart }
export default PriceChart
