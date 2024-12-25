import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface ApprovalToggleProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
}

export function ApprovalToggle({
  label,
  checked,
  onToggle,
}: ApprovalToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <Label htmlFor={label} className="text-sm font-medium text-gray-700">
        {label}
      </Label>
      <Switch
        id={label}
        checked={checked}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-blue-500"
      />
    </div>
  );
}
