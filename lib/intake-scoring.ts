// Engine chấm điểm bài test khám bệnh — plans/260807-intake-assessment/plan.md
// Thuần hàm, không I/O. KHÔNG đụng lib/api.ts.
// ⚠️ File này chỉ chứa LOGIC. Mọi chữ nghĩa (nhãn, luận giải, câu hỏi) và công
// tắc bật/tắt nằm ở lib/intake-content/ — xem index.ts bên đó.
// ⚠️ Contract IntakeMeta + các hằng số nhãn được MIRROR sang rova-ops
// (rova-ops/lib/intake-meta.ts) — sửa ở đây thì sửa y hệt bên đó.
import { lifePathNumber, westernZodiac, canChi } from "./astro";
import {
  LIFE_PATH_INFO,
  ZODIAC_INFO,
  DIMENSION_LABELS,
  TRADING_DIMENSIONS,
  FLAG_LABELS,
  PERSONALITY_INFO,
  PERSONALITY_TIEBREAK,
} from "./intake-content";
import type {
  IntakeSection,
  IntakeDimension,
  PersonalityGroup,
  IntakeFlag,
  ZodiacSlug,
  IntakeMeta,
  IntakeQuestion,
  PersonalityEntry,
  Classification,
  CareGroup,
} from "./intake-content";

// Đọc lại từ kho content để nơi đang `import ... from "@/lib/intake-scoring"`
// không phải sửa gì.
export type {
  IntakeSection,
  IntakeDimension,
  PersonalityGroup,
  IntakeFlag,
  CareGroup,
  Classification,
  IntakeMeta,
  IntakeQuestion,
} from "./intake-content";
export {
  SECTION_LABELS,
  DIMENSION_LABELS,
  TRADING_DIMENSIONS,
  FLAG_LABELS,
  CARE_GROUP_LABELS,
  PERSONALITY_INFO,
} from "./intake-content";

const SECTIONS: IntakeSection[] = ["birth", "personality", "trading", "personal"];
const DIMENSIONS: IntakeDimension[] = Object.keys(DIMENSION_LABELS) as IntakeDimension[];

// Parser trơ an toàn: meta thiếu/sai shape → câu hỏi thường, không crash, không chấm.
export function parseMeta(q: IntakeQuestion): IntakeMeta {
  const raw = (q.meta && typeof q.meta === "object" ? q.meta : {}) as Record<string, unknown>;
  const section = SECTIONS.includes(raw.section as IntakeSection)
    ? (raw.section as IntakeSection) : null;
  const dimension = DIMENSIONS.includes(raw.dimension as IntakeDimension)
    ? (raw.dimension as IntakeDimension) : null;
  const optionScores = Array.isArray(raw.optionScores) && raw.optionScores.every((s) => typeof s === "number")
    ? (raw.optionScores as number[]) : null;
  const optionGroups = raw.optionGroups && typeof raw.optionGroups === "object"
    ? (raw.optionGroups as Record<string, PersonalityGroup>) : null;
  const optionFlags = raw.optionFlags && typeof raw.optionFlags === "object"
    ? (raw.optionFlags as Record<string, IntakeFlag[]>) : null;
  const semantic = raw.semantic === "birth_date" || raw.semantic === "birth_time" || raw.semantic === "mentor"
    ? raw.semantic : null;
  const optionMentorEmails = Array.isArray(raw.optionMentorEmails)
    ? raw.optionMentorEmails.map((e) => (typeof e === "string" && e.trim() ? e.trim().toLowerCase() : null))
    : null;
  return { section, dimension, optionScores, optionGroups, optionFlags, semantic, optionMentorEmails, sensitive: raw.sensitive === true };
}

// answers: questionId -> option label (radio/select) hoặc chuỗi "|||"-joined (checkbox).
// Câu bị bỏ qua = không có key trong answers.
function chosenIndexes(q: IntakeQuestion, answers: Record<string, string>): number[] {
  const value = answers[q.id];
  if (value === undefined || value === "") return [];
  const parts = q.question_type === "checkbox" ? value.split("|||") : [value];
  const idxs: number[] = [];
  for (const p of parts) {
    const i = (q.options || []).indexOf(p);
    if (i >= 0) idxs.push(i);
  }
  return idxs;
}

// ─── Chấm điểm theo chiều ───

export interface DimensionScore { earned: number; max: number; pct: number }
export type DimensionScores = Partial<Record<IntakeDimension, DimensionScore>>;

export function computeDimensionScores(
  questions: IntakeQuestion[],
  answers: Record<string, string>
): DimensionScores {
  const acc: DimensionScores = {};
  for (const q of questions) {
    const meta = parseMeta(q);
    if (!meta.dimension || !meta.optionScores || meta.optionScores.length === 0) continue;
    const idxs = chosenIndexes(q, answers);
    if (idxs.length === 0) continue; // câu bỏ qua không tính vào max — không phạt người không chia sẻ
    const max = Math.max(...meta.optionScores);
    // checkbox: lấy điểm cao nhất trong các option đã chọn
    const earned = Math.max(...idxs.map((i) => meta.optionScores![i] ?? 0));
    const cur = acc[meta.dimension] || { earned: 0, max: 0, pct: 0 };
    cur.earned += earned;
    cur.max += max;
    acc[meta.dimension] = cur;
  }
  for (const key of Object.keys(acc) as IntakeDimension[]) {
    const d = acc[key]!;
    d.pct = d.max > 0 ? Math.round((d.earned / d.max) * 100) : 0;
  }
  return acc;
}

