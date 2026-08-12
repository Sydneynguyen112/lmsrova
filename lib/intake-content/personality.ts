// KHO LUẬN GIẢI — NHÓM TÍNH CÁCH GIAO DỊCH
// Học viên rơi vào nhóm nào là do bầu đa số các option có gắn optionGroups
// (xem derivePersonalityGroup trong lib/intake-scoring.ts). Chữ dưới đây là
// toàn bộ phần "đọc vị" mà học viên nhìn thấy trên màn kết quả.
//
// Muốn ẩn bớt: dùng công tắc showPersonality / showStrengths / showWeaknesses /
// showAdvice trong display.ts.
import type { PersonalityGroup, PersonalityEntry } from "./types";

export const PERSONALITY_INFO: Record<PersonalityGroup, PersonalityEntry> = {
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

// Thứ tự ưu tiên khi hoà phiếu — nhóm đứng trước thắng.
// Mặc định nghiêng về phía an toàn: thận trọng > kỷ luật > cảm nhận > mạo hiểm.
export const PERSONALITY_TIEBREAK: PersonalityGroup[] = [
  "than_trong", "ky_luat", "cam_tinh", "lieu_linh",
];
