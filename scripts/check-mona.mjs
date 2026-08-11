// Kiểm tra dữ liệu xem video Mona đã có gì trong Supabase (chỉ đọc).
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

const { data: mona, error } = await sb
  .from("mona_learning")
  .select("ma, user_id, luot_xem_video, video_da_xem, video_da_50pct, tong_phut_xem, tong_luot_xem");

if (error) {
  console.log("Chưa đọc được bảng mona_learning:", error.message);
  process.exit(0);
}

const linked = mona.filter((m) => m.user_id);
const withVideo = linked.filter((m) => (m.video_da_xem || 0) > 0 || (m.tong_luot_xem || 0) > 0);
console.log(`mona_learning : ${mona.length} dòng`);
console.log(`  đã gắn user_id : ${linked.length}`);
console.log(`  có xem video   : ${withVideo.length}`);

// Mã video xuất hiện trong luot_xem_video
const codes = new Map();
for (const m of withVideo)
  for (const [code, n] of Object.entries(m.luot_xem_video || {}))
    if (n > 0) codes.set(code, (codes.get(code) || 0) + 1);
console.log(`\nMã video trong luot_xem_video (số học viên đã xem):`);
[...codes.entries()]
  .sort((a, b) => {
    const na = parseInt(a[0].replace(/\D/g, ""), 10) || 999;
    const nb = parseInt(b[0].replace(/\D/g, ""), 10) || 999;
    return na - nb;
  })
  .forEach(([c, n]) => console.log(`  ${c.padEnd(6)} : ${n}`));

// lesson_progress hiện có bao nhiêu dòng thật
const { count: lpCount } = await sb
  .from("lesson_progress")
  .select("*", { count: "exact", head: true });
console.log(`\nlesson_progress hiện có: ${lpCount} dòng (giây xem thật trong app)`);

const totalMin = withVideo.reduce((s, m) => s + (m.tong_phut_xem || 0), 0);
console.log(`Tổng phút xem trên Mona: ${totalMin.toLocaleString("vi-VN")} phút`);
