// MÔ PHỎNG KHÔ — không ghi gì.
// Chuỗi đầy đủ: dữ liệu xem video Mona → hoàn thành chặng → số bài học mở khoá.
// Luật chặng lấy đúng từ rova-ops/scripts/sync-mona-roadmap.mjs
// Chạy: node scripts/dryrun-mona-unlock.mjs
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

const [stages, rawLessons, mona, stageRows] = await Promise.all([
  fetchAll("roadmap_stages", "id, stage_key, order_index", (q) => q.eq("course_id", COURSE_ID)),
  fetchAll("lessons", "id, title, order_index, modules!inner(order_index, course_id)", (q) =>
    q.eq("modules.course_id", COURSE_ID)
  ),
  fetchAll("mona_learning", "ma, user_id, luot_xem_video, video_da_xem, tong_luot_xem", (q) =>
    q.not("user_id", "is", null)
  ),
  fetchAll("student_stage_progress", "user_id, stage_id, completed_at"),
]);

stages.sort((a, b) => a.order_index - b.order_index);
const lessons = rawLessons
  .sort((a, b) => a.modules.order_index - b.modules.order_index || a.order_index - b.order_index)
  .map((l) => ({ id: l.id, title: l.title }));

// Ghép chặng → bài học (bảng đề xuất, khớp với sync-mona-roadmap.mjs)
const STAGE_LESSON = {
  nen_chu: "l-msonwa80-ggne",
  cau_truc: "l-msonwa80-st7y",
  tu_duy: "l-msonwa80-tpap",
  ct1: "l-msonwa80-q7we",
  ct2: "l-msonwa80-t3t6",
  ct3: "l-msonwa80-3s1x",
};
const STAGE_GROUP = {
  video_hoan_thien: [
    "l-msonwa80-xnw0",
    "l-msonwa80-u83d",
    "l-msonwa80-2ffx",
    "l-msonwa81-7arb",
    "l-msonwa81-r9f9",
  ],
};

// Luật đạt chặng theo video Mona — sao đúng từ rova-ops
function stageMet(key, pv, anyVideo) {
  switch (key) {
    case "onboarding":
    case "xem_video": return anyVideo;
    case "nen_chu": return (pv.Ch2 || 0) >= 1;
    case "cau_truc": return (pv.Ch3 || 0) >= 1;
    case "tu_duy": return (pv.Ch4 || 0) >= 1;
    case "ct1": return (pv.Ch5 || 0) >= 1;
    case "ct2": return (pv.Ch6 || 0) >= 1;
    case "ct3": return (pv.Ch7 || 0) >= 1;
    case "video_hoan_thien":
      return ["Ch8", "Ch9", "Ch10", "Ch11", "Ch12"].every((c) => (pv[c] || 0) >= 1);
    case "tot_nghiep": return false;
    default: return false;
  }
}

const completedNow = new Map(); // user -> Set(stage_id) đã completed sẵn trong DB
for (const r of stageRows) {
  if (!r.completed_at) continue;
  if (!completedNow.has(r.user_id)) completedNow.set(r.user_id, new Set());
  completedNow.get(r.user_id).add(r.stage_id);
}

// Số bài mở khoá = (vị trí chặng xa nhất đã xong) + 1, chặn ở tổng số bài
function unlockedCount(completedIds) {
  let through = -1;
  for (const s of stages) {
    if (!completedIds.has(s.id)) continue;
    const anchors = STAGE_LESSON[s.stage_key]
      ? [STAGE_LESSON[s.stage_key]]
      : STAGE_GROUP[s.stage_key] || [];
    for (const a of anchors) {
      const idx = lessons.findIndex((l) => l.id === a);
      if (idx > through) through = idx;
    }
  }
  return Math.min(lessons.length, through + 2); // +1 bài kế được mở
}

const dist = new Map();
let gained = 0, lost = 0, noVideo = 0;
const landing = {};

for (const m of mona) {
  const pv = m.luot_xem_video || {};
  const anyVideo = (m.video_da_xem || 0) > 0 || (m.tong_luot_xem || 0) > 0;
  if (!anyVideo) { noVideo++; continue; }

  const before = completedNow.get(m.user_id) || new Set();
  const after = new Set(before);
  let landingKey = "(xong hết 10 chặng)";
  for (const s of stages) {
    if (after.has(s.id)) continue;
    if (stageMet(s.stage_key, pv, anyVideo)) after.add(s.id);
    else { landingKey = s.stage_key; break; }
  }
  landing[landingKey] = (landing[landingKey] || 0) + 1;

  const b = unlockedCount(before);
  const a = unlockedCount(after);
  if (a > b) gained++;
  if (a < b) lost++;
  const k = `${b} → ${a}`;
  dist.set(k, (dist.get(k) || 0) + 1);
}

console.log(`\n=== ${mona.length} học viên Mona đã gắn tài khoản LMS · ${lessons.length} bài học ===\n`);
console.log(`  Được mở thêm video : ${gained}`);
console.log(`  Bị khoá bớt        : ${lost}   ${lost ? "← PHẢI DỪNG" : "(an toàn)"}`);
console.log(`  Chưa xem gì, bỏ qua: ${noVideo}`);

console.log(`\n=== SỐ BÀI MỞ KHOÁ (hiện tại → sau khi map) ===`);
[...dist.entries()]
  .sort((a, b) => b[1] - a[1])
  .forEach(([k, n]) => console.log(`   ${String(n).padStart(4)} học viên : ${k}`));

console.log(`\n=== SAU KHI MAP, HỌC VIÊN ĐỨNG Ở CHẶNG NÀO ===`);
for (const s of stages)
  if (landing[s.stage_key])
    console.log(`   ${String(s.order_index).padStart(2)}. ${s.stage_key.padEnd(18)}: ${landing[s.stage_key]}`);
for (const k of Object.keys(landing))
  if (!stages.some((s) => s.stage_key === k)) console.log(`   ${k}: ${landing[k]}`);
