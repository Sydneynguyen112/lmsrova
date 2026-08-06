#!/usr/bin/env node
// Import học viên từ Google Sheets (CSV) vào Supabase — spec: plans/260806-roadmap-analytics/phase-06-import.md
// Cách dùng:
//   1. Export từng tab PRO của Sheets ra CSV, bỏ vào scripts/import/ (folder này KHÔNG commit)
//   2. Thêm vào .env.local: SUPABASE_URL=... và SUPABASE_SERVICE_ROLE_KEY=... (service key, KHÔNG phải anon)
//   3. node scripts/import-students.mjs scripts/import/*.csv
// Idempotent: chạy lại không nhân đôi (khớp theo email).

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

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

const COURSE_ID = "c-pro";
const FALLBACK_PASSWORD = "Rovatrading26";
// Sale = Andrew → mentor Andrew; Sale = Ham → mentor Ham; còn lại chia đều luân phiên (đã chốt)
const MENTOR_NAMES = { andrew: "Andrew", ham: "Ham" };

// Cột sheet cũ → stage_key mới. Sheet KHÔNG có Tư duy / Video hoàn thiện —
// học viên đang giữa lộ trình sẽ dừng ở chặng mới kế tiếp chặng cũ đã xong.
const STAGE_DATE_COLUMNS = [
  ["Ngày Onboarding", "onboarding"],
  ["Ngày Xem video", "xem_video"],
  ["Ngày Nến chủ", "nen_chu"],
  ["Ngày Cấu trúc", "cau_truc"],
  ["Ngày CT1", "ct1"],
  ["Ngày CT2", "ct2"],
  ["Ngày CT3", "ct3"],
  ["Ngày Tốt nghiệp", "tot_nghiep"],
];

// ── CSV parser (đủ dùng: quote, phẩy trong quote) ──
function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuote) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else inQuote = false;
      } else cell += ch;
    } else if (ch === '"') inQuote = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (cell !== "" || row.length) { row.push(cell); if (row.some((c) => c.trim() !== "")) rows.push(row); }
  return rows;
}

function parseVnDate(s) {
  // Nhận "13/06/26", "13/06/2026", "8/4/25" → Date (dd/mm/yy). Trả null nếu không đọc được.
  if (!s) return null;
  const m = String(s).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  let [, d, mo, y] = m;
  y = y.length === 2 ? "20" + y : y;
  const date = new Date(Date.UTC(+y, +mo - 1, +d, 4, 0, 0)); // 11h VN
  return isNaN(date.getTime()) ? null : date;
}

function normPhone(s) {
  const digits = String(s || "").replace(/[^\d]/g, "");
  return digits.length >= 8 ? digits : null;
}

function findCol(headers, name) {
  const idx = headers.findIndex((h) => h.trim().toLowerCase() === name.toLowerCase());
  if (idx >= 0) return idx;
  return headers.findIndex((h) => h.trim().toLowerCase().includes(name.toLowerCase()));
}

