import { Plus, ArrowUpRight, ArrowDownLeft, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";

export const QuickActions = () => {
  const actions = [
    {
      icon: Plus,
      label: "Deposit",
      description: "Add money via M-Pesa",
      variant: "default" as const,
      className: "crypto-gradient hover:opacity-90"
    },
    {
      icon: ArrowUpRight,
      label: "Buy Crypto",
      description: "Purchase SOL or USDT",
      variant: "secondary" as const,
      className: ""
    },
    {
      icon: ArrowDownLeft,
      label: "Sell",
      description: "Convert to KES",
      variant: "secondary" as const,
      className: ""
    },
    {
      icon: Repeat,
      label: "Swap",
      description: "Exchange tokens",
      variant: "secondary" as const,
      className: ""
    }
  ];

  return (
    <div className="crypto-card">
      <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Button
              key={index}
              variant={action.variant}
              className={`flex flex-col items-center justify-center h-20 space-y-1 transition-smooth hover:scale-105 ${action.className}`}
            >
              <Icon className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium text-sm">{action.label}</div>
                <div className="text-xs opacity-80">{action.description}</div>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
};