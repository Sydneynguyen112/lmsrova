"use client";

// Tuỳ chọn "Khác" của câu Chọn một / Chọn nhiều (bật ở rova-ops /admin/forms):
// tích vào rồi tự ghi nội dung, lưu dạng "Khác: <nội dung>" — xem lib/form-question-meta.ts.
import { cn } from "@/lib/utils";
import { otherText, setOtherText, OTHER_LABEL } from "@/lib/form-question-meta";

interface FormOtherOptionProps {
  question: { id: string; question_type: string; options?: string[] | null; meta?: unknown };
  value: string;
  onChange: (value: string) => void;
}

export function FormOtherOption({ question: q, value, onChange }: FormOtherOptionProps) {
  const text = otherText(q, value);
  const picked = text !== null;
  const multi = q.question_type === "checkbox";
  return (
    <label
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3 text-sm cursor-pointer transition-all",
        picked ? "border-gold bg-gold/10" : "border-border hover:border-gold/30"
      )}
    >
      <input
        type={multi ? "checkbox" : "radio"}
        name={q.id}
        checked={picked}
        onChange={() => onChange(setOtherText(q, value, picked && multi ? null : text ?? ""))}
        className="accent-gold shrink-0"
      />
      <span className="shrink-0">{OTHER_LABEL}:</span>
      <input
        type="text"
        value={text ?? ""}
        onChange={(e) => onChange(setOtherText(q, value, e.target.value))}
        onFocus={() => { if (!picked) onChange(setOtherText(q, value, "")); }}
        aria-label={`${OTHER_LABEL} — tự ghi câu trả lời`}
        className="min-w-0 flex-1 border-b border-border bg-transparent pb-0.5 text-foreground outline-none focus:border-gold"
      />
    </label>
  );
}
