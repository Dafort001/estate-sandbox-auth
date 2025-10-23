import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HapticButtonProps extends ButtonProps {
  hapticStyle?: "light" | "medium" | "heavy";
}

export function HapticButton({ 
  hapticStyle = "medium", 
  className,
  onClick,
  ...props 
}: HapticButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Trigger haptic feedback if available
    if ('vibrate' in navigator) {
      const vibrationPattern = {
        light: [10],
        medium: [20],
        heavy: [30, 10, 30],
      };
      navigator.vibrate(vibrationPattern[hapticStyle]);
    }

    // Call original onClick
    onClick?.(e);
  };

  return (
    <Button
      {...props}
      onClick={handleClick}
      className={cn("active:scale-95 transition-transform", className)}
    />
  );
}
