// KHO LUẬN GIẢI — SỐ CHỦ ĐẠO (THẦN SỐ HỌC)
// Số được tính từ ngày sinh theo Pythagoras (xem lifePathNumber trong lib/astro.ts),
// học viên không tự khai. Chữ dưới đây là phần diễn giải hiện trên màn kết quả.
//
// Muốn ẩn: công tắc showLifePath / showTraits trong display.ts.
import type { InterpretationEntry } from "./types";

export const LIFE_PATH_INFO: Record<number, InterpretationEntry> = {
  1: { label: "Số 1 — Người tiên phong", trait: "Độc lập, quyết đoán, thích tự mình dẫn dắt." },
  2: { label: "Số 2 — Người kết nối", trait: "Nhạy cảm, khéo léo, mạnh về hợp tác và lắng nghe." },
  3: { label: "Số 3 — Người sáng tạo", trait: "Lạc quan, giàu ý tưởng, giao tiếp tốt." },
  4: { label: "Số 4 — Người xây nền", trait: "Kỷ luật, thực tế, làm việc có hệ thống." },
  5: { label: "Số 5 — Người tự do", trait: "Linh hoạt, ưa thay đổi, thích trải nghiệm mới." },
  6: { label: "Số 6 — Người chở che", trait: "Trách nhiệm, coi trọng gia đình và sự ổn định." },
  7: { label: "Số 7 — Người tìm đạo", trait: "Sâu sắc, thích phân tích, tin vào dữ liệu hơn đám đông." },
  8: { label: "Số 8 — Người quyền lực", trait: "Tham vọng, nhạy bén tài chính, hướng tới thành tựu." },
  9: { label: "Số 9 — Người nhân ái", trait: "Bao dung, lý tưởng, nhìn bức tranh lớn." },
  11: { label: "Số 11 — Trực giác bậc thầy", trait: "Trực giác mạnh, truyền cảm hứng, nhạy với thị trường." },
  22: { label: "Số 22 — Kiến trúc sư bậc thầy", trait: "Biến tầm nhìn lớn thành kế hoạch cụ thể." },
  33: { label: "Số 33 — Người thầy bậc thầy", trait: "Dẫn dắt bằng sự tận tâm và chữa lành." },
};

// Số "master" không rút gọn tiếp về 1 chữ số. Bỏ bớt số nào ở đây thì số đó
// sẽ bị rút gọn như bình thường (vd bỏ 33 → 33 thành 6).
export const MASTER_NUMBERS: number[] = [11, 22, 33];
