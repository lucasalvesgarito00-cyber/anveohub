import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
export const buttonVariants=cva("inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",{variants:{variant:{default:"bg-primary text-primary-foreground hover:bg-primary-hover",destructive:"bg-destructive text-destructive-foreground hover:opacity-90",link:"text-primary underline-offset-4 hover:underline",secondary:"bg-secondary text-secondary-foreground hover:bg-accent",outline:"border border-border bg-surface hover:bg-accent",ghost:"text-muted-foreground hover:bg-accent hover:text-foreground",danger:"bg-destructive text-destructive-foreground hover:opacity-90"},size:{default:"h-9 px-3.5",sm:"h-8 px-3 text-xs",lg:"h-10 px-5",icon:"size-9","icon-sm":"size-8","icon-lg":"size-10"}},defaultVariants:{variant:"default",size:"default"}});
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>,VariantProps<typeof variants>{asChild?:boolean}
export const Button=forwardRef<HTMLButtonElement,ButtonProps>(({className,variant,size,asChild=false,...props},ref)=>{const Comp=asChild?Slot:"button";return <Comp ref={ref} className={cn(buttonVariants({variant,size,className}))} {...props}/>});
Button.displayName="Button";
