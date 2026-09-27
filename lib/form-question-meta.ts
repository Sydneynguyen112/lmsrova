// Thiết lập riêng theo loại câu hỏi, lưu trong form_questions.meta (JSONB):
//   - "rating": meta.ratingMax = số sao tối đa (1–10, thiếu thì 5)
//   - "grid"  : options = các CỘT, meta.gridRows = các HÀNG; mỗi hàng chọn 1 cột
// Câu trả lời lưới lưu trong 1 chuỗi "Hàng: Cột", ngăn cách "|||" (giống checkbox)
// để trang phản hồi + CSV đọc được ngay.
// Mirror: rova-ops/lib/form-question-meta.ts — sửa một bên phải sửa bên kia.

export const MULTI_SEP = "|||";
export const RATING_DEFAULT_MAX = 5;
export const RATING_LIMIT = 10;

interface QuestionLike {
  question_type: string;
  options?: string[] | null;
  meta?: unknown;
}

function metaOf(q: { meta?: unknown }): Record<string, unknown> {
  const m = q.meta;
  return m && typeof m === "object" && !Array.isArray(m) ? (m as Record<string, unknown>) : {};
}

export function ratingMax(q: { meta?: unknown }): number {
  const n = Number(metaOf(q).ratingMax);
  return Number.isInteger(n) && n >= 1 && n <= RATING_LIMIT ? n : RATING_DEFAULT_MAX;
}

export function ratingScale(q: { meta?: unknown }): number[] {
  return Array.from({ length: ratingMax(q) }, (_, i) => i + 1);
}

export function gridRows(q: { meta?: unknown }): string[] {
  const rows = metaOf(q).gridRows;
  return Array.isArray(rows)
    ? rows.filter((r): r is string => typeof r === "string" && r.trim() !== "")
    : [];
}

function gridCell(row: string, col: string) {
  return `${row}: ${col}`;
}

// Cột đang được chọn của một hàng (null = hàng chưa trả lời)
export function gridSelected(value: string, row: string, columns: string[]): string | null {
  const parts = value ? value.split(MULTI_SEP) : [];
  return columns.find((c) => parts.includes(gridCell(row, c))) ?? null;
}

// Chọn cột cho một hàng → trả về chuỗi câu trả lời mới, giữ đúng thứ tự hàng
export function setGridAnswer(
  value: string,
  rows: string[],
  columns: string[],
  row: string,
  col: string
): string {
  return rows
    .map((r) => {
      const picked = r === row ? col : gridSelected(value, r, columns);
      return picked === null ? null : gridCell(r, picked);
    })
    .filter((p): p is string => p !== null)
    .join(MULTI_SEP);
}

// Đã trả lời đủ chưa — câu lưới phải chọn đủ mọi hàng
export function isAnswered(q: QuestionLike, value: string | undefined): boolean {
  if (!value?.trim()) return false;
  if (q.question_type !== "grid") return true;
  const columns = q.options || [];
  return gridRows(q).every((r) => gridSelected(value, r, columns) !== null);
}
