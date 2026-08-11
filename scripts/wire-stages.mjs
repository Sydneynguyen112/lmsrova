// Nối roadmap_stages.lesson_id / lesson_ids — nội dung khớp supabase-wire-stages.sql.
// Chỉ ghi cột liên kết trên bảng cấu hình, KHÔNG đụng student_stage_progress.
// Lùi lại: node scripts/wire-stages.mjs --undo  (set về NULL)
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const UNDO = process.argv.includes("--undo");

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

const WIRE = [
  // Chặng "Xem video" ứng với bài đầu tiên — không nối thì học viên đã qua chặng
  // này vẫn kẹt ở Chương 1 và không với tới bài tập ở Chương 2.
  // (Điều kiện qua chặng first_lesson không dùng lesson_id, chỉ dùng để mở khoá.)
  ["xem_video", { lesson_id: "l-mov3plq8-mgab" }, "Chương 1: Lời chào mừng"],
  ["nen_chu", { lesson_id: "l-msonwa80-ggne" }, "Chương 2: Nến"],
  ["cau_truc", { lesson_id: "l-msonwa80-st7y" }, "Chương 3: Cấu trúc thị trường"],
  ["tu_duy", { lesson_id: "l-msonwa80-tpap" }, "Chương 4: Tư duy phương pháp 3 hộp"],
  ["ct1", { lesson_id: "l-msonwa80-q7we" }, "Chương 5: Công thức 1"],
  ["ct2", { lesson_id: "l-msonwa80-t3t6" }, "Chương 6: Công thức 2"],
  ["ct3", { lesson_id: "l-msonwa80-3s1x" }, "Chương 7: Công thức 3"],
  [
    "video_hoan_thien",
    {
      lesson_ids: [
        "l-msonwa80-xnw0",
        "l-msonwa80-u83d",
        "l-msonwa80-2ffx",
        "l-msonwa81-7arb",
        "l-msonwa81-r9f9",
      ],
    },
    "Chương 8 → 12",
  ],
];

for (const [key, patch, label] of WIRE) {
  const payload = UNDO
    ? Object.fromEntries(Object.keys(patch).map((k) => [k, null]))
    : patch;
  const { data, error } = await sb
    .from("roadmap_stages")
    .update(payload)
    .eq("stage_key", key)
    .select("stage_key, lesson_id, lesson_ids");
  if (error) {
    console.error(`  ✗ ${key}: ${error.message}`);
    process.exit(1);
  }
  if (!data?.length) {
    console.error(`  ✗ ${key}: không khớp dòng nào — RLS chặn hoặc sai stage_key`);
    process.exit(1);
  }
  const got = data[0].lesson_id || `[${(data[0].lesson_ids || []).length} bài]`;
  console.log(`  ✓ ${key.padEnd(18)} → ${UNDO ? "NULL" : `${label}  (${got})`}`);
}

console.log(UNDO ? "\nĐã gỡ liên kết." : "\nĐã nối xong.");
