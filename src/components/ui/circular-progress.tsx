import type React from 'react'
import { cn } from '@/lib/utils'

export interface ProgressCircleProps extends React.ComponentProps<'svg'> {
  value: number
  className?: string
  /** Main centered text inside the circle (e.g. percent) */
  text?: React.ReactNode
  /** Small label shown below the main text */
  label?: React.ReactNode
}

// https://github.com/shadcn-ui/ui/issues/697
// https://github.com/shadcn-ui/ui/issues/697#issuecomment-2621653578 CircularProgress

function clamp(input: number, a: number, b: number): number {
  return Math.max(Math.min(input, Math.max(a, b)), Math.min(a, b))
}

// match values with lucide icons for compatibility
const size = 20
const strokeWidth = 2

// fix to percentage values
const total = 101.25

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress
 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/progressbar_role
 */
export const ProgressCircle = ({ value, className, text, label, ...restSvgProps }: ProgressCircleProps) => {
  const normalizedValue = clamp(value, 0, total)

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (normalizedValue / total) * circumference
  const halfSize = size / 2

  const commonParams = {
    cx: halfSize,
    cy: halfSize,
    r: radius,
    fill: 'none',
    strokeWidth,
  }

  return (
    <svg
      role="progressbar"
      viewBox={`0 0 ${size} ${size}`}
      className={cn('size-6 text-primary', className)}
      aria-valuenow={normalizedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      {...restSvgProps}
    >
      <circle {...commonParams} className="stroke-primary/20" />
      <circle
        {...commonParams}
        stroke="currentColor"
        strokeDasharray={circumference}
        strokeDashoffset={circumference - progress}
        strokeLinecap="round"
        transform={`rotate(-90 ${halfSize} ${halfSize})`}
        className="stroke-primary dark:stroke-primary transition-all duration-150 ease-out"
      />
      {(text || label) && (
        <text
          x={halfSize}
          y={halfSize}
          textAnchor="middle"
          dominantBaseline="middle"
          aria-hidden
        >
          {text ? (
            <tspan x={halfSize} dy={-0.4} className="fill-primary font-medium" fontSize={4.5}>
              {text}
            </tspan>
          ) : null}
          {label ? (
            <tspan x={halfSize} dy={label ? 3 : 0} className="fill-muted-foreground" fontSize={2}>
              {label}
            </tspan>
          ) : null}
        </text>
      )}
    </svg>
  )
}