import * as React from 'react'
import { cn } from '@/lib/utils'

export function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-none border border-line bg-white px-3 text-sm text-ink-950 outline-none transition focus:border-accent-500 focus:ring-2 focus:ring-accent-500/10',
        className,
      )}
      {...props}
    />
  )
}
