// MÔ PHỎNG KHÔ — không ghi gì vào DB.
// So sánh số bài học được mở khoá của từng học viên: HIỆN TẠI vs SAU KHI nối lesson_id.
// Chạy: node scripts/dryrun-unlock.mjs
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
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const COURSE_ID = "c-mov3c81m-fdq2";
const WATCH_THRESHOLD = 0.5;

// Bảng ghép đề xuất (giống supabase-wire-stages.sql)
const PROPOSED = {
  nen_chu: "l-msonwa80-ggne",
  cau_truc: "l-msonwa80-st7y",
  tu_duy: "l-msonwa80-tpap",
  ct1: "l-msonwa80-q7we",
  ct2: "l-msonwa80-t3t6",
  ct3: "l-msonwa80-3s1x",
};
const PROPOSED_GROUP = {
  video_hoan_thien: [
    "l-msonwa80-xnw0",
    "l-msonwa80-u83d",
    "l-msonwa80-2ffx",
    "l-msonwa81-7arb",
    "l-msonwa81-r9f9",
  ],
};

// PHẢI phân trang: student_stage_progress có vài nghìn dòng, Supabase mặc định
// chỉ trả 1000 dòng đầu — thiếu trang là ra số liệu sai hoàn toàn.
async function fetchAll(table, select, filter) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    let q = supabase.from(table).select(select).range(from, from + 999);
    if (filter) q = filter(q);
    const { data, error } = await q;
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

const [stages, rawLessons, progress, lp, quizzes, attempts] = await Promise.all([
  fetchAll("roadmap_stages", "*", (q) => q.eq("course_id", COURSE_ID).order("order_index")),
  fetchAll("lessons", "id, title, duration_sec, order_index, modules!inner(order_index, course_id)", (q) => q.eq("modules.course_id", COURSE_ID)),
  fetchAll("student_stage_progress", "user_id, stage_id, completed_at"),
  fetchAll("lesson_progress", "user_id, lesson_id, watched_seconds"),
  fetchAll("quizzes", "id, lesson_id"),
  fetchAll("quiz_attempts", "user_id, quiz_id, passed", (q) => q.eq("passed", true)),
]);

const lessons = rawLessons
  .sort((a, b) => a.modules.order_index - b.modules.order_index || a.order_index - b.order_index)
  .map((l) => ({ id: l.id, title: l.title, duration_sec: l.duration_sec || 0 }));

const lessonQuizMap = new Map();
for (const q of quizzes || []) if (q.lesson_id) lessonQuizMap.set(q.lesson_id, q.id);

// Gom theo học viên
const users = new Set([...progress.map((p) => p.user_id), ...lp.map((r) => r.user_id)]);

function computeUnlock(userId, stageList) {
  const completedStageIds = new Set(
    progress.filter((p) => p.user_id === userId && p.completed_at).map((p) => p.stage_id)
  );
  const watched = new Map();
  for (const r of lp) if (r.user_id === userId) watched.set(r.lesson_id, r.watched_seconds || 0);
  const passed = new Set(attempts.filter((a) => a.user_id === userId).map((a) => a.quiz_id));

  const stageByLesson = new Map();
  for (const s of stageList)
    if (s.completion_type === "assignment_quiz" && s.lesson_id) stageByLesson.set(s.lesson_id, s);

  let completedThrough = -1;
  for (const s of stageList) {
    if (!completedStageIds.has(s.id)) continue;
    const anchors = s.lesson_id ? [s.lesson_id] : s.lesson_ids || [];
    for (const a of anchors) {
      const idx = lessons.findIndex((l) => l.id === a);
      if (idx > completedThrough) completedThrough = idx;
    }
  }

  let unlocked = 0, prevAllDone = true;
  lessons.forEach((lesson, index) => {
    if (prevAllDone) unlocked++;
    const w = watched.get(lesson.id) || 0;
    let doneL = lesson.duration_sec ? w >= lesson.duration_sec * WATCH_THRESHOLD : w > 0;
    const qid = lessonQuizMap.get(lesson.id);
    if (doneL && qid && !passed.has(qid)) doneL = false;
    const st = stageByLesson.get(lesson.id);
    if (doneL && st && !completedStageIds.has(st.id)) doneL = false;
    if (index <= completedThrough) doneL = true;
    prevAllDone = prevAllDone && doneL;
  });
  return unlocked;
}

const after = stages.map((s) => ({
  ...s,
  lesson_id: s.lesson_id || PROPOSED[s.stage_key] || null,
  lesson_ids: s.lesson_ids?.length ? s.lesson_ids : PROPOSED_GROUP[s.stage_key] || null,
}));

let same = 0, improved = 0, worse = 0;
const buckets = new Map();
for (const u of users) {
  const before = computeUnlock(u, stages);
  const now = computeUnlock(u, after);
  if (now > before) improved++;
  else if (now < before) worse++;
  else same++;
  const k = `${before} → ${now}`;
  buckets.set(k, (buckets.get(k) || 0) + 1);
}

console.log(`\nTổng ${users.size} học viên · ${lessons.length} bài học\n`);
console.log(`  Mở thêm được video : ${improved}`);
console.log(`  Không đổi          : ${same}`);
console.log(`  BỊ KHOÁ BỚT        : ${worse}   ${worse ? "← PHẢI DỪNG LẠI" : "(an toàn)"}`);
console.log("\nPhân bố (số bài mở khoá trước → sau):");
[...buckets.entries()]
  .sort((a, b) => b[1] - a[1])
  .forEach(([k, n]) => console.log(`   ${String(n).padStart(4)} học viên : ${k}`));
