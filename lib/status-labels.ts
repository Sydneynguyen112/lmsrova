// Nhãn + màu cho 7 trạng thái học viên và 2 cờ phụ.
// Nguồn chân lý thông số: plans/260806-roadmap-analytics/plan.md

export type StudentStatus =
  | "dung_tien_do"
  | "cham"
  | "roi_bo"
  | "quay_lai"
  | "tam_dung"
  | "tot_nghiep"
  | "hoan_tien";

export const STATUS_LABELS: Record<StudentStatus, string> = {
  dung_tien_do: "Đúng tiến độ",
  cham: "Chậm",
  roi_bo: "Rời bỏ",
  quay_lai: "Quay lại",
  tam_dung: "Tạm dừng",
  tot_nghiep: "Tốt nghiệp",
  hoan_tien: "Hoàn tiền",
};

// Tailwind classes cho badge — dùng thống nhất mọi màn hình
export const STATUS_STYLES: Record<StudentStatus, string> = {
  dung_tien_do: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  cham: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  roi_bo: "bg-zinc-500/15 text-zinc-500 dark:text-zinc-400",
  quay_lai: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  tam_dung: "bg-zinc-500/10 text-zinc-400",
  tot_nghiep: "bg-emerald-600/20 text-emerald-700 dark:text-emerald-300",
  hoan_tien: "bg-zinc-500/15 text-zinc-500",
};

export const FLAG_LABELS = {
  ket: "Kẹt",
  cho_cham: "Chờ chấm",
} as const;

export const FLAG_STYLES = {
  ket: "bg-red-500/15 text-red-600 dark:text-red-400",
  cho_cham: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
} as const;

// Tag người được gắn tay (mentor/admin). Tag máy không cho gắn tay.
export const MANUAL_STATUSES: StudentStatus[] = ["roi_bo", "tam_dung", "dung_tien_do"];
export const ADMIN_ONLY_STATUSES: StudentStatus[] = ["hoan_tien"];
// Các tag bắt buộc nhập lý do khi gắn
export const REASON_REQUIRED: StudentStatus[] = ["roi_bo", "tam_dung", "hoan_tien"];

export const CHANNEL_LABELS = {
  call: "Gọi điện",
  zalo: "Zalo",
  zoom: "Zoom",
  app: "Nhắn trong app",
} as const;

export const NOTE_TYPE_LABELS = {
  nhac_bai: "Nhắc bài",
  go_ket: "Gỡ kẹt",
  cham_soc: "Chăm sóc",
  khac: "Khác",
} as const;

export type NoteChannel = keyof typeof CHANNEL_LABELS;
export type NoteType = keyof typeof NOTE_TYPE_LABELS;

export const GRADE_LABELS = {
  khong_dat: "Không đạt",
  tot: "Tốt",
  xuat_sac: "Xuất Sắc",
} as const;
