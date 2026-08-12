// ╔══════════════════════════════════════════════════════════════════╗
// ║  ĐẦU MỤC NỘI DUNG BÀI TEST KHÁM BỆNH                             ║
// ║  Mọi chữ nghĩa + công tắc bật/tắt của bài test nằm trong thư mục  ║
// ║  này. Code tính toán không chứa nội dung, code UI không chứa chữ. ║
// ╚══════════════════════════════════════════════════════════════════╝
//
//  display.ts      CÔNG TẮC bật/tắt từng khối  ← sửa nhiều nhất
//  copy.ts         Chữ giao diện (tiêu đề, nút, thông báo lỗi)
//  personality.ts  Luận giải 4 nhóm tính cách + thứ tự ưu tiên khi hoà phiếu
//  life-path.ts    Luận giải 12 số chủ đạo (thần số học)
//  zodiac.ts       Luận giải 12 cung hoàng đạo + mốc ngày phân cung
//  can-chi.ts      Bảng Can + Chi
//  labels.ts       Nhãn hệ thống (section, chiều, cờ, nhóm chăm sóc, trình độ)
//  questions.ts    Biểu mẫu 10 câu dự phòng khi chưa publish form bên rova-ops
//  types.ts        Kiểu dùng chung — sửa khi đổi cấu trúc, không phải đổi chữ
//
//  Engine chấm điểm: lib/intake-scoring.ts · Toán tử ngày sinh: lib/astro.ts

export * from "./types";
export * from "./display";
export * from "./copy";
export * from "./labels";
export * from "./personality";
export * from "./life-path";
export * from "./zodiac";
export * from "./can-chi";
export * from "./questions";
