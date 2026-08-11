// Chẩn đoán: chặng bài tập neo vào bài học nào, có đủ liên kết để qua chặng không.
// Chạy: node scripts/check-stages.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// PHẢI phân trang — student_stage_progress vài nghìn dòng, mặc định chỉ trả 1000.
async function fetchAll(table, select) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select(select).range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

const [stages, lessons, progress] = await Promise.all([
  fetchAll("roadmap_stages", "*"),
  fetchAll("lessons", "id, title, order_index, modules!inner(order_index)"),
  fetchAll("student_stage_progress", "stage_id, completed_at"),
]);
stages.sort((a, b) => a.order_index - b.order_index);

const lessonById = new Map(lessons.map((l) => [l.id, l]));

// Chặng nào là "cửa tử" — điều kiện qua chặng không bao giờ đạt được vì thiếu liên kết
console.log("\n=== KIỂM TRA LIÊN KẾT TỪNG CHẶNG ===");
for (const s of stages) {
  const problems = [];
  if (s.completion_type === "assignment_quiz") {
    if (!s.assignment_id) problems.push("thiếu assignment_id → không bao giờ qua được");
    if (!s.lesson_id) problems.push("thiếu lesson_id → không hiện ô bài tập trong bài học");
  }
  if (s.completion_type === "lesson_quiz") {
    if (!s.lesson_id) problems.push("thiếu lesson_id → KHÔNG BAO GIỜ QUA ĐƯỢC");
    else if (!lessonById.has(s.lesson_id)) problems.push("lesson_id trỏ vào bài không tồn tại");
  }
  if (s.completion_type === "lesson_group") {
    const ids = s.lesson_ids || [];
    if (ids.length === 0) problems.push("lesson_ids rỗng → KHÔNG BAO GIỜ QUA ĐƯỢC");
    else {
      const missing = ids.filter((id) => !lessonById.has(id));
      if (missing.length) problems.push(`${missing.length} lesson_ids trỏ vào bài không tồn tại`);
    }
  }
  if (s.completion_type === "graduation_form" && !s.form_id)
    problems.push("thiếu form_id → KHÔNG BAO GIỜ QUA ĐƯỢC");

  const inProgress = progress.filter((p) => p.stage_id === s.id);
  const done = inProgress.filter((p) => p.completed_at).length;
  const stuck = inProgress.length - done;

  const flag = problems.length ? "  ✗" : "  ✓";
  console.log(
    `${flag} ${String(s.order_index).padStart(2)}. [${s.completion_type}] ${s.title}` +
      `  — ${done} đã qua, ${stuck} đang đứng`
  );
  for (const p of problems) console.log(`       ! ${p}`);
}

console.log("\n=== GỢI Ý GHÉP CHẶNG → BÀI HỌC (theo tên) ===");
const sorted = [...lessons].sort(
  (a, b) => a.modules.order_index - b.modules.order_index || a.order_index - b.order_index
);
for (const s of stages.filter((x) => ["assignment_quiz", "lesson_quiz"].includes(x.completion_type))) {
  console.log(`  "${s.title}" (${s.stage_key})`);
  sorted.forEach((l, i) => console.log(`      ${String(i + 1).padStart(2)}. ${l.title}  [${l.id}]`));
  break; // in danh sách bài học một lần là đủ để ghép tay
}
