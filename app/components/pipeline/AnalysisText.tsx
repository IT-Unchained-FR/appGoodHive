"use client";

function boldify(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

export function AnalysisText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1 text-sm text-slate-700 leading-relaxed">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;

        if (trimmed.startsWith("## ")) {
          return (
            <p key={i} className="font-bold text-slate-900 text-sm mt-3 first:mt-0">
              {trimmed.slice(3)}
            </p>
          );
        }
        if (trimmed.startsWith("### ")) {
          return (
            <p key={i} className="font-semibold text-slate-800 text-[13px] mt-2 first:mt-0">
              {trimmed.slice(4)}
            </p>
          );
        }
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const content = trimmed.slice(2);
          return (
            <div key={i} className="flex gap-2 items-start">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
              <span dangerouslySetInnerHTML={{ __html: boldify(content) }} />
            </div>
          );
        }
        return (
          <p key={i} dangerouslySetInnerHTML={{ __html: boldify(trimmed) }} />
        );
      })}
    </div>
  );
}
