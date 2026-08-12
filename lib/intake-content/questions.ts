// BIỂU MẪU DỰ PHÒNG — bộ câu hỏi dựng sẵn trong code.
// Chỉ dùng khi CHƯA có form intake nào published bên rova-ops. Nguồn chính vẫn
// là form builder; bộ này để luồng onboarding không bao giờ chết (bỏ qua bài
// test = onboarding_survey null = học viên kẹt stage 1 trong mọi analytics).
// Chạy pipeline submit y hệt form thật, chỉ khác form_id = null.
//
// ─── CÁCH SỬA ───
// • Thêm/bớt câu: thêm/xoá phần tử trong FALLBACK_QUESTIONS. order_index tự
//   sinh theo vị trí trong mảng — không cần đánh số tay.
// • optionScores phải SONG SONG options (cùng độ dài, cùng thứ tự).
// • optionGroups / optionFlags dùng CHỈ SỐ option dạng chuỗi: { "0": ... }.
//   Chèn option vào giữa thì nhớ đánh lại chỉ số.
// • section / dimension / flag hợp lệ: xem types.ts và labels.ts.
// • sensitive: true → học viên có nút "Không muốn chia sẻ", bỏ qua không bị trừ điểm.
import type { IntakeQuestion } from "./types";

type QuestionDraft = Omit<
  IntakeQuestion,
  "form_id" | "correct_option" | "points" | "order_index"
>;

const FALLBACK_QUESTIONS: QuestionDraft[] = [
  {
    id: "fb-birth-date",
    question_text: "Ngày sinh của bạn?",
    question_type: "text",
    options: [],
    required: true,
    meta: { section: "birth", semantic: "birth_date" },
  },
  {
    id: "fb-p1",
    question_text: "Khi một lệnh đang lỗ, bạn thường làm gì?",
    question_type: "radio",
    options: [
      "Cắt lỗ đúng kế hoạch đã đặt trước",
      "Chờ thêm chút nữa xem có hồi không",
      "Vào thêm lệnh để trung bình giá",
      "Tùy cảm nhận lúc đó",
    ],
    required: true,
    meta: {
      section: "personality",
      dimension: "tam_ly",
      optionScores: [4, 2, 1, 2],
      optionGroups: { "0": "ky_luat", "1": "than_trong", "2": "lieu_linh", "3": "cam_tinh" },
    },
  },
  {
    id: "fb-p2",
    question_text: "Điều nào giống bạn nhất khi ra quyết định quan trọng?",
    question_type: "radio",
    options: [
      "Cân nhắc kỹ mọi rủi ro rồi mới làm",
      "Lên kế hoạch từng bước và bám theo",
      "Quyết nhanh, sai thì sửa",
      "Nghe theo trực giác của mình",
    ],
    required: true,
    meta: {
      section: "personality",
      dimension: "tam_ly",
      optionScores: [3, 4, 2, 2],
      optionGroups: { "0": "than_trong", "1": "ky_luat", "2": "lieu_linh", "3": "cam_tinh" },
    },
  },
  {
    id: "fb-t1",
    question_text: "Bạn đã giao dịch được bao lâu?",
    question_type: "radio",
    options: [
      "Chưa từng giao dịch",
      "Dưới 6 tháng",
      "6 tháng đến 2 năm",
      "Trên 2 năm",
    ],
    required: true,
    meta: { section: "trading", dimension: "kinh_nghiem", optionScores: [1, 2, 3, 4] },
  },
  {
    id: "fb-t2",
    question_text: "Kết quả giao dịch của bạn đến hiện tại?",
    question_type: "radio",
    options: [
      "Chưa có tài khoản thật",
      "Đang lỗ",
      "Hòa vốn, lúc được lúc mất",
      "Có lợi nhuận ổn định",
    ],
    required: true,
    meta: { section: "trading", dimension: "kinh_nghiem", optionScores: [1, 2, 3, 4] },
  },
  {
    id: "fb-t3",
    question_text: "Mỗi lệnh bạn thường rủi ro bao nhiêu phần trăm tài khoản?",
    question_type: "radio",
    options: [
      "Tôi chưa từng tính toán điều này",
      "Trên 10%",
      "3–10%",
      "Dưới 3% (1–2% mỗi lệnh)",
    ],
    required: true,
    meta: { section: "trading", dimension: "quan_ly_von", optionScores: [1, 2, 3, 4] },
  },
  {
    id: "fb-t4",
    question_text: "Bạn có phương pháp giao dịch cụ thể chưa?",
    question_type: "radio",
    options: [
      "Chưa, chủ yếu theo tin hoặc theo người khác",
      "Biết vài mô hình nhưng chưa hệ thống",
      "Có phương pháp nhưng chưa kiểm chứng kỹ",
      "Có hệ thống rõ ràng, đã kiểm chứng",
    ],
    required: true,
    meta: { section: "trading", dimension: "phuong_phap", optionScores: [1, 2, 3, 4] },
  },
  {
    id: "fb-t5",
    question_text: "Với bạn, thị trường vận hành gần nhất với điều nào?",
    question_type: "radio",
    options: [
      "Là nơi may rủi, giống trò chơi",
      "Có quy luật nhưng tôi chưa nắm được",
      "Là xác suất — quản trị rủi ro quyết định tất cả",
      "Là dòng tiền của tổ chức lớn dẫn dắt, cần đọc theo",
    ],
    required: true,
    meta: { section: "trading", dimension: "kien_thuc", optionScores: [1, 2, 4, 3] },
  },
  {
    id: "fb-l1",
    question_text: "Ngoài trading, nguồn thu nhập chính của bạn hiện tại thế nào?",
    question_type: "radio",
    options: [
      "Ổn định, trading chỉ là việc phụ",
      "Có nhưng không đều",
      "Đang tạm thời không có thu nhập chính",
      "Trading đang là nguồn thu nhập duy nhất",
    ],
    required: false,
    meta: {
      section: "personal",
      dimension: "hoan_canh",
      optionScores: [4, 3, 1, 1],
      optionFlags: { "2": ["khong_thu_nhap_chinh"], "3": ["khong_thu_nhap_chinh", "ap_luc_tai_chinh"] },
      sensitive: true,
    },
  },
  {
    id: "fb-l2",
    question_text: "Vốn bạn dành cho trading đến từ đâu?",
    question_type: "radio",
    options: [
      "Tiền nhàn rỗi, mất cũng không ảnh hưởng cuộc sống",
      "Tiền tiết kiệm, mất sẽ tiếc nhưng không sao",
      "Một phần là tiền cần cho việc khác",
      "Có phần vay mượn",
    ],
    required: false,
    meta: {
      section: "personal",
      dimension: "hoan_canh",
      optionScores: [4, 3, 2, 1],
      optionFlags: { "2": ["ap_luc_tai_chinh"], "3": ["von_vay", "no_nang"] },
      sensitive: true,
    },
  },
];

// Bù các cột form_questions không dùng tới cho bộ dự phòng.
// order_index sinh theo vị trí mảng — thêm câu ở giữa vẫn đúng thứ tự.
export function getFallbackQuestions(): IntakeQuestion[] {
  return FALLBACK_QUESTIONS.map((draft, i) => ({
    form_id: "",
    correct_option: null,
    points: 0,
    order_index: (i + 1) * 10,
    ...draft,
  })) as IntakeQuestion[];
}
