import React, { useEffect, useRef } from 'react'
import { ColorType, createChart } from 'lightweight-charts'
import type { IChartApi, Time } from 'lightweight-charts'
import { Card } from '@/components/ui/card'

interface EquityCurveData {
  date: string
  portfolio_value: number
  drawdown_pct: number
}

interface EquityCurveChartProps {
  data: EquityCurveData[]
  height?: number
  initialCapital?: number
}

const EquityCurveChart: React.FC<EquityCurveChartProps> = ({
  data,
  height = 400,
  initialCapital,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<IChartApi | null>(null)

  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return

    const isDark = document.documentElement.classList.contains('dark')
    const containerWidth = containerRef.current.clientWidth

    const chart = createChart(containerRef.current, {
      width: containerWidth,
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
        timeVisible: true,
      },
      crosshair: { mode: 1 },
    })

    chartRef.current = chart

    // Add equity line series - use white/light gray for visibility
    const equitySeries = chart.addLineSeries({
      color: isDark ? '#f5f5f5' : '#404040',
      lineWidth: 2,
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    })

    // Add baseline for initial capital
    if (initialCapital && data.length > 0) {
      const baselineSeries = chart.addLineSeries({
        color: isDark ? '#52525b' : '#a1a1aa',
        lineWidth: 1,
        lineStyle: 2,
        priceFormat: {
          type: 'price',
          precision: 2,
        },
      })

      const firstDate = data[0].date.includes('T') ? data[0].date.split('T')[0] : data[0].date.split(' ')[0]
      const lastDate = data[data.length - 1].date.includes('T')
        ? data[data.length - 1].date.split('T')[0]
        : data[data.length - 1].date.split(' ')[0]

      const baselineData = [
        { time: firstDate as Time, value: initialCapital },
        { time: lastDate as Time, value: initialCapital },
      ]
      baselineSeries.setData(baselineData)
    }

    const equityData = data
      .map((point) => {
        const dateStr = point.date.includes('T')
          ? point.date.split('T')[0]
          : point.date.split(' ')[0]
        return {
          time: dateStr as Time,
          value: point.portfolio_value,
        }
      })
      .sort((a, b) => (a.time as string).localeCompare(b.time as string))

    equitySeries.setData(equityData)
    chart.timeScale().fitContent()

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || !chartRef.current || !containerRef.current) return
      const { width } = entries[0].contentRect
      requestAnimationFrame(() => {
        if (chartRef.current && width > 0) {
          chartRef.current.applyOptions({ width: Math.floor(width), height })
          chartRef.current.timeScale().fitContent()
        }
      })
    })

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      resizeObserver.disconnect()
      chart.remove()
    }
  }, [data, height, initialCapital])

  return (
    <Card className="p-0 overflow-hidden">
      <div ref={containerRef} style={{ width: '100%', height }} />
    </Card>
  )
}

export { EquityCurveChart }
