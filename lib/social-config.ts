// Hằng số social learning — MIRROR của supabase-social.sql (award_effort + trigger).
// Sửa số ở đây thì PHẢI sửa SQL tương ứng. Nguồn chân lý logic:
// vault 2ndbrain .../lms-social-learning-chot-logic.md (biên bản chốt 02-09-2026).

export const EFFORT_POINTS = {
  dailyPresence: 1, // lần đầu vào học trong ngày
  lessonCompleted: 2, // hoàn thành một bài
  submission: 3, // nộp một bài tập
  stageCompleted: 5, // qua một chặng
  dailyCap: 10, // trần điểm mỗi ngày
} as const;

// Nhịp thiết kế 10 chặng/20 ngày — "ngày thứ N" chỉ hiện khi N ≤ 2 × order_index (tính trong SQL)
export const DESIGN_DAYS_PER_STAGE = 2;
export const GRADUATION_WINDOW_DAYS = 20;

export type Tier = "pro" | "pro_graduate" | "master" | "master_certified";

export const TIER_LABELS: Record<Tier, string> = {
  pro: "Pro",
  pro_graduate: "Pro tốt nghiệp",
  master: "Master",
  master_certified: "Master chứng nhận",
};
