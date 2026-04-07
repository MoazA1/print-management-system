/* eslint-disable react-refresh/only-export-components */
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

export const Tabs = TabsPrimitive.Root

export function TabsList({
  className,
  ...props
}: TabsPrimitive.TabsListProps) {
  return <TabsPrimitive.List className={cn('mb-5 border-b border-line', className)} {...props} />
}

export function TabsTrigger({
  className,
  ...props
}: TabsPrimitive.TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'ui-tab data-[state=active]:ui-tab-active relative mr-6',
        className,
      )}
      {...props}
    />
  )
}

export const TabsContent = TabsPrimitive.Content
