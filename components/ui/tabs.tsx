"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <div className="max-w-full overflow-x-auto">
      <TabsPrimitive.List
        className={cn("inline-flex w-max items-center gap-1 rounded-lg bg-secondary p-1 text-muted-foreground", className)}
        {...props}
      />
    </div>
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        "data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        "data-[state=inactive]:hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn("mt-6 focus-visible:outline-none", className)} {...props} />;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
