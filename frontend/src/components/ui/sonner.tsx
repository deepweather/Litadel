import { useTheme } from "../theme-provider"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="bottom-left"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg font-mono",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toast]:border-green-500 group-[.toast]:text-green-500",
          error: "group-[.toast]:border-destructive group-[.toast]:text-destructive",
          warning: "group-[.toast]:border-yellow-500 group-[.toast]:text-yellow-500",
          info: "group-[.toast]:border-primary group-[.toast]:text-primary",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

