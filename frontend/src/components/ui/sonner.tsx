/**
 * Sonner Toaster wrapper — integrates with the CSS variable theme defined in
 * index.css so toast colours match the shadcn design system.
 */
import { memo } from 'react'
import { Toaster as SonnerToaster } from 'sonner'

type ToasterProps = React.ComponentProps<typeof SonnerToaster>

const Toaster = memo(function Toaster({ ...props }: ToasterProps) {
  return (
    <SonnerToaster
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: [
            'group toast',
            'group-[.toaster]:bg-background',
            'group-[.toaster]:text-foreground',
            'group-[.toaster]:border-border',
            'group-[.toaster]:shadow-lg',
          ].join(' '),
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  )
})

export { Toaster }
