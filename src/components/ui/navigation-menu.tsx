import * as React from "react";
import { cva } from "class-variance-authority";
import { ChevronDownIcon } from "lucide-react";
import { NavigationMenu as NavigationMenuPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";
import "./navigation-menu.css";

function NavigationMenu({ className, children, viewport = true, ...props }:
  React.ComponentProps<typeof NavigationMenuPrimitive.Root> & { viewport?: boolean }) {
  return (
    <NavigationMenuPrimitive.Root data-slot="navigation-menu" data-viewport={viewport}
      className={cn("fac-navigation", className)} {...props}>
      {children}
      {viewport && <NavigationMenuViewport />}
    </NavigationMenuPrimitive.Root>
  );
}

function NavigationMenuList({ className, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.List>) {
  return <NavigationMenuPrimitive.List data-slot="navigation-menu-list" className={cn("fac-navigation-list", className)} {...props} />;
}

function NavigationMenuItem({ className, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Item>) {
  return <NavigationMenuPrimitive.Item data-slot="navigation-menu-item" className={cn("fac-navigation-item", className)} {...props} />;
}

const navigationMenuTriggerStyle = cva("fac-navigation-trigger");

function keepInlineMenuStable(event: React.PointerEvent) {
  if (window.matchMedia("(max-width: 1240px)").matches) event.preventDefault();
}

function NavigationMenuTrigger({ className, children, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Trigger>) {
  return (
    <NavigationMenuPrimitive.Trigger data-slot="navigation-menu-trigger" className={cn(navigationMenuTriggerStyle(), className)} onPointerMove={keepInlineMenuStable} onPointerLeave={keepInlineMenuStable} {...props}>
      {children}
      <ChevronDownIcon className="fac-navigation-chevron" size={14} aria-hidden="true" />
    </NavigationMenuPrimitive.Trigger>
  );
}

function NavigationMenuContent({ className, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Content>) {
  return <NavigationMenuPrimitive.Content data-slot="navigation-menu-content" className={cn("fac-navigation-content", className)}
    onPointerLeave={keepInlineMenuStable}
    onPointerDownOutside={(event) => {
      // Keep inline panels in place until a sibling link receives its click.
      const target = event.target;
      if (target instanceof Element && target.closest('[data-slot="navigation-menu"]')) event.preventDefault();
    }} {...props} />;
}

function NavigationMenuViewport({ className, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Viewport>) {
  return (
    <div className="fac-navigation-viewport-position">
      <NavigationMenuPrimitive.Viewport data-slot="navigation-menu-viewport" className={cn("fac-navigation-viewport", className)} {...props} />
    </div>
  );
}

function NavigationMenuLink({ className, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Link>) {
  return <NavigationMenuPrimitive.Link data-slot="navigation-menu-link" className={cn("fac-navigation-link", className)} {...props} />;
}

function NavigationMenuIndicator({ className, children, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Indicator>) {
  return (
    <NavigationMenuPrimitive.Indicator data-slot="navigation-menu-indicator" className={cn("fac-navigation-indicator", className)} {...props}>
      {children || <div className="fac-navigation-arrow" />}
    </NavigationMenuPrimitive.Indicator>
  );
}

export { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuContent,
  NavigationMenuTrigger, NavigationMenuLink, NavigationMenuIndicator, NavigationMenuViewport, navigationMenuTriggerStyle };
