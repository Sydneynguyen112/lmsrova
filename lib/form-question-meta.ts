// Thiết lập riêng theo loại câu hỏi, lưu trong form_questions.meta (JSONB):
//   - "rating": meta.ratingMax = số sao tối đa (1–10, thiếu thì 5)
//   - "grid"  : options = các CỘT, meta.gridRows = các HÀNG; mỗi hàng chọn 1 cột
//   - "radio" / "checkbox": meta.allowOther = true → có thêm tuỳ chọn "Khác" để tự ghi,
//     câu trả lời lưu dạng "Khác: <nội dung>"
//   - "text": meta.profileField = "student_name" | "phone" → câu "Họ và tên" / "Số điện thoại",
//     ghi vào hồ sơ học viên khi nộp form tốt nghiệp / form onboarding
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

// ─── Tuỳ chọn "Khác" (tự ghi) ───

export const OTHER_LABEL = "Khác";
const OTHER_PREFIX = `${OTHER_LABEL}: `;

export function allowsOther(q: QuestionLike): boolean {
  return (q.question_type === "radio" || q.question_type === "checkbox") && metaOf(q).allowOther === true;
}

function answerParts(q: QuestionLike, value: string): string[] {
  if (!value) return [];
  return q.question_type === "checkbox" ? value.split(MULTI_SEP) : [value];
}

function isOtherPart(q: QuestionLike, part: string): boolean {
  return part.startsWith(`${OTHER_LABEL}:`) && !(q.options || []).includes(part);
}

// Nội dung ô "Khác" đang ghi — null khi học viên không chọn "Khác"
export function otherText(q: QuestionLike, value: string): string | null {
  const part = answerParts(q, value).find((p) => isOtherPart(q, p));
  return part === undefined ? null : part.slice(OTHER_PREFIX.length);
}

// Chọn / sửa / bỏ chọn (text = null) tuỳ chọn "Khác" → chuỗi câu trả lời mới
export function setOtherText(q: QuestionLike, value: string, text: string | null): string {
  const picked = text === null ? [] : [OTHER_PREFIX + text];
  if (q.question_type !== "checkbox") return picked[0] ?? "";
  return [...answerParts(q, value).filter((p) => !isOtherPart(q, p)), ...picked].join(MULTI_SEP);
}

// Câu trả lời để lưu: bỏ tuỳ chọn "Khác" đã chọn mà chưa ghi gì
export function cleanAnswer(q: QuestionLike, value: string | undefined): string {
  if (!value || !allowsOther(q)) return value || "";
  return answerParts(q, value)
    .filter((p) => !isOtherPart(q, p) || p.slice(OTHER_PREFIX.length).trim() !== "")
    .join(MULTI_SEP);
}

// Đã trả lời đủ chưa — câu lưới phải chọn đủ mọi hàng, chọn "Khác" thì phải ghi nội dung
export function isAnswered(q: QuestionLike, value: string | undefined): boolean {
  value = cleanAnswer(q, value);
  if (!value?.trim()) return false;
  if (q.question_type !== "grid") return true;
  const columns = q.options || [];
  return gridRows(q).every((r) => gridSelected(value, r, columns) !== null);
}

// ─── Câu "Họ và tên" / "Số điện thoại" của form tốt nghiệp + form onboarding ───
// meta.profileField = "student_name" | "phone": câu trả lời được ghi vào cột cùng tên của profiles khi nộp form.
// Họ tên ghi vào student_name ("Tên học viên"), KHÔNG ghi đè full_name ("Tên hồ sơ" = tên tài khoản lúc đăng ký).

export type ProfileField = "student_name" | "phone";

export const PROFILE_FIELD_LABELS: Record<ProfileField, string> = {
  student_name: "Tên học viên",
  phone: "Số điện thoại",
};

export function profileFieldOf(q: { question_type: string; meta?: unknown }): ProfileField | null {
  const f = metaOf(q).profileField;
  return q.question_type === "text" && (f === "student_name" || f === "phone") ? f : null;
}

// Gọn khoảng trắng + viết hoa chữ đầu mỗi từ ("nguyễn  đình HIẾU" → "Nguyễn Đình Hiếu")
export function cleanPersonName(raw: string): string {
  return raw
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toLocaleUpperCase("vi") + w.slice(1).toLocaleLowerCase("vi"))
    .join(" ");
}

// Về dạng 10 số bắt đầu bằng 0 như hồ sơ đang lưu ("+84 985.308.982" → "0985308982"); "" khi không phải số hợp lệ
export function cleanPhone(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("84")) d = "0" + d.slice(2);
  return /^0\d{9}$/.test(d) ? d : "";
}

// Thông tin hồ sơ học viên tự ghi trong form — trường nào form không hỏi hoặc ghi không hợp lệ thì không có
export function profileFieldsFrom(
  questions: { id: string; question_type: string; meta?: unknown }[],
  answers: Record<string, string | undefined>
): Partial<Record<ProfileField, string>> {
  const out: Partial<Record<ProfileField, string>> = {};
  for (const q of questions) {
    const field = profileFieldOf(q);
    if (!field || out[field]) continue;
    const raw = answers[q.id] || "";
    const value = field === "phone" ? cleanPhone(raw) : cleanPersonName(raw);
    if (value.length >= 2) out[field] = value;
  }
  return out;
}
