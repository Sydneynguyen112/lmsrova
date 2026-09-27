"use client";

// Câu "Lưới trắc nghiệm" (soạn ở rova-ops /admin/forms): mỗi hàng chọn một cột.
// options = các cột, meta.gridRows = các hàng — xem lib/form-question-meta.ts.
import { gridRows, gridSelected, setGridAnswer } from "@/lib/form-question-meta";

interface FormGridQuestionProps {
  question: { id: string; options?: string[] | null; meta?: unknown };
  value: string;
  onChange: (value: string) => void;
}

export function FormGridQuestion({ question: q, value, onChange }: FormGridQuestionProps) {
  const rows = gridRows(q);
  const columns = q.options || [];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th />
            {columns.map((col, j) => (
              <th key={j} className="px-2 pb-2 text-center text-xs font-medium text-muted-foreground">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const picked = gridSelected(value, row, columns);
            return (
              <tr key={i} className="border-t border-border">
                <td className="py-3 pr-3 text-foreground">{row}</td>
                {columns.map((col, j) => (
                  <td key={j} className="px-2 py-3 text-center">
                    <input
                      type="radio"
                      name={`${q.id}-${i}`}
                      aria-label={`${row}: ${col}`}
                      checked={picked === col}
                      onChange={() => onChange(setGridAnswer(value, rows, columns, row, col))}
                      className="h-4 w-4 cursor-pointer accent-gold"
                    />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
