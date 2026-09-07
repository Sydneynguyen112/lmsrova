// Kiểu dùng chung của bài test khám bệnh — đặt ở tầng đáy để mọi file content
// và engine đều import được mà không tạo vòng import.
// ⚠️ Contract IntakeMeta được MIRROR sang rova-ops/lib/intake-meta.ts.
import type { FormQuestionRow } from "../api-forms";

export type IntakeSection = "birth" | "personality" | "trading" | "personal";

export type IntakeDimension =
  | "tam_ly" | "kien_thuc" | "phuong_phap" | "quan_ly_von" | "kinh_nghiem" | "hoan_canh";

export type PersonalityGroup = "than_trong" | "ky_luat" | "lieu_linh" | "cam_tinh";

export type IntakeFlag =
  | "no_nang" | "khong_thu_nhap_chinh" | "ap_luc_tai_chinh"
  | "be_tac" | "von_vay" | "ky_vong_lam_giau_nhanh";

export type CareGroup = "uu_tien_cham_soc" | "theo_doi_sat" | "binh_thuong" | "tiem_nang_cao";

export type Classification = "newbie" | "beginner" | "intermediate" | "advanced";

export type ZodiacSlug =
  | "bach_duong" | "kim_nguu" | "song_tu" | "cu_giai"
  | "su_tu" | "xu_nu" | "thien_binh" | "bo_cap"
  | "nhan_ma" | "ma_ket" | "bao_binh" | "song_ngu";

// Meta chấm điểm gắn trên form_questions.meta
export interface IntakeMeta {
  section: IntakeSection | null;
  dimension: IntakeDimension | null;
  optionScores: number[] | null;                          // song song options[]
  optionGroups: Record<string, PersonalityGroup> | null;  // index option -> nhóm
  optionFlags: Record<string, IntakeFlag[]> | null;       // index option -> cờ
  // "mentor": câu "Ai là mentor của bạn?" — options là tên mentor; lúc nộp bài
  // LMS tự gán profiles.mentor_id (xem lib/api-intake.ts resolveMentorFromAnswers)
  semantic: "birth_date" | "birth_time" | "mentor" | null;
  // Song song options[] khi semantic="mentor": email tài khoản mentor tương ứng.
  // null/thiếu → khớp theo tên (bỏ dấu, không phân biệt thứ tự họ tên).
  optionMentorEmails: (string | null)[] | null;
  sensitive: boolean;
}

export type IntakeQuestion = FormQuestionRow & { meta?: unknown };

// Một mục luận giải: nhãn hiện trên thẻ + câu diễn giải bên dưới
export interface InterpretationEntry {
  label: string;
  trait: string;
}

export interface PersonalityEntry {
  label: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  advice: string;
}

export interface ZodiacEntry extends InterpretationEntry {
  slug: ZodiacSlug;
  from: [number, number];  // mốc bắt đầu [tháng, ngày] — dùng để tính, đừng đổi bừa
  element: "lua" | "dat" | "khi" | "nuoc";
}
