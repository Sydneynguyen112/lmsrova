// Tính toán thần số học / cung hoàng đạo / can chi từ ngày sinh.
// Thuần hàm, không I/O — dùng cho bài test khám bệnh (plans/260807-intake-assessment).
// ⚠️ File này chỉ chứa TOÁN. Mọi bảng tra + chữ luận giải nằm ở lib/intake-content/.
// Bảng đáp án chuẩn để kiểm tra: xem cuối file.
import { MASTER_NUMBERS } from "./intake-content/life-path";
import { ZODIAC_ORDER } from "./intake-content/zodiac";
import { CAN, CHI } from "./intake-content/can-chi";
import type { ZodiacSlug } from "./intake-content/types";

// Đọc lại từ kho content để nơi khác vẫn `import ... from "@/lib/astro"` được.
export { LIFE_PATH_INFO } from "./intake-content/life-path";
export { ZODIAC_INFO, ZODIAC_ORDER } from "./intake-content/zodiac";
export type { ZodiacSlug } from "./intake-content/types";

// ─── Thần số học: số chủ đạo (life path number) ───

// Phương pháp Pythagoras: cộng toàn bộ chữ số của ngày sinh (DDMMYYYY),
// rút gọn liên tiếp; dừng ở số master (MASTER_NUMBERS) hoặc khi còn 1 chữ số.
export function lifePathNumber(isoDate: string): number | null {
  const digits = isoDate.replace(/[^0-9]/g, "");
  if (digits.length < 8) return null;
  let sum = 0;
  for (const d of digits) sum += Number(d);
  while (sum > 9 && !MASTER_NUMBERS.includes(sum)) {
    let next = 0;
    for (const d of String(sum)) next += Number(d);
    sum = next;
  }
  return sum;
}

// ─── Cung hoàng đạo (Western zodiac) ───

export function westernZodiac(month: number, day: number): ZodiacSlug {
  // Duyệt từ mốc muộn nhất (22/12) lùi về, lấy cung đầu tiên đã bắt đầu
  for (let i = ZODIAC_ORDER.length - 1; i >= 0; i--) {
    const [m, d] = ZODIAC_ORDER[i].from;
    if (month > m || (month === m && day >= d)) return ZODIAC_ORDER[i].slug;
  }
  // Trước mốc đầu tiên trong năm → thuộc cung cuối bảng (Ma Kết, mốc 22/12 năm trước)
  return ZODIAC_ORDER[ZODIAC_ORDER.length - 1].slug;
}

// ─── Can Chi ───

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
