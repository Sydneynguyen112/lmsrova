// Engine chấm điểm bài test khám bệnh — plans/260807-intake-assessment/plan.md
// Thuần hàm, không I/O. KHÔNG đụng lib/api.ts.
// ⚠️ Contract IntakeMeta + các hằng số nhãn được MIRROR sang rova-ops
// (rova-ops/lib/api-forms.ts) — sửa ở đây thì sửa y hệt bên đó.
import type { FormQuestionRow } from "./api-forms";
import {
  lifePathNumber,
  westernZodiac,
  canChi,
  LIFE_PATH_INFO,
  ZODIAC_INFO,
  type ZodiacSlug,
} from "./astro";

// ─── Từ điển chung (mirror sang rova-ops) ───

export type IntakeSection = "birth" | "personality" | "trading" | "personal";
export type IntakeDimension =
  | "tam_ly" | "kien_thuc" | "phuong_phap" | "quan_ly_von" | "kinh_nghiem" | "hoan_canh";
export type PersonalityGroup = "than_trong" | "ky_luat" | "lieu_linh" | "cam_tinh";
export type IntakeFlag =
  | "no_nang" | "khong_thu_nhap_chinh" | "ap_luc_tai_chinh"
  | "be_tac" | "von_vay" | "ky_vong_lam_giau_nhanh";
export type CareGroup = "uu_tien_cham_soc" | "theo_doi_sat" | "binh_thuong" | "tiem_nang_cao";
export type Classification = "newbie" | "beginner" | "intermediate" | "advanced";

export const SECTION_LABELS: Record<IntakeSection, string> = {
  birth: "Về bạn",
  personality: "Con người bạn",
  trading: "Hành trình giao dịch",
  personal: "Cuộc sống của bạn",
};

export const DIMENSION_LABELS: Record<IntakeDimension, string> = {
  tam_ly: "Tâm lý giao dịch",
  kien_thuc: "Kiến thức",
  phuong_phap: "Phương pháp",
  quan_ly_von: "Quản lý vốn",
  kinh_nghiem: "Kinh nghiệm",
  hoan_canh: "Hoàn cảnh cá nhân",
};

// Các chiều dùng để map về classification legacy (không tính tam_ly, hoan_canh)
export const TRADING_DIMENSIONS: IntakeDimension[] = [
  "kien_thuc", "phuong_phap", "quan_ly_von", "kinh_nghiem",
];

export const FLAG_LABELS: Record<IntakeFlag, string> = {
  no_nang: "Đang có nợ đáng kể",
  khong_thu_nhap_chinh: "Chưa có nguồn thu nhập chính ổn định",
  ap_luc_tai_chinh: "Áp lực tài chính lớn",
  be_tac: "Đang cảm thấy bế tắc",
  von_vay: "Vốn giao dịch là tiền vay",
  ky_vong_lam_giau_nhanh: "Kỳ vọng làm giàu nhanh từ trading",
};

export const CARE_GROUP_LABELS: Record<CareGroup, string> = {
  uu_tien_cham_soc: "Ưu tiên chăm sóc",
  theo_doi_sat: "Theo dõi sát",
  binh_thuong: "Bình thường",
  tiem_nang_cao: "Tiềm năng cao",
};