// ─── Cờ rủi ro ───

export function collectFlags(
  questions: IntakeQuestion[],
  answers: Record<string, string>
): IntakeFlag[] {
  const found = new Set<IntakeFlag>();
  for (const q of questions) {
    const meta = parseMeta(q);
    if (!meta.optionFlags) continue;
    for (const i of chosenIndexes(q, answers)) {
      for (const f of meta.optionFlags[String(i)] || []) {
        if (f in FLAG_LABELS) found.add(f);
      }
    }
  }
  return Array.from(found);
}

// ─── Nhóm tính cách: bầu đa số ───

export function derivePersonalityGroup(
  questions: IntakeQuestion[],
  answers: Record<string, string>
): PersonalityGroup {
  const votes: Record<PersonalityGroup, number> = {
    than_trong: 0, ky_luat: 0, lieu_linh: 0, cam_tinh: 0,
  };
  for (const q of questions) {
    const meta = parseMeta(q);
    if (!meta.optionGroups) continue;
    for (const i of chosenIndexes(q, answers)) {
      const g = meta.optionGroups[String(i)];
      if (g && g in votes) votes[g]++;
    }
  }
  // Hòa phiếu → ưu tiên theo PERSONALITY_TIEBREAK (đổi thứ tự ở intake-content/personality.ts)
  let best: PersonalityGroup = PERSONALITY_TIEBREAK[0];
  let bestVotes = -1;
  for (const g of PERSONALITY_TIEBREAK) {
    if (votes[g] > bestVotes) { best = g; bestVotes = votes[g]; }
  }
  return best;
}

// ─── Nhóm chăm sóc ───

// Luật đã chốt: nợ nặng HOẶC ≥2 cờ mềm → ưu tiên chăm sóc;
// đúng 1 cờ → theo dõi sát; sạch cờ + trading ≥70% → tiềm năng cao; còn lại bình thường.
export function computeCareGroup(flags: IntakeFlag[], dims: DimensionScores): CareGroup {
  const softFlags: IntakeFlag[] = ["khong_thu_nhap_chinh", "ap_luc_tai_chinh", "be_tac", "von_vay"];
  const softCount = flags.filter((f) => softFlags.includes(f)).length;
  if (flags.includes("no_nang") || softCount >= 2) return "uu_tien_cham_soc";
  if (flags.length >= 1) return "theo_doi_sat";
  const avg = tradingAvgPct(dims);
  if (avg !== null && avg >= 70) return "tiem_nang_cao";
  return "binh_thuong";
}

export function tradingAvgPct(dims: DimensionScores): number | null {
  const pcts = TRADING_DIMENSIONS
    .map((d) => dims[d]?.pct)
    .filter((p): p is number => typeof p === "number");
  if (pcts.length === 0) return null;
  return Math.round(pcts.reduce((s, p) => s + p, 0) / pcts.length);
}

// ─── Map về classification legacy (newbie|beginner|intermediate|advanced) ───

export function mapClassification(
  questions: IntakeQuestion[],
  answers: Record<string, string>,
  dims: DimensionScores
): Classification {
  // Có đáp án chạm sàn ở chiều trading (điểm thấp nhất của câu) → cap newbie,
  // tương đương luật has_any_one của onboarding cũ.
  let hasFloor = false;
  for (const q of questions) {
    const meta = parseMeta(q);
    if (!meta.dimension || !TRADING_DIMENSIONS.includes(meta.dimension)) continue;
    if (!meta.optionScores || meta.optionScores.length === 0) continue;
    const min = Math.min(...meta.optionScores);
    for (const i of chosenIndexes(q, answers)) {
      if ((meta.optionScores[i] ?? min) === min && min < Math.max(...meta.optionScores)) {
        hasFloor = true;
      }
    }
  }
  if (hasFloor) return "newbie";
  const avg = tradingAvgPct(dims);
  if (avg === null || avg <= 25) return "newbie";
  if (avg <= 50) return "beginner";
  if (avg <= 75) return "intermediate";
  return "advanced";
}

// ─── Kết quả tổng hợp ───

export interface StudentVisibleResult {
  personality_group: PersonalityGroup;
  personality: PersonalityEntry;
  life_path_number: number | null;
  life_path_label: string | null;
  life_path_trait: string | null;
  zodiac: ZodiacSlug | null;
  zodiac_label: string | null;
  zodiac_trait: string | null;
  can_chi: string | null;
  classification: Classification;
  trading_dimensions: { key: IntakeDimension; label: string; pct: number }[];
}

