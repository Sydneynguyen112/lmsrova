// Nhãn hệ thống — chữ hiển thị cho từng mã enum của bài test khám bệnh.
// ⚠️ SECTION_LABELS / DIMENSION_LABELS / FLAG_LABELS / CARE_GROUP_LABELS được
// MIRROR sang rova-ops/lib/intake-meta.ts — sửa bên này thì sửa y hệt bên đó.
import type {
  IntakeSection,
  IntakeDimension,
  IntakeFlag,
  CareGroup,
  Classification,
} from "./types";

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

// Các chiều hiện thành thanh % trên màn kết quả VÀ dùng để map classification
// legacy. tam_ly + hoan_canh vẫn được chấm nhưng không nằm trong nhóm này.
export const TRADING_DIMENSIONS: IntakeDimension[] = [
  "kien_thuc", "phuong_phap", "quan_ly_von", "kinh_nghiem",
];

// Cờ rủi ro — CHỈ mentor/admin xem, không bao giờ lộ cho học viên.
export const FLAG_LABELS: Record<IntakeFlag, string> = {
  no_nang: "Đang có nợ đáng kể",
  khong_thu_nhap_chinh: "Chưa có nguồn thu nhập chính ổn định",
  ap_luc_tai_chinh: "Áp lực tài chính lớn",
  be_tac: "Đang cảm thấy bế tắc",
  von_vay: "Vốn giao dịch là tiền vay",
  ky_vong_lam_giau_nhanh: "Kỳ vọng làm giàu nhanh từ trading",
};

// Nhóm chăm sóc — CHỈ mentor/admin xem.
export const CARE_GROUP_LABELS: Record<CareGroup, string> = {
  uu_tien_cham_soc: "Ưu tiên chăm sóc",
  theo_doi_sat: "Theo dõi sát",
  binh_thuong: "Bình thường",
  tiem_nang_cao: "Tiềm năng cao",
};

// Trình độ — hiện trên chip màn kết quả của học viên.
export const CLASSIFICATION_LABELS: Record<Classification, string> = {
  newbie: "Người mới bắt đầu",
  beginner: "Sơ cấp",
  intermediate: "Trung cấp",
  advanced: "Nâng cao",
};
