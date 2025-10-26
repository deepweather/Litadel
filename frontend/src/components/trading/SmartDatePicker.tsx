import React, { useState } from 'react'
import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SmartDatePickerProps {
  onDateRangeSelect: (startDate: string, endDate: string) => void
  initialStartDate?: string
  initialEndDate?: string
}

export const SmartDatePicker: React.FC<SmartDatePickerProps> = ({
  onDateRangeSelect,
  initialStartDate = '',
  initialEndDate = ''
}) => {
  const [showCustom, setShowCustom] = useState(false)
  const [startDate, setStartDate] = useState(initialStartDate)
  const [endDate, setEndDate] = useState(initialEndDate)

  // Calculate date presets
  const getDatePresets = () => {
    const today = new Date()
    const currentYear = today.getFullYear()

    return {
      'Last 2 Years': {
        start: `${currentYear - 2}-01-01`,
        end: today.toISOString().split('T')[0]
      },
      'Last Year': {
        start: `${currentYear - 1}-01-01`,
        end: `${currentYear - 1}-12-31`
      },
      'YTD': {
        start: `${currentYear}-01-01`,
        end: today.toISOString().split('T')[0]
      },
      'Last 6 Months': {
        start: new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      }
    }
  }

  const presets = getDatePresets()

  const handlePresetClick = (presetName: string) => {
    const preset = presets[presetName as keyof typeof presets]
    onDateRangeSelect(preset.start, preset.end)
    setShowCustom(false)
  }

  const handleCustomSubmit = () => {
    if (startDate && endDate) {
      if (new Date(endDate) <= new Date(startDate)) {
        alert('End date must be after start date')
        return
      }
      onDateRangeSelect(startDate, endDate)
      setShowCustom(false)
    }
  }

  return (
    <div className="p-6 border-2 border-primary rounded-lg bg-primary/5">
      <div className="flex items-center gap-2 mb-4 text-primary text-sm font-bold">
        <Calendar size={18} />
        <span>What time period for the backtest?</span>
      </div>

      {!showCustom ? (
        <>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-3 mb-3">
            {Object.keys(presets).map((presetName) => (
              <button
                key={presetName}
                onClick={() => handlePresetClick(presetName)}
                className="p-3 border border-primary bg-primary/10 text-primary text-sm font-mono cursor-pointer rounded transition-all hover:bg-primary/20 hover:border-blue-500"
              >
                {presetName}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowCustom(true)}
            className="w-full p-3 border border-dashed border-primary bg-transparent text-primary text-sm font-mono cursor-pointer rounded hover:bg-primary/5"
          >
            Custom Range...
          </button>
        </>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <Label className="block mb-2 text-primary text-xs">
              START DATE
            </Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 bg-background border border-primary text-foreground font-mono text-sm"
            />
          </div>

          <div>
            <Label className="block mb-2 text-primary text-xs">
              END DATE
            </Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 bg-background border border-primary text-foreground font-mono text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCustomSubmit}
              disabled={!startDate || !endDate}
              className="flex-1 p-3 border border-blue-500 bg-blue-500/10 text-blue-500 text-sm font-bold font-mono disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply
            </Button>
            <Button
              onClick={() => setShowCustom(false)}
              variant="outline"
              className="px-6 py-3 border border-muted-foreground text-muted-foreground text-sm font-mono"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