// ── main ──
const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Cách dùng: node scripts/import-students.mjs scripts/import/*.csv");
  process.exit(1);
}

const report = [["file", "ma_dh", "email", "action", "detail"]];
const log = (file, code, email, action, detail = "") => {
  report.push([file, code, email, action, detail]);
  console.log(`[${action}] ${code || "?"} ${email || ""} ${detail}`);
};

// Chuẩn bị: stages + mentors
const { data: stages, error: stErr } = await sb
  .from("roadmap_stages").select("*").eq("course_id", COURSE_ID).order("order_index");
if (stErr || !stages?.length) { console.error("Chưa seed roadmap_stages — chạy supabase-roadmap-analytics.sql trước.", stErr); process.exit(1); }
const stageByKey = Object.fromEntries(stages.map((s) => [s.stage_key, s]));

async function ensureMentor(name) {
  const { data } = await sb.from("profiles").select("id, full_name").eq("role", "mentor").ilike("full_name", `%${name}%`);
  if (data?.length) return data[0].id;
  const { data: created, error } = await sb.from("profiles")
    .insert({ full_name: name, email: `${name.toLowerCase()}@rova.local`, role: "mentor" })
    .select("id").single();
  if (error) throw error;
  console.log(`Tạo mentor ${name} (${created.id}) — email tạm ${name.toLowerCase()}@rova.local, admin cập nhật sau.`);
  return created.id;
}
const mentorIds = { andrew: await ensureMentor(MENTOR_NAMES.andrew), ham: await ensureMentor(MENTOR_NAMES.ham) };
let roundRobin = 0;

for (const file of files) {
  const rows = parseCsv(readFileSync(file, "utf8"));
  // Tìm dòng header: dòng chứa "Họ và tên"
  const headerIdx = rows.findIndex((r) => r.some((c) => c.trim().toLowerCase().includes("họ và tên")));
  if (headerIdx < 0) { log(file, "", "", "SKIP_FILE", "Không tìm thấy header 'Họ và tên'"); continue; }
  const headers = rows[headerIdx];
  const col = {
    code: findCol(headers, "No"),
    phone: findCol(headers, "SĐT"),
    name: findCol(headers, "Họ và tên"),
    orderDate: findCol(headers, "Ngày tạo đơn"),
    sale: findCol(headers, "Sale"),
    email: findCol(headers, "Email"),
    customerNote: findCol(headers, "Trạng thái khách hàng"),
    stages: STAGE_DATE_COLUMNS.map(([label, key]) => [key, findCol(headers, label)]),
  };

  for (const row of rows.slice(headerIdx + 1)) {
    const code = (row[col.code] || "").trim();
    const name = (row[col.name] || "").trim();
    if (!name && !code) continue;
    const phone = normPhone(row[col.phone]);
    const rawEmail = col.email >= 0 ? (row[col.email] || "").trim().toLowerCase() : "";
    const email = rawEmail || `${(code || "hv-" + Math.abs(hash(name))).toLowerCase().replace(/[^a-z0-9]/g, "")}@rova.local`;
    const password = phone || FALLBACK_PASSWORD;

    try {
      // 1. Auth user (skip nếu đã có)
      let authUserId = null;
      const { data: created, error: authErr } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
      if (authErr) {
        if (!String(authErr.message).toLowerCase().includes("already")) throw authErr;
      } else authUserId = created.user?.id;

      // 2. Profile upsert theo email
      const { data: existing } = await sb.from("profiles").select("id, mentor_id").eq("email", email).maybeSingle();
      const sale = (row[col.sale] || "").trim().toLowerCase();
      let mentorId;
      if (sale === "andrew") mentorId = mentorIds.andrew;
      else if (sale === "ham") mentorId = mentorIds.ham;
      else mentorId = roundRobin++ % 2 === 0 ? mentorIds.andrew : mentorIds.ham;

      let profileId;
      if (existing) {
        profileId = existing.id;
        await sb.from("profiles").update({
          full_name: name || undefined, phone: phone || undefined,
          external_code: code || undefined, source: "import-sheet",
          mentor_id: existing.mentor_id || mentorId,
        }).eq("id", profileId);
      } else {
        const insert = {
          full_name: name || code || email, email, phone, role: "student",
          external_code: code || null, source: "import-sheet", mentor_id: mentorId,
        };
        if (authUserId) insert.id = authUserId; // profile.id = auth uid nếu tạo mới được
        const { data: p, error: pErr } = await sb.from("profiles").insert(insert).select("id").single();
        if (pErr) throw pErr;
        profileId = p.id;
      }

      // 3. Enrollment
      const stageDates = col.stages.map(([key, idx]) => [key, idx >= 0 ? parseVnDate(row[idx]) : null]);
      const onboardDate = stageDates.find(([k]) => k === "onboarding")?.[1] || parseVnDate(row[col.orderDate]) || new Date();
      const gradDate = stageDates.find(([k]) => k === "tot_nghiep")?.[1] || null;
      const { data: enr } = await sb.from("enrollments").select("id").eq("user_id", profileId).eq("course_id", COURSE_ID).maybeSingle();
      if (!enr) {
        await sb.from("enrollments").insert({
          user_id: profileId, course_id: COURSE_ID,
          status: gradDate ? "completed" : "active",
          enrolled_at: onboardDate.toISOString(),
          completed_at: gradDate ? gradDate.toISOString() : null,
        });
      }

      // 4. Lịch sử chặng — source 'import'
      let prevDate = onboardDate;
      let opened = false;
      for (const stage of stages) {
        const sheetDate = stageDates.find(([k]) => k === stage.stage_key)?.[1] || null;
        // Chặng mới không có trong sheet (tu_duy, video_hoan_thien): coi như xong nếu chặng SAU nó trong sheet đã có ngày
        const laterDone = stages.some((s2) => s2.order_index > stage.order_index &&
          stageDates.find(([k]) => k === s2.stage_key)?.[1]);
        const completedDate = sheetDate || (laterDone ? prevDate : null);
        if (completedDate) {
          await sb.from("student_stage_progress").upsert({
            user_id: profileId, stage_id: stage.id,
            entered_at: prevDate.toISOString(),
            deadline_at: new Date(prevDate.getTime() + stage.target_days * 86400_000).toISOString(),
            completed_at: completedDate.toISOString(),
            source: "import",
          }, { onConflict: "user_id,stage_id", ignoreDuplicates: true });
          prevDate = completedDate;
        } else if (!opened && !gradDate) {
          await sb.from("student_stage_progress").upsert({
            user_id: profileId, stage_id: stage.id,
            entered_at: prevDate.toISOString(),
            deadline_at: new Date(prevDate.getTime() + stage.target_days * 86400_000).toISOString(),
            source: "import",
          }, { onConflict: "user_id,stage_id", ignoreDuplicates: true });
          opened = true;
          break;
        } else break;
      }

      // 5. Tốt nghiệp / ghi chú cũ
      if (gradDate) await sb.from("profiles").update({ status: "tot_nghiep" }).eq("id", profileId);
      const oldNote = col.customerNote >= 0 ? (row[col.customerNote] || "").trim() : "";
      if (oldNote) {
        const { data: hasNote } = await sb.from("user_notes").select("id").eq("user_id", profileId).ilike("content", `[Import]%`).limit(1);
        if (!hasNote?.length) {
          await sb.from("user_notes").insert({
            user_id: profileId, author_id: mentorId, channel: "app", note_type: "khac",
            content: `[Import] Ghi chú từ Sheets: ${oldNote}`,
          });
        }
      }

      log(file, code, email, existing ? "UPDATED" : "CREATED", `mentor=${mentorId === mentorIds.andrew ? "Andrew" : "Ham"}${gradDate ? " · tốt nghiệp" : ""}${rawEmail ? "" : " · email kỹ thuật"}`);
    } catch (err) {
      log(file, code, email, "ERROR", String(err?.message || err));
    }
  }
}

await sb.rpc("refresh_student_statuses");

const reportPath = `scripts/import/report-${new Date().toISOString().slice(0, 10)}.csv`;
writeFileSync(reportPath, report.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n"));
const counts = report.slice(1).reduce((a, r) => ((a[r[3]] = (a[r[3]] || 0) + 1), a), {});
console.log("\n=== KẾT QUẢ ===", counts, `\nBáo cáo: ${reportPath}`);

function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return h; }
