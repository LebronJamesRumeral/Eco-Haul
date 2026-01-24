import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/60 focus-visible:ring-[4px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-primary via-primary to-[color-mix(in_srgb,var(--primary)_80%,black)] text-primary-foreground shadow-[0_8px_28px_-8px_color-mix(in_srgb,var(--primary)_70%,transparent)] hover:shadow-[0_14px_40px_-6px_color-mix(in_srgb,var(--primary)_75%,transparent)] hover:brightness-110 active:scale-95 active:shadow-[0_4px_12px_-6px_color-mix(in_srgb,var(--primary)_60%,transparent)]",
        destructive:
          'bg-gradient-to-b from-destructive to-[color-mix(in_srgb,var(--destructive)_85%,black)] text-white shadow-md hover:shadow-lg focus-visible:ring-destructive/30 dark:focus-visible:ring-destructive/50 active:scale-95',
        outline:
          'border-2 border-primary/50 bg-background hover:border-primary hover:bg-primary/5 text-foreground shadow-sm hover:shadow-md dark:bg-input/20 dark:border-primary/40 dark:hover:bg-primary/10 focus-visible:ring-primary/60 active:scale-95',
        secondary:
          'bg-gradient-to-b from-accent/90 to-accent text-accent-foreground shadow-md hover:shadow-lg active:scale-95',
        ghost:
          'hover:bg-primary/10 text-foreground hover:text-primary dark:hover:bg-primary/20 hover:shadow-sm focus-visible:ring-primary/50 active:scale-95',
        link: 'text-primary underline-offset-4 hover:underline font-semibold focus-visible:ring-primary/50',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-lg px-6 has-[>svg]:px-4',
        icon: 'size-9 rounded-lg',
        'icon-sm': 'size-8 rounded-md',
        'icon-lg': 'size-10 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
