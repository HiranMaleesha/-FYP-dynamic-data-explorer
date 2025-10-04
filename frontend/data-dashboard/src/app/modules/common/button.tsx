import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "@radix-ui/react-slot"
import { Loader2 } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@radix-ui/react-tooltip"


const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'cursor-pointer bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90',
        destructive:
          'cursor-pointer bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary:
          'cursor-pointer bg-secondary-700 text-white hover:bg-secondary-600 dark:bg-secondary-600 dark:hover:bg-secondary-500 dark:text-white',
        muted:
          'cursor-pointer bg-gray-100 text-gray-700 shadow-xs hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
        contrast:
          'cursor-pointer bg-gray-100 text-black shadow-xs hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
        cta: 'cursor-pointer bg-primary-700 disabled:opacity-100 disabled:bg-primary-400 hover:bg-primary-800 text-white h-auto xs:px-8 xs:py-8 dark:bg-primary-600 dark:disabled:bg-primary-500 dark:hover:bg-primary-700 dark:text-white',
        ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline dark:text-primary-foreground dark:hover:text-primary-foreground/80',
      },
      size: {
        default: 'cursor-pointer h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'cursor-pointer h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'cursor-pointer h-10 text-md font-semibold w-full rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  icon,
  tooltip,
  children,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    tooltip?: string | React.ReactNode;
  }) {
  const Comp = asChild ? Slot : 'button';

  const content = (
    <>
      {loading ? <Loader2 className="animate-spin" /> : icon}
      {children}
    </>
  );

  const buttonElement = (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }), 'cursor-pointer')}
      disabled={loading || props.disabled}
      {...props}
    >
      {asChild ? <span>{content}</span> : content}
    </Comp>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{buttonElement}</TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    );
  }

  return buttonElement;
}

export { Button, buttonVariants };
