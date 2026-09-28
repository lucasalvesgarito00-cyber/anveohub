import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
const variants=cva("inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",{variants:{variant:{default:"bg-primary text-primary-foreground hover:bg-primary-hover",secondary:"bg-secondary text-secondary-foreground hover:bg-accent",outline:"border border-border bg-surface hover:bg-accent",ghost:"text-muted-foreground hover:bg-accent hover:text-foreground",danger:"bg-destructive text-destructive-foreground hover:opacity-90"},size:{default:"h-9 px-3.5",sm:"h-8 px-3 text-xs",icon:"size-9"}},defaultVariants:{variant:"default",size:"default"}});
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>,VariantProps<typeof variants>{asChild?:boolean}
export function Button({className,variant,size,asChild=false,...props}:ButtonProps){const Comp=asChild?Slot:"button";return <Comp className={cn(variants({variant,size,className}))} {...props}/>}
