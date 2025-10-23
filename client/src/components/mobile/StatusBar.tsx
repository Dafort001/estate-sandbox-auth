import { Wifi, Battery, Signal } from "lucide-react";

interface StatusBarProps {
  time?: string;
  showNotch?: boolean;
}

export function StatusBar({ time, showNotch = true }: StatusBarProps) {
  const currentTime = time || new Date().toLocaleTimeString('de-DE', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className="relative w-full">
      {/* iOS-Style Notch */}
      {showNotch && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-black rounded-b-3xl z-50" />
      )}

      {/* Status Bar Content */}
      <div className="relative flex items-center justify-between px-6 h-12 text-sm z-40">
        {/* Left: Time */}
        <div className="font-semibold">{currentTime}</div>

        {/* Right: Icons */}
        <div className="flex items-center gap-2">
          <Signal className="w-4 h-4" />
          <Wifi className="w-4 h-4" />
          <Battery className="w-5 h-4" />
        </div>
      </div>
    </div>
  );
}