export interface IntakeComputed {
  birth_date: string | null;
  birth_time: string | null;
  life_path_number: number | null;
  zodiac: ZodiacSlug | null;
  can_chi: string | null;
  personality_group: PersonalityGroup;
  classification: Classification;
  care_group: CareGroup;
  dimension_scores: DimensionScores;
  flags: IntakeFlag[];
  student_visible: StudentVisibleResult;
}

export function extractBirthAnswers(
  questions: IntakeQuestion[],
  answers: Record<string, string>
): { birthDate: string | null; birthTime: string | null } {
  let birthDate: string | null = null;
  let birthTime: string | null = null;
  for (const q of questions) {
    const meta = parseMeta(q);
    const v = answers[q.id];
    if (!v) continue;
    if (meta.semantic === "birth_date" && /^\d{4}-\d{2}-\d{2}$/.test(v)) birthDate = v;
    if (meta.semantic === "birth_time" && /^\d{2}:\d{2}/.test(v)) birthTime = v.slice(0, 5);
  }
  return { birthDate, birthTime };
}

// Orchestrator duy nhất — mọi field cho intake_results ra từ đây.
export function computeIntake(
  questions: IntakeQuestion[],
  answers: Record<string, string>
): IntakeComputed {
  const { birthDate, birthTime } = extractBirthAnswers(questions, answers);
  const dims = computeDimensionScores(questions, answers);
  const flags = collectFlags(questions, answers);
  const personalityGroup = derivePersonalityGroup(questions, answers);
  const classification = mapClassification(questions, answers, dims);
  const careGroup = computeCareGroup(flags, dims);

  let lifePath: number | null = null;
  let zodiac: ZodiacSlug | null = null;
  let chi: string | null = null;
  if (birthDate) {
    lifePath = lifePathNumber(birthDate);
    const [y, m, d] = birthDate.split("-").map(Number);
    zodiac = westernZodiac(m, d);
    chi = canChi(y).label;
  }

  // Payload DUY NHẤT màn kết quả học viên được đọc.
  // Tuyệt đối không đưa flags / care_group / câu trả lời nhạy cảm vào đây.
  const studentVisible: StudentVisibleResult = {
    personality_group: personalityGroup,
    personality: PERSONALITY_INFO[personalityGroup],
    life_path_number: lifePath,
    life_path_label: lifePath !== null ? LIFE_PATH_INFO[lifePath]?.label ?? null : null,
    life_path_trait: lifePath !== null ? LIFE_PATH_INFO[lifePath]?.trait ?? null : null,
    zodiac,
    zodiac_label: zodiac ? ZODIAC_INFO[zodiac].label : null,
    zodiac_trait: zodiac ? ZODIAC_INFO[zodiac].trait : null,
    can_chi: chi,
    classification,
    trading_dimensions: TRADING_DIMENSIONS
      .filter((d) => dims[d])
      .map((d) => ({ key: d, label: DIMENSION_LABELS[d], pct: dims[d]!.pct })),
  };

  return {
    birth_date: birthDate,
    birth_time: birthTime,
    life_path_number: lifePath,
    zodiac,
    can_chi: chi,
    personality_group: personalityGroup,
    classification,
    care_group: careGroup,
    dimension_scores: dims,
    flags,
    student_visible: studentVisible,
  };
}

// ─── Blob tương thích cho profiles.onboarding_survey ───
// lib/roadmap.ts:292 hoàn thành stage onboarding dựa trên !!profile.onboarding_survey
// → BẮT BUỘC ghi blob này khi submit. Key là nhãn tiếng Việt dễ đọc để panel cũ
// bên rova-ops (render labels[key] || key) hiện đẹp mà không cần sửa gì.
// KHÔNG đưa dữ liệu nhạy cảm (cờ, hoàn cảnh) vào blob.
export function buildLegacyOnboardingBlob(computed: IntakeComputed, intakeResultId?: string) {
  const dims = computed.dimension_scores;
  const answers: Record<string, string> = {
    "Nhóm tính cách": PERSONALITY_INFO[computed.personality_group].label,
    "Trình độ": computed.classification,
  };
  for (const d of TRADING_DIMENSIONS) {
    if (dims[d]) answers[DIMENSION_LABELS[d]] = `${dims[d]!.earned}/${dims[d]!.max} điểm (${dims[d]!.pct}%)`;
  }
  if (computed.zodiac) {
    answers["Cung hoàng đạo"] = ZODIAC_INFO[computed.zodiac].label;
  }
  if (computed.life_path_number !== null) {
    answers["Số chủ đạo"] = String(computed.life_path_number);
  }
  const avg = tradingAvgPct(dims);
  return {
    answers,
    total_score: avg ?? 0,
    has_any_one: computed.classification === "newbie",
    classification: computed.classification,
    completed_at: new Date().toISOString(),
    source: "intake" as const,
    ...(intakeResultId ? { intake_result_id: intakeResultId } : {}),
  };
}
