import React, { useEffect, useRef } from 'react'
import { ColorType, createChart } from 'lightweight-charts'
import type { IChartApi, Time } from 'lightweight-charts'
import { Card } from '@/components/ui/card'

interface TradeData {
  trade_date: string
  pnl: number | null
}

interface CumulativePnLChartProps {
  trades: TradeData[]
  height?: number
}

const CumulativePnLChart: React.FC<CumulativePnLChartProps> = ({ trades, height = 250 }) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<IChartApi | null>(null)

  useEffect(() => {
    if (!containerRef.current || !trades || trades.length === 0) return

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

    // Calculate cumulative P&L
    let cumulative = 0
    const pnlData = trades
      .filter(t => t.pnl !== null && t.trade_date)
      .map((trade) => {
        cumulative += trade.pnl || 0
        const dateStr = trade.trade_date.includes('T')
          ? trade.trade_date.split('T')[0]
          : trade.trade_date.split(' ')[0]
        return {
          time: dateStr as Time,
          value: cumulative,
        }
      })
      .sort((a, b) => (a.time as string).localeCompare(b.time as string))

    const pnlSeries = chart.addAreaSeries({
      topColor: isDark ? 'rgba(34, 197, 94, 0.4)' : 'rgba(34, 197, 94, 0.3)',
      bottomColor: isDark ? 'rgba(34, 197, 94, 0.05)' : 'rgba(34, 197, 94, 0.02)',
      lineColor: '#22c55e',
      lineWidth: 2,
      priceFormat: {
        type: 'price',
        precision: 2,
      },
    })

    pnlSeries.setData(pnlData)
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
  }, [trades, height])

  return (
    <Card className="p-0 overflow-hidden">
      <div ref={containerRef} style={{ width: '100%', height }} />
    </Card>
  )
}

export { CumulativePnLChart }
