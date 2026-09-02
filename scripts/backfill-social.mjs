#!/usr/bin/env node
// Backfill social learning cho học viên cũ (import) — spec: plans/260902-social-learning/phase-04-admin-backfill.md
// Cấp huy hiệu chặng + nâng tier cho ai đã tốt nghiệp. KHÔNG tạo activity_events,
// KHÔNG cộng effort_daily quá khứ (feed sạch ngày go-live; điểm và chuỗi bắt đầu từ 0).
// Cách dùng:
//   node scripts/backfill-social.mjs --dry-run   (xem trước, không ghi gì)
//   node scripts/backfill-social.mjs             (chạy thật)
// Idempotent: chạy lại không nhân đôi (upsert ignoreDuplicates + tier chỉ nâng từ 'pro').

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";

// ── env ──
if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}
const URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error("Thiếu SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY trong .env.local");
  process.exit(1);
}
const sb = createClient(URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  console.log(DRY_RUN ? "== DRY RUN — không ghi gì vào DB ==" : "== CHẠY THẬT ==");

  // 1. Danh mục: chặng + huy hiệu đã seed
  const [{ data: stages, error: e1 }, { data: badges, error: e2 }] = await Promise.all([
    sb.from("roadmap_stages").select("id, stage_key, completion_type"),
    sb.from("badges").select("id"),
  ]);
  if (e1 || e2) throw e1 || e2;
  const stageById = new Map(stages.map((s) => [s.id, s]));
  const badgeIds = new Set(badges.map((b) => b.id));

  // 2. Mọi chặng đã hoàn thành (mọi source — học viên cũ xứng đáng có huy hiệu)
  const { data: progress, error: e3 } = await sb
    .from("student_stage_progress")
    .select("user_id, stage_id")
    .not("completed_at", "is", null);
  if (e3) throw e3;

  const badgeRows = [];
  const seen = new Set();
  const gradUserIds = new Set();

  for (const p of progress) {
    const stage = stageById.get(p.stage_id);
    if (!stage) continue;

    const stageBadge = `stage_${stage.stage_key}`;
    const key = `${p.user_id}|${stageBadge}`;
    if (badgeIds.has(stageBadge) && !seen.has(key)) {
      seen.add(key);
      badgeRows.push({ user_id: p.user_id, badge_id: stageBadge });
    }

    if (stage.completion_type === "graduation_form") {
      gradUserIds.add(p.user_id);
      for (const b of ["graduate_pro", "tier_pro_graduate"]) {
        const k = `${p.user_id}|${b}`;
        if (badgeIds.has(b) && !seen.has(k)) {
          seen.add(k);
          badgeRows.push({ user_id: p.user_id, badge_id: b });
        }
      }
    }
  }

  // 3. Ai đang tier='pro' mà đã tốt nghiệp → nâng (chỉ nâng, không hạ)
  const gradIds = [...gradUserIds];
  let tierUpIds = [];
  if (gradIds.length > 0) {
    const { data: profs, error: e4 } = await sb
      .from("profiles")
      .select("id, tier")
      .in("id", gradIds);
    if (e4) throw e4;
    tierUpIds = profs.filter((p) => !p.tier || p.tier === "pro").map((p) => p.id);
  }

  console.log(`Huy hiệu sẽ upsert : ${badgeRows.length} dòng (trùng sẵn có sẽ bị bỏ qua)`);
  console.log(`Người đã tốt nghiệp: ${gradIds.length}`);
  console.log(`Tier sẽ nâng lên pro_graduate: ${tierUpIds.length} người`);

  if (DRY_RUN) {
    console.log("Dry run xong — không có gì được ghi.");
    return;
  }

  // 4. Ghi thật — upsert theo lô 500 để không quá payload
  for (let i = 0; i < badgeRows.length; i += 500) {
    const chunk = badgeRows.slice(i, i + 500);
    const { error } = await sb
      .from("user_badges")
      .upsert(chunk, { onConflict: "user_id,badge_id", ignoreDuplicates: true });
    if (error) throw error;
    console.log(`  upsert huy hiệu ${Math.min(i + 500, badgeRows.length)}/${badgeRows.length}`);
  }

  if (tierUpIds.length > 0) {
    const { error } = await sb
      .from("profiles")
      .update({ tier: "pro_graduate" })
      .in("id", tierUpIds)
      .eq("tier", "pro");
    if (error) throw error;
  }

  // 5. Kiểm chứng: feed phải KHÔNG phình ra vì backfill
  const { count } = await sb
    .from("activity_events")
    .select("*", { count: "exact", head: true });
  console.log(`Xong. activity_events hiện có ${count ?? "?"} dòng (backfill không được thêm dòng nào).`);
}

main().catch((err) => {
  console.error("Backfill thất bại:", err.message || err);
  process.exit(1);
});
