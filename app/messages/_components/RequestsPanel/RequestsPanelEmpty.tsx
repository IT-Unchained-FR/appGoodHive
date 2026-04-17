import { Inbox } from "lucide-react";

export function RequestsPanelEmpty() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200">
        <Inbox className="h-5 w-5 text-slate-400" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-600">No requests</p>
        <p className="mt-1 text-xs text-slate-400">
          Job requests from companies will appear here
        </p>
      </div>
    </div>
  );
}
