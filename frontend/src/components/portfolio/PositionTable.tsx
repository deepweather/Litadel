import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit, Trash2, XCircle } from 'lucide-react'
import type { Position } from '../../types/portfolio'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PositionTableProps {
  positions: Position[]
  onEdit: (position: Position) => void
  onDelete: (positionId: number) => void
  onClose: (position: Position) => void
}

export const PositionTable: React.FC<PositionTableProps> = ({
  positions,
  onEdit,
  onDelete,
  onClose,
}) => {
  const navigate = useNavigate()

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A'
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(2)}%`
  }

  const getPnLColorClass = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'text-muted-foreground'
    return value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
  }

  if (positions.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground font-mono border">
        No positions in this portfolio
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>TICKER</TableHead>
            <TableHead>ASSET</TableHead>
            <TableHead className="text-right">QTY</TableHead>
            <TableHead className="text-right">ENTRY</TableHead>
            <TableHead className="text-right">CURRENT</TableHead>
            <TableHead className="text-right">P&L</TableHead>
            <TableHead className="text-right">P&L %</TableHead>
            <TableHead className="text-center">STATUS</TableHead>
            <TableHead className="text-center">ACTIONS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions.map((position) => (
            <TableRow key={position.id}>
              <TableCell
                className="font-bold text-primary cursor-pointer underline"
                onClick={() => navigate(`/asset/${position.ticker}`)}
                title="View asset details"
              >
                {position.ticker}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {position.asset_class.toUpperCase()}
              </TableCell>
              <TableCell className="text-right">
                {position.quantity.toFixed(4)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(position.entry_price)}
              </TableCell>
              <TableCell className="text-right">
                {position.status === 'open'
                  ? formatCurrency(position.current_price)
                  : formatCurrency(position.exit_price)}
              </TableCell>
              <TableCell className={cn(
                "text-right font-bold",
                getPnLColorClass(position.status === 'open' ? position.unrealized_pnl : position.realized_pnl)
              )}>
                {position.status === 'open'
                  ? formatCurrency(position.unrealized_pnl)
                  : formatCurrency(position.realized_pnl)}
              </TableCell>
              <TableCell className={cn(
                "text-right font-bold",
                getPnLColorClass(position.pnl_percentage)
              )}>
                {formatPercentage(position.pnl_percentage)}
              </TableCell>
              <TableCell className="text-center">
                <span className={cn(
                  "px-2 py-1 text-xs border",
                  position.status === 'open'
                    ? 'border-green-600 text-green-600 dark:border-green-400 dark:text-green-400'
                    : 'border-muted-foreground text-muted-foreground'
                )}>
                  {position.status.toUpperCase()}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(position)}
                    title="Edit"
                  >
                    <Edit size={16} />
                  </Button>
                  {position.status === 'open' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onClose(position)}
                      title="Close Position"
                      className="text-yellow-600 hover:text-yellow-600"
                    >
                      <XCircle size={16} />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(position.id)}
                    title="Delete"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

