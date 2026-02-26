import { cva } from "class-variance-authority"

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-primary to-orange-500 text-primary-foreground hover:from-primary/90 hover:to-orange-500/90 shadow-md hover:shadow-lg",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow-md",
        outline:
          "border border-input hover:bg-gradient-to-r hover:from-accent hover:to-amber-100/50 hover:text-accent-foreground hover:border-primary/20 dark:hover:from-accent dark:hover:to-accent",
        secondary:
          "bg-gradient-to-r from-secondary to-amber-100/40 text-secondary-foreground hover:from-secondary/80 hover:to-amber-100/60 dark:from-secondary dark:to-secondary dark:hover:from-secondary/80 dark:hover:to-secondary/80",
        ghost: "hover:bg-gradient-to-r hover:from-accent hover:to-amber-100/30 hover:text-accent-foreground dark:hover:from-accent dark:hover:to-accent",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)