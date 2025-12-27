import { LucideIcon } from "lucide-react";

interface StatusCardProps {
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
  title: string;
  subtitle: string;
  label: string;
  labelColor: string;
  pulse?: boolean;
  showSuccess?: boolean;
  actions?: React.ReactNode;
}

const StatusCard = ({
  icon: Icon,
  iconColor,
  bgColor,
  title,
  subtitle,
  label,
  labelColor,
  pulse = false,
  showSuccess = false,
  actions,
}: StatusCardProps) => {
  return (
    <div 
      className={`flex items-center justify-between p-4 rounded-lg ${bgColor} animate-fade-in`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <Icon 
          className={`h-5 w-5 ${iconColor} ${pulse ? 'animate-pulse' : ''} ${showSuccess ? 'animate-scale-in' : ''}`} 
          aria-hidden="true" 
        />
        <div>
          <p className="text-sm font-medium text-primary">{title}</p>
          <p className="text-xs text-primary/60">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <span className={`text-sm font-semibold ${labelColor}`}>
          {label}
        </span>
      </div>
    </div>
  );
};

export default StatusCard;
