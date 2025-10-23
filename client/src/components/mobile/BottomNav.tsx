import { Camera, Image, Upload } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { icon: Camera, label: "Kamera", path: "/app/camera", testId: "nav-camera" },
    { icon: Image, label: "Galerie", path: "/app/gallery", testId: "nav-gallery" },
    { icon: Upload, label: "Upload", path: "/app/upload", testId: "nav-upload" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-20 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;

          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={cn(
                "flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              data-testid={item.testId}
            >
              <Icon className={cn("w-6 h-6", isActive && "fill-primary")} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
