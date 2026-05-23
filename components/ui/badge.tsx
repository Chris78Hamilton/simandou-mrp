import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        abb: "border-transparent bg-[#0066B3] text-white",
        takraf: "border-transparent bg-[#CC4400] text-white",
        comm: "border-transparent bg-blue-600 text-white",
        ci: "border-transparent bg-purple-600 text-white",
        "2yr": "border-transparent bg-green-600 text-white",
        st: "border-transparent bg-amber-600 text-white",
        overdue: "border-transparent bg-red-600 text-white",
        due_soon: "border-transparent bg-amber-500 text-white",
        ok: "border-transparent bg-green-600 text-white",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
