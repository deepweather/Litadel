import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  maxWidth?: string
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '500px',
}: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="font-mono" style={{ maxWidth }}>
        {title && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  )
}

