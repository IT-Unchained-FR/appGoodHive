"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminPageLayout } from "@/app/components/admin/AdminPageLayout";
import { QuickActionFAB } from "@/app/components/admin/QuickActionFAB";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Bell, Settings, Shield } from "lucide-react";
import toast from "react-hot-toast";

const settingsCardClass =
  "rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6";
const rowClass = "flex items-center justify-between py-3.5";

function SettingsSection({
  icon: Icon,
  iconClassName,
  title,
  description,
  children,
}: {
  icon: typeof Bell;
  iconClassName: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className={settingsCardClass}>
      <div className="mb-5 flex items-center gap-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconClassName}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
      </div>
      <div className="divide-y divide-gray-50">{children}</div>
    </div>
  );
}

function SwitchRow({
  label,
  description,
  value,
  onChange,
  id,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
  id: string;
}) {
  return (
    <div className={rowClass}>
      <div className="pr-3">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <Switch id={id} checked={value} onCheckedChange={onChange} />
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    approvalAlerts: true,
    weeklyReports: false,
    errorAlerts: true,
  });
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    allowRegistrations: true,
    requireEmailVerification: true,
  });
  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 30,
    maxLoginAttempts: 5,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings", {
        credentials: "include",
      });
      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || notifications);
        setSystemSettings(data.system || systemSettings);
        setSecuritySettings(data.security || securitySettings);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          notifications,
          system: systemSettings,
          security: securitySettings,
        }),
      });

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminPageLayout
      title="Settings"
      subtitle="Manage admin panel preferences and configuration"
    >
      <div className="mx-auto w-full max-w-4xl space-y-4 sm:space-y-6">
        <SettingsSection
          icon={Bell}
          iconClassName="bg-blue-50 text-blue-600"
          title="Notifications"
          description="Control email and alert preferences"
        >
          <SwitchRow
            id="email-notifications"
            label="Email Notifications"
            description="Receive email alerts for platform activity"
            value={notifications.emailNotifications}
            onChange={(checked) =>
              setNotifications({ ...notifications, emailNotifications: checked })
            }
          />
          <SwitchRow
            id="approval-alerts"
            label="Approval Alerts"
            description="Get notified when new approvals are pending"
            value={notifications.approvalAlerts}
            onChange={(checked) =>
              setNotifications({ ...notifications, approvalAlerts: checked })
            }
          />
          <SwitchRow
            id="weekly-reports"
            label="Weekly Reports"
            description="Receive a summary report every Monday"
            value={notifications.weeklyReports}
            onChange={(checked) =>
              setNotifications({ ...notifications, weeklyReports: checked })
            }
          />
          <SwitchRow
            id="error-alerts"
            label="Error Alerts"
            description="Get alerts when system errors occur"
            value={notifications.errorAlerts}
            onChange={(checked) =>
              setNotifications({ ...notifications, errorAlerts: checked })
            }
          />
        </SettingsSection>

        <SettingsSection
          icon={Settings}
          iconClassName="bg-purple-50 text-purple-600"
          title="System"
          description="Platform-wide operational controls"
        >
          <SwitchRow
            id="maintenance-mode"
            label="Maintenance Mode"
            description="Temporarily disable public access to the platform"
            value={systemSettings.maintenanceMode}
            onChange={(checked) =>
              setSystemSettings({ ...systemSettings, maintenanceMode: checked })
            }
          />
          <SwitchRow
            id="allow-registrations"
            label="Allow Registrations"
            description="Allow new users to sign up"
            value={systemSettings.allowRegistrations}
            onChange={(checked) =>
              setSystemSettings({ ...systemSettings, allowRegistrations: checked })
            }
          />
          <SwitchRow
            id="email-verification"
            label="Require Email Verification"
            description="New accounts must verify their email"
            value={systemSettings.requireEmailVerification}
            onChange={(checked) =>
              setSystemSettings({
                ...systemSettings,
                requireEmailVerification: checked,
              })
            }
          />
        </SettingsSection>

        <SettingsSection
          icon={Shield}
          iconClassName="bg-orange-50 text-orange-600"
          title="Security"
          description="Session and authentication safeguards"
        >
          <div className={rowClass}>
            <div className="pr-3">
              <p className="text-sm font-medium text-gray-800">
                Session Timeout
              </p>
              <p className="text-xs text-gray-400">
                Minutes of inactivity before admin is logged out
              </p>
            </div>
            <Input
              type="number"
              value={securitySettings.sessionTimeout}
              onChange={(e) =>
                setSecuritySettings({
                  ...securitySettings,
                  sessionTimeout: parseInt(e.target.value, 10) || 0,
                })
              }
              className="h-9 w-20 rounded-lg border-gray-200 text-center text-sm"
            />
          </div>
          <div className={rowClass}>
            <div className="pr-3">
              <p className="text-sm font-medium text-gray-800">
                Max Login Attempts
              </p>
              <p className="text-xs text-gray-400">
                Failed sign-ins allowed before account lockout
              </p>
            </div>
            <Input
              type="number"
              value={securitySettings.maxLoginAttempts}
              onChange={(e) =>
                setSecuritySettings({
                  ...securitySettings,
                  maxLoginAttempts: parseInt(e.target.value, 10) || 0,
                })
              }
              className="h-9 w-20 rounded-lg border-gray-200 text-center text-sm"
            />
          </div>
        </SettingsSection>

        <div className="flex justify-end border-t border-gray-100 bg-white px-4 py-4 sm:px-6">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="h-10 w-full rounded-xl bg-[#FFC905] px-6 font-semibold text-black hover:bg-[#e6b400] sm:w-auto"
          >
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>

      <QuickActionFAB
        actions={[
          {
            icon: Settings,
            label: "Save settings",
            onClick: handleSave,
          },
          {
            icon: Bell,
            label: "Notifications",
            onClick: () =>
              document
                .getElementById("email-notifications")
                ?.scrollIntoView({ behavior: "smooth" }),
          },
        ]}
      />
    </AdminPageLayout>
  );
}