export const PERSONALITY_INFO: Record<PersonalityGroup, {
  label: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  advice: string;
}> = {
  than_trong: {
    label: "Nhà giao dịch Thận trọng",
    description: "Bạn suy nghĩ kỹ trước khi hành động và không thích rủi ro không cần thiết. Với bạn, bảo toàn vốn quan trọng hơn lợi nhuận nóng.",
    strengths: ["Ít khi cháy tài khoản vì liều", "Tuân thủ quy tắc quản lý vốn tốt", "Kiên nhẫn chờ điểm vào đẹp"],
    weaknesses: ["Dễ bỏ lỡ cơ hội vì chần chừ", "Hay thoát lệnh sớm khi thị trường rung lắc"],
    advice: "Hãy tin vào hệ thống đã kiểm chứng của mình. Đặt sẵn kịch bản vào/ra lệnh trước khi thị trường mở để bớt do dự lúc quyết định.",
  },
  ky_luat: {
    label: "Nhà giao dịch Kỷ luật",
    description: "Bạn làm việc có hệ thống, tôn trọng quy trình và số liệu. Đây là nền tảng tốt nhất để đi đường dài với thị trường.",
    strengths: ["Nhất quán với kế hoạch giao dịch", "Ghi chép và rút kinh nghiệm đều đặn", "Không để một lệnh thua phá vỡ cả hệ thống"],
    weaknesses: ["Có thể cứng nhắc khi thị trường đổi tính", "Dễ tự trách quá mức khi phạm quy tắc"],
    advice: "Duy trì nhật ký giao dịch và định kỳ xem lại hệ thống — sự linh hoạt có kiểm soát sẽ đưa bạn lên bậc cao hơn.",
  },
  lieu_linh: {
    label: "Nhà giao dịch Mạo hiểm",
    description: "Bạn quyết đoán, dám hành động và không sợ biến động. Năng lượng này rất quý — nếu được đặt trong khuôn khổ quản lý vốn chặt.",
    strengths: ["Ra quyết định nhanh, không bỏ lỡ sóng", "Chịu được áp lực biến động lớn", "Học nhanh qua thực chiến"],
    weaknesses: ["Dễ vào lệnh quá tay, gồng lỗ", "Hay bỏ qua quy tắc khi hưng phấn"],
    advice: "Kỷ luật cứng về khối lượng lệnh và điểm cắt lỗ là người bạn quan trọng nhất của bạn. Hãy để hệ thống kìm bớt tay ga.",
  },
  cam_tinh: {
    label: "Nhà giao dịch Cảm nhận",
    description: "Bạn nhạy với nhịp thị trường và tin vào trực giác. Trực giác tốt là tài sản — khi được kiểm chứng bằng dữ liệu và quy tắc.",
    strengths: ["Nhạy bén với thay đổi tâm lý đám đông", "Linh hoạt thích nghi nhiều điều kiện thị trường"],
    weaknesses: ["Dễ bị cảm xúc cuốn khi thua liên tiếp", "Khó nhất quán vì thiếu hệ thống cố định"],
    advice: "Chuyển dần cảm nhận thành checklist: mỗi lần 'thấy đẹp' hãy ghi lại vì sao — sau 30 lệnh bạn sẽ có hệ thống của riêng mình.",
  },
};

// ─── Meta contract trên form_questions.meta ───

export interface IntakeMeta {
  section: IntakeSection | null;
  dimension: IntakeDimension | null;
  optionScores: number[] | null;              // song song options[]
  optionGroups: Record<string, PersonalityGroup> | null; // index option -> nhóm
  optionFlags: Record<string, IntakeFlag[]> | null;      // index option -> cờ
  semantic: "birth_date" | "birth_time" | null;
  sensitive: boolean;
}

export type IntakeQuestion = FormQuestionRow & { meta?: unknown };

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
  const semantic = raw.semantic === "birth_date" || raw.semantic === "birth_time"
    ? raw.semantic : null;
  return { section, dimension, optionScores, optionGroups, optionFlags, semantic, sensitive: raw.sensitive === true };
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
  // Hòa phiếu → ưu tiên theo thứ tự an toàn: thận trọng > kỷ luật > cảm tính > liều lĩnh
  const order: PersonalityGroup[] = ["than_trong", "ky_luat", "cam_tinh", "lieu_linh"];
  let best: PersonalityGroup = "than_trong";
  let bestVotes = -1;
  for (const g of order) {
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
  personality: (typeof PERSONALITY_INFO)[PersonalityGroup];
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
