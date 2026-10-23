// Locally owned shadcn/ui Button, styled with this app's design tokens.
// Registry reference: https://ui.shadcn.com/r/styles/new-york/button.json
import {forwardRef,type ButtonHTMLAttributes} from 'react';
import {Slot} from '@radix-ui/react-slot';
import {cva,type VariantProps} from 'class-variance-authority';
import {cn} from '../../lib/utils';
export const buttonVariants=cva('btn',{variants:{variant:{default:'btn-primary',outline:'btn-outline',ghost:'btn-ghost'},size:{default:'',icon:'btn-icon'}},defaultVariants:{variant:'outline',size:'default'}});
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>,VariantProps<typeof buttonVariants>{asChild?:boolean}
export const Button=forwardRef<HTMLButtonElement,ButtonProps>(({variant,size,className,asChild=false,...props},ref)=>{
  const Component=asChild?Slot:'button';
  return <Component ref={ref} className={cn(buttonVariants({variant,size}),className)} {...props}/>;
});
Button.displayName='Button';
