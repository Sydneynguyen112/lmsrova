// KHO LUẬN GIẢI — CUNG HOÀNG ĐẠO
// Cung được tính từ ngày sinh (xem westernZodiac trong lib/astro.ts).
//
// Muốn ẩn: công tắc showZodiac / showTraits trong display.ts.
// ⚠️ Trường `from` là mốc ngày dùng ĐỂ TÍNH — sửa sẽ đổi kết quả phân cung.
// Mảng BẮT BUỘC giữ thứ tự thời gian tăng dần trong năm dương.
import type { ZodiacSlug, ZodiacEntry } from "./types";

// Bảo Bình (20/1) → ... → Ma Kết (22/12). Ngày trước 20/1 rơi về Ma Kết năm trước.
export const ZODIAC_ORDER: ZodiacEntry[] = [
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

export const ZODIAC_INFO: Record<ZodiacSlug, ZodiacEntry> = Object.fromEntries(
  ZODIAC_ORDER.map((z) => [z.slug, z])
) as Record<ZodiacSlug, ZodiacEntry>;
