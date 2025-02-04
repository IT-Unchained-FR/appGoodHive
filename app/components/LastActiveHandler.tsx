import { useEffect } from "react";
import Cookies from "js-cookie";

export default function LastActiveHandler() {
  useEffect(() => {
    const user_id = Cookies.get("user_id");

    const updateLastActive = async () => {
      if (!user_id) return; // Don't update if no user_id

      try {
        const lastActiveRequestSentTime = Cookies.get(
          "last_active_request_sent_time",
        );
        const now = new Date();

        // Only send update if no previous request or if it's been more than 5 minutes
        if (
          !lastActiveRequestSentTime ||
          now.getTime() - new Date(lastActiveRequestSentTime).getTime() > 300000
        ) {
          const response = await fetch("/api/auth/last-active-time", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id }),
          });

          if (response.ok) {
            Cookies.set("last_active_request_sent_time", now.toISOString());
          }
        }
      } catch (error) {
        console.error("Error updating last active time:", error);
      }
    };

    // Update last active time on component mount and when user interacts
    updateLastActive();

    // Add event listeners for user activity
    const activityEvents = ["mousedown", "keydown", "scroll", "touchstart"];
    let timeoutId: NodeJS.Timeout;

    const handleActivity = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateLastActive, 1000); // Debounce updates
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Cleanup
    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      clearTimeout(timeoutId);
    };
  }, []);

  return null;
}
