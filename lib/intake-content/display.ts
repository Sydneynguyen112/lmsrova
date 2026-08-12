// ╔══════════════════════════════════════════════════════════════════╗
// ║  BẢNG CÔNG TẮC — BẬT / TẮT TỪNG KHỐI CỦA BÀI TEST KHÁM BỆNH      ║
// ╚══════════════════════════════════════════════════════════════════╝
//
// Đổi true ↔ false rồi deploy là xong, không cần đụng vào UI hay engine.
//
// LƯU Ý: đây là công tắc HIỂN THỊ. Tắt một khối chỉ ẩn nó khỏi mắt học viên;
// dữ liệu vẫn được tính và vẫn lưu vào intake_results cho mentor/admin xem
// bên rova-ops. Muốn ngừng THU THẬP hẳn thì xoá câu hỏi tương ứng trong
// questions.ts (bộ dự phòng) hoặc gỡ khỏi form builder bên rova-ops.

export const INTAKE_DISPLAY = {
  /* ─── Màn giới thiệu (trước khi bấm "Bắt đầu khám") ─── */
  showIntro: true,          // false → vào thẳng câu hỏi đầu tiên
  showIntroBullets: true,   // 3 gạch đầu dòng "khoảng N câu hỏi..."

  /* ─── Trong lúc làm bài ─── */
  showProgressBar: true,    // thanh "Câu 1/10 — 10%"
  showSectionChip: true,    // chip "VỀ BẠN" / "HÀNH TRÌNH GIAO DỊCH"
  showBackButton: true,     // nút "Quay lại"

  /* ─── Màn "đang phân tích" ─── */
  showComputingScreen: true,
  computingMinMs: 1200,     // giữ tối thiểu bao lâu cho cảm giác được khám thật; 0 = bỏ

  /* ─── Màn kết quả ─── */
  confetti: true,
  showPersonality: true,    // thẻ lớn "Nhà giao dịch Thận trọng" + mô tả
  showClassification: true, // chip "Trình độ hiện tại: Người mới bắt đầu"

  showLifePath: true,       // ô "Số chủ đạo"
  showZodiac: true,         // ô "Cung hoàng đạo"
  showCanChi: true,         // ô "Năm sinh" (Đinh Sửu...)
  showTraits: true,         // khối diễn giải số chủ đạo + cung ngay dưới 3 ô trên

  showStrengths: true,      // cột "Điểm mạnh"
  showWeaknesses: true,     // cột "Cần chú ý"
  showDimensionBars: true,  // "Nền tảng giao dịch hiện tại" — 4 thanh %
  showDimensionPct: true,   // con số % bên phải mỗi thanh; false → chỉ còn thanh
  showAdvice: true,         // khối "Lời khuyên dành riêng cho bạn"

  /* ─── Khối "Bước kế tiếp" (phần ý nghĩa onboarding gộp vào) ─── */
  showNextStep: true,       // TẮT cả khối → màn kết quả về đúng như trước
  showStageProgress: true,  // "Chặng 2/10 — Xem video" + thanh tiến độ
  showNextTask: true,       // nút việc kế tiếp, bấm vào đi thẳng bài học
  showPacePicker: true,     // chọn nhịp học ngay tại đây thay vì đợi ra trang chủ
  ctaGoesToLesson: true,    // nút cuối đi vào bài học; false → về trang chủ
} as const;

export type IntakeDisplayConfig = typeof INTAKE_DISPLAY;
