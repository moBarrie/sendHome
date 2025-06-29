import { Home, Send } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function Logo({
  size = "md",
  showText = true,
  className = "",
}: LogoProps) {
  const sizeClasses = {
    sm: {
      icon: "w-4 h-4",
      sendIcon: "w-2 h-2",
      text: "text-lg",
    },
    md: {
      icon: "w-6 h-6",
      sendIcon: "w-3 h-3",
      text: "text-xl",
    },
    lg: {
      icon: "w-8 h-8",
      sendIcon: "w-4 h-4",
      text: "text-2xl",
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex items-center space-x-1">
        <div className="relative">
          <Home className={`${sizes.icon} text-primary`} />
          <Send
            className={`${sizes.sendIcon} text-primary absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5`}
          />
        </div>
      </div>
      {showText && <span className={`font-bold ${sizes.text}`}>SendHome</span>}
    </div>
  );
}
