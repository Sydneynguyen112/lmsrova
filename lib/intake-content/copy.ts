// Toàn bộ chữ cố định trên giao diện bài test khám bệnh.
// Sửa chữ ở đây, không sửa trong file .tsx.
// Bật/tắt từng khối thì xem display.ts.

export const INTAKE_COPY = {
  intro: {
    title: "Khám sức khỏe giao dịch",
    subtitle:
      "Trước khi bắt đầu, ROVA muốn hiểu bạn — con người, hành trình giao dịch " +
      "và hoàn cảnh hiện tại — để mentor đồng hành đúng cách với riêng bạn.",
    // {count} được thay bằng số câu hỏi thực tế của bộ đề đang dùng
    bullets: [
      "Khoảng {count} câu hỏi, mất chừng 3–5 phút",
      "Không có câu trả lời đúng hay sai — hãy chọn điều giống bạn nhất",
      "Câu hỏi riêng tư đều có nút bỏ qua, và chỉ mentor của bạn xem được",
    ],
    startButton: "Bắt đầu khám",
  },

  form: {
    // {step} = câu hiện tại, {total} = tổng số câu
    progress: "Câu {step}/{total}",
    back: "Quay lại",
    skip: "Không muốn chia sẻ",
    next: "Tiếp tục",
    finish: "Xem kết quả",
    birthTimePlaceholder: "Không nhớ giờ sinh",
    selectPlaceholder: "Chọn...",
    textPlaceholder: "Câu trả lời của bạn",
    // {question} = nội dung câu hỏi bị bỏ trống
    requiredError: 'Vui lòng trả lời câu hỏi "{question}"',
    submitError: "Có lỗi xảy ra khi lưu bài. Vui lòng thử lại.",
  },

  computing: {
    message: "Đang phân tích hồ sơ của bạn...",
  },

  result: {
    eyebrow: "Hồ sơ giao dịch của bạn",
    // {level} = nhãn trình độ, lấy từ CLASSIFICATION_LABELS trong labels.ts
    classificationPrefix: "Trình độ hiện tại: {level}",
    lifePathCaption: "Số chủ đạo",
    zodiacCaption: "Cung hoàng đạo",
    canChiCaption: "Năm sinh",
    strengthsTitle: "Điểm mạnh",
    weaknessesTitle: "Cần chú ý",
    dimensionsTitle: "Nền tảng giao dịch hiện tại",
    adviceTitle: "Lời khuyên dành riêng cho bạn",
    doneButton: "Bắt đầu học ngay →",
  },

  // Khối gợi ý bước học kế tiếp — phần ý nghĩa onboarding gộp vào bài khám bệnh
  nextStep: {
    title: "Bước kế tiếp của bạn",
    // {current} = số thứ tự chặng đang làm, {total} = tổng chặng, {title} = tên chặng
    stageLabel: "Chặng {current}/{total} — {title}",
    // {done} = số chặng ĐÃ XONG (nhỏ hơn {current} đúng 1)
    stageCount: "{done}/{total} chặng",
    finished: "Bạn đã đi hết lộ trình 🎉",
    noTask: "Chưa có việc nào chờ bạn — vào trang chủ để bắt đầu.",
    paceTitle: "Chọn nhịp học của bạn",
    paceHint:
      "Bạn cầm lái — hệ thống sẽ gợi ý việc mỗi ngày theo nhịp bạn chọn. " +
      "Đổi lại lúc nào cũng được.",
    paceSuggested: "Gợi ý cho bạn",
  },
} as const;

// Thay {khoá} trong chuỗi copy bằng giá trị thật.
export function fillCopy(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in values ? String(values[key]) : match
  );
}
