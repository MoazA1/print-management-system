import { Toaster as Sonner } from 'sonner'

export function Toaster() {
  return (
    <Sonner
      closeButton
      position="top-right"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: 'border border-line bg-white px-4 py-3 text-sm text-ink-950 shadow-lg',
          title: 'font-semibold text-ink-950',
          description: 'text-sm text-slate-500',
          actionButton: 'ui-button',
          cancelButton: 'ui-button-secondary',
        },
      }}
    />
  )
}
