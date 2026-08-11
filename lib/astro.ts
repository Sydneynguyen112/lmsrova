// Tính toán thần số học / cung hoàng đạo / can chi từ ngày sinh.
// Thuần hàm, không I/O — dùng cho bài test khám bệnh (plans/260807-intake-assessment).
// Bảng đáp án chuẩn để kiểm tra: xem cuối file.

// ─── Thần số học: số chủ đạo (life path number) ───

// Phương pháp Pythagoras: cộng toàn bộ chữ số của ngày sinh (DDMMYYYY),
// rút gọn liên tiếp; dừng ở số master 11/22/33 hoặc khi còn 1 chữ số.
export function lifePathNumber(isoDate: string): number | null {
  const digits = isoDate.replace(/[^0-9]/g, "");
  if (digits.length < 8) return null;
  let sum = 0;
  for (const d of digits) sum += Number(d);
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    let next = 0;
    for (const d of String(sum)) next += Number(d);
    sum = next;
  }
  return sum;
}

export const LIFE_PATH_INFO: Record<number, { label: string; trait: string }> = {
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

// ─── Cung hoàng đạo (Western zodiac) ───

export type ZodiacSlug =
  | "bach_duong" | "kim_nguu" | "song_tu" | "cu_giai"
  | "su_tu" | "xu_nu" | "thien_binh" | "bo_cap"
  | "nhan_ma" | "ma_ket" | "bao_binh" | "song_ngu";

interface ZodiacDef {
  slug: ZodiacSlug;
  label: string;
  // Ngày bắt đầu (tháng, ngày) — cung chạy từ mốc này đến trước mốc cung sau
  from: [number, number];
  element: "lua" | "dat" | "khi" | "nuoc";
  trait: string;
}

// Thứ tự thời gian trong năm dương: Bảo Bình (20/1) → ... → Ma Kết (22/12).
// Ngày trước 20/1 rơi về Ma Kết của năm trước.
const ZODIAC_ORDER: ZodiacDef[] = [
  { slug: "bao_binh", label: "Bảo Bình", from: [1, 20], element: "khi", trait: "Độc lập, tư duy khác biệt, không chạy theo đám đông." },
  { slug: "song_ngu", label: "Song Ngư", from: [2, 19], element: "nuoc", trait: "Trực giác tốt nhưng dễ bị cảm xúc cuốn." },
  { slug: "bach_duong", label: "Bạch Dương", from: [3, 21], element: "lua", trait: "Quyết đoán, hành động nhanh, đôi khi nóng vội." },
  { slug: "kim_nguu", label: "Kim Ngưu", from: [4, 20], element: "dat", trait: "Chắc chắn, coi trọng tài sản, không thích rủi ro." },
  { slug: "song_tu", label: "Song Tử", from: [5, 21], element: "khi", trait: "Nhanh nhạy, linh hoạt nhưng dễ đổi hướng." },
  { slug: "cu_giai", label: "Cự Giải", from: [6, 21], element: "nuoc", trait: "Cẩn trọng, bảo vệ những gì mình có." },
  { slug: "su_tu", label: "Sư Tử", from: [7, 23], element: "lua", trait: "Tự tin, dám đặt cược lớn, cần kiểm soát cái tôi." },
  { slug: "xu_nu", label: "Xử Nữ", from: [8, 23], element: "dat", trait: "Tỉ mỉ, phân tích kỹ, mạnh về quy trình." },
  { slug: "thien_binh", label: "Thiên Bình", from: [9, 23], element: "khi", trait: "Cân nhắc nhiều chiều, đôi khi chậm ra quyết định." },
  { slug: "bo_cap", label: "Bọ Cạp", from: [10, 23], element: "nuoc", trait: "Quyết liệt, chịu áp lực tốt, không bỏ cuộc giữa chừng." },
  { slug: "nhan_ma", label: "Nhân Mã", from: [11, 22], element: "lua", trait: "Lạc quan, ưa mạo hiểm, cần thêm kỷ luật." },
  { slug: "ma_ket", label: "Ma Kết", from: [12, 22], element: "dat", trait: "Kiên trì, thực dụng, chơi đường dài." },
];

export const ZODIAC_INFO: Record<ZodiacSlug, ZodiacDef> = Object.fromEntries(
  ZODIAC_ORDER.map((z) => [z.slug, z])
) as Record<ZodiacSlug, ZodiacDef>;

export function westernZodiac(month: number, day: number): ZodiacSlug {
  // Duyệt từ mốc muộn nhất (22/12) lùi về, lấy cung đầu tiên đã bắt đầu
  for (let i = ZODIAC_ORDER.length - 1; i >= 0; i--) {
    const [m, d] = ZODIAC_ORDER[i].from;
    if (month > m || (month === m && day >= d)) return ZODIAC_ORDER[i].slug;
  }
  // Trước 20/1 → Ma Kết (mốc 22/12 năm trước)
  return "ma_ket";
}

// ─── Can Chi ───

const CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

// v1 tính theo năm dương lịch, KHÔNG xét mốc Tết âm — người sinh tháng 1/đầu
// tháng 2 có thể lệch 1 con giáp. Đã ghi nhận trong plan, chấp nhận ở v1.
export function canChi(year: number): { can: string; chi: string; label: string } {
  const can = CAN[(((year - 4) % 10) + 10) % 10];
  const chi = CHI[(((year - 4) % 12) + 12) % 12];
  return { can, chi, label: `${can} ${chi}` };
}

// ─── Bảng đáp án chuẩn (chạy tay khi cần kiểm tra) ───
// lifePathNumber("1988-03-14") === 7      (1+4+0+3+1+9+8+8 = 34 → 7)
// lifePathNumber("1990-09-19") === 11     (1+9+0+9+1+9+9+0 = 38 → 11, giữ master)
// lifePathNumber("1980-02-22") === 6      (2+2+0+2+1+9+8+0 = 24 → 6)
// westernZodiac(2, 18) === "bao_binh"; westernZodiac(2, 19) === "song_ngu"
// westernZodiac(3, 20) === "song_ngu"; westernZodiac(3, 21) === "bach_duong"
// westernZodiac(1, 5) === "ma_ket"; westernZodiac(12, 25) === "ma_ket"
// canChi(1984).label === "Giáp Tý"; canChi(1988).label === "Mậu Thìn"; canChi(2000).label === "Canh Thìn"
