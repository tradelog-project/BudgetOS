"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

// Simple native-select wrapper for reliability
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string
}

const SelectNative = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, placeholder, ...props }, ref) => (
    <div className="relative w-full">
      <select
        ref={ref}
        className={cn(
          "flex h-10 w-full appearance-none rounded-lg border border-border bg-background px-3 py-2 pr-8 text-sm",
          "ring-offset-background",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-colors",
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
    </div>
  )
)
SelectNative.displayName = "SelectNative"

// shadcn-compatible compound exports (uses native under hood)
const Select = ({ onValueChange, defaultValue, value, children, ...props }: {
  onValueChange?: (value: string) => void
  defaultValue?: string
  value?: string
  children: React.ReactNode
  disabled?: boolean
}) => {
  return <SelectContext.Provider value={{ onValueChange, value, defaultValue }}>{children}</SelectContext.Provider>
}

const SelectContext = React.createContext<{
  onValueChange?: (value: string) => void
  value?: string
  defaultValue?: string
}>({})

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.HTMLAttributes<HTMLButtonElement> & { disabled?: boolean }
>(({ className, children, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "transition-colors",
      className
    )}
    {...props}
  >
    {children}
    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
  </button>
))
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = ({ placeholder }: { placeholder?: string }) => (
  <span className="text-muted-foreground">{placeholder}</span>
)

const SelectContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("mt-1 rounded-lg border border-border bg-popover shadow-md", className)}>
    {children}
  </div>
)

const SelectItem = ({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) => (
  <div className={cn("px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground", className)} data-value={value}>
    {children}
  </div>
)

const SelectGroup = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
const SelectLabel = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("px-3 py-1.5 text-xs font-semibold text-muted-foreground", className)}>{children}</div>
)

export {
  SelectNative,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
}
