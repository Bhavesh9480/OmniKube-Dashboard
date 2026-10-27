import React from 'react'
import { getStatusTheme } from '../../utils/formatters'
import { cn } from '../../utils/cn'

interface StatusBadgeProps {
  status: string | boolean | null | undefined
  label?: string
  size?: 'sm' | 'md'
  showDot?: boolean
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'sm',
  showDot = true,
  className,
}) => {
  let displayStatus = 'Unknown'
  if (typeof status === 'boolean') {
    displayStatus = status ? 'Healthy' : 'Unhealthy'
  } else if (status) {
    displayStatus = String(status)
  }

  const displayText = label || displayStatus
  const theme = getStatusTheme(displayStatus)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full border',
        theme.bg,
        theme.text,
        theme.border,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        className
      )}
    >
      {showDot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', theme.indicator)}
          aria-hidden="true"
        />
      )}
      <span>{displayText}</span>
    </span>
  )
}
