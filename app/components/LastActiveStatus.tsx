import { useEffect, useState } from "react";
import moment from "moment";

interface LastActiveStatusProps {
  lastActiveTime: string | Date;
}

export default function LastActiveStatus({
  lastActiveTime,
}: LastActiveStatusProps) {
  const [lastActive, setLastActive] = useState<string>("");

  useEffect(() => {
    const updateLastActive = () => {
      const now = new Date();
      const lastActiveDate = new Date(lastActiveTime);
      const diffMinutes = Math.floor(
        (now.getTime() - lastActiveDate.getTime()) / (1000 * 60),
      );

      if (diffMinutes < 5) {
        setLastActive("Active now");
      } else {
        setLastActive(`Last active ${moment(lastActiveTime).fromNow()}`);
      }
    };

    updateLastActive();
    // Update the status every minute
    const interval = setInterval(updateLastActive, 60000);

    return () => clearInterval(interval);
  }, [lastActiveTime]);

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-2 h-2 rounded-full ${
          lastActive === "Active now" ? "bg-green-500" : "bg-gray-400"
        }`}
      />
      <span className="text-sm text-gray-600">{lastActive}</span>
    </div>
  );
}
