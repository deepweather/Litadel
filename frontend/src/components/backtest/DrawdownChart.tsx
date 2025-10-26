import React, { useEffect, useRef } from 'react'
import { ColorType, createChart } from 'lightweight-charts'
import type { IChartApi, Time } from 'lightweight-charts'
import { Card } from '@/components/ui/card'

interface EquityCurveData {
  date: string
  drawdown_pct: number
}

interface DrawdownChartProps {
  data: EquityCurveData[]
  height?: number
}

const DrawdownChart: React.FC<DrawdownChartProps> = ({ data, height = 250 }) => {
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

    const drawdownSeries = chart.addAreaSeries({
      topColor: isDark ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.3)',
      bottomColor: isDark ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.02)',
      lineColor: '#ef4444',
      lineWidth: 2,
      priceFormat: {
        type: 'percent',
      },
    })

    const drawdownData = data
      .map((point) => {
        const dateStr = point.date.includes('T')
          ? point.date.split('T')[0]
          : point.date.split(' ')[0]
        return {
          time: dateStr as Time,
          value: -Math.abs(point.drawdown_pct),
        }
      })
      .sort((a, b) => (a.time as string).localeCompare(b.time as string))

    drawdownSeries.setData(drawdownData)
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
  }, [data, height])

  return (
    <Card className="p-0 overflow-hidden">
      <div ref={containerRef} style={{ width: '100%', height }} />
    </Card>
  )
}

export { DrawdownChart }
