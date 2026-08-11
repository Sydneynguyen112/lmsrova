// Soi đúng những gì MỘT học viên nhìn thấy trên từng bài học (chỉ đọc).
// Dùng: node scripts/check-student-view.mjs email@cua-hoc-vien
//       node scripts/check-student-view.mjs            (lấy đại 1 người đang đứng ở chặng bài tập)
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
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const COURSE_ID = "c-mov3c81m-fdq2";
const emailArg = process.argv[2];

async function fetchAll(table, select, filter) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    let q = sb.from(table).select(select).range(from, from + 999);
    if (filter) q = filter(q);
    const { data, error } = await q;
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

const [stages, rawLessons, assignments] = await Promise.all([
  fetchAll("roadmap_stages", "*", (q) => q.eq("course_id", COURSE_ID)),
  fetchAll("lessons", "id, title, duration_sec, order_index, modules!inner(order_index, course_id)", (q) => q.eq("modules.course_id", COURSE_ID)),
  fetchAll("assignments", "id, title"),
]);
stages.sort((a, b) => a.order_index - b.order_index);
const lessons = rawLessons
  .sort((a, b) => a.modules.order_index - b.modules.order_index || a.order_index - b.order_index)
  .map((l) => ({ id: l.id, title: l.title, duration_sec: l.duration_sec || 0 }));
const assignById = new Map(assignments.map((a) => [a.id, a.title]));

// chọn học viên
let profile;
if (emailArg) {
  const { data } = await sb.from("profiles").select("id, full_name, email").ilike("email", emailArg).maybeSingle();
  profile = data;
  if (!profile) { console.log(`Không tìm thấy học viên có email ${emailArg}`); process.exit(0); }
} else {
  const nenChu = stages.find((s) => s.stage_key === "nen_chu");
  const rows = await fetchAll("student_stage_progress", "user_id, stage_id, completed_at");
  const standing = rows.find((r) => r.stage_id === nenChu.id && !r.completed_at);
  const { data } = await sb.from("profiles").select("id, full_name, email").eq("id", standing.user_id).maybeSingle();
  profile = data;
  console.log("(không truyền email — lấy đại 1 người đang đứng ở chặng Nến chủ)\n");
}

const [progress, lp, attempts, images] = await Promise.all([
  fetchAll("student_stage_progress", "stage_id, completed_at", (q) => q.eq("user_id", profile.id)),
  fetchAll("lesson_progress", "lesson_id, watched_seconds, completed", (q) => q.eq("user_id", profile.id)),
  fetchAll("quiz_attempts", "quiz_id, passed", (q) => q.eq("user_id", profile.id).eq("passed", true)),
  fetchAll("submission_images", "assignment_id, verdict", (q) => q.eq("user_id", profile.id)),
]);

const completedStages = new Set(progress.filter((p) => p.completed_at).map((p) => p.stage_id));
const watched = new Map(lp.map((r) => [r.lesson_id, r.watched_seconds || 0]));
const counts = new Map();
for (const im of images) {
  const c = counts.get(im.assignment_id) || { correct: 0, pending: 0, incorrect: 0 };
  c[im.verdict === "correct" ? "correct" : im.verdict === "pending" ? "pending" : "incorrect"]++;
  counts.set(im.assignment_id, c);
}

console.log(`HỌC VIÊN: ${profile.full_name || "(chưa có tên)"} · ${profile.email}`);
const standingStage = stages.find((s) => !completedStages.has(s.id));
console.log(`Đang đứng ở chặng: ${standingStage ? `${standingStage.order_index}. ${standingStage.title}` : "(xong hết)"}`);
console.log(`Số dòng lesson_progress: ${lp.length}\n`);

// mở khoá
let through = -1;
for (const s of stages) {
  if (!completedStages.has(s.id)) continue;
  for (const a of s.lesson_id ? [s.lesson_id] : s.lesson_ids || []) {
    const i = lessons.findIndex((l) => l.id === a);
    if (i > through) through = i;
  }
}

console.log("BÀI HỌC | MỞ KHOÁ? | TAB BÀI TẬP HIỆN GÌ");
console.log("─".repeat(78));
lessons.forEach((l, i) => {
  const unlocked = i <= through + 1;
  const stage = stages.find((s) => s.completion_type === "assignment_quiz" && s.lesson_id === l.id);
  let tab = "(bài này không có bài tập)";
  if (stage) {
    const done = completedStages.has(stage.id);
    const c = counts.get(stage.assignment_id) || { correct: 0, pending: 0, incorrect: 0 };
    tab = done
      ? `"Đã qua chặng" — KHÔNG có ô nộp ảnh`
      : `Ô NỘP ẢNH hiện · ${c.correct}/${stage.required_correct_images} đúng · bài tập "${assignById.get(stage.assignment_id) || stage.assignment_id}"`;
  }
  console.log(`${(i + 1 + ". " + l.title).padEnd(38)} ${unlocked ? "mở " : "KHOÁ"} | ${tab}`);
});
