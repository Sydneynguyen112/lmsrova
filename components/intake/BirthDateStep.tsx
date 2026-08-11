"use client";

// Bước nhập ngày sinh của bài test khám bệnh — 3 select ngày/tháng/năm → ISO.
// Học viên không cần biết gì về thần số học/cung hoàng đạo, hệ thống tự tính.

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 14 - 1950 + 1 }, (_, i) => CURRENT_YEAR - 14 - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

interface BirthDateStepProps {
  value: string; // "" hoặc "YYYY-MM-DD"
  onChange: (iso: string) => void;
}

export function BirthDateStep({ value, onChange }: BirthDateStepProps) {
  const [y, m, d] = value ? value.split("-").map(Number) : [0, 0, 0];

  function update(part: "d" | "m" | "y", raw: string) {
    const n = Number(raw);
    let nd = part === "d" ? n : d;
    let nm = part === "m" ? n : m;
    const ny = part === "y" ? n : y;
    if (!nm) nm = 1;
    if (!nd) nd = 1;
    // Đổi tháng/năm làm ngày vượt số ngày của tháng → kéo về ngày cuối tháng
    const maxDay = daysInMonth(ny || 2000, nm);
    if (nd > maxDay) nd = maxDay;
    if (ny) {
      onChange(
        `${String(ny).padStart(4, "0")}-${String(nm).padStart(2, "0")}-${String(nd).padStart(2, "0")}`
      );
    }
  }

  const dayCount = daysInMonth(y || 2000, m || 1);
  const selectCls =
    "flex-1 rounded-lg border border-border bg-card p-2.5 text-sm text-foreground focus:border-gold focus:outline-none";

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <select
          aria-label="Ngày"
          value={d || ""}
          onChange={(e) => update("d", e.target.value)}
          className={selectCls}
        >
          <option value="">Ngày</option>
          {Array.from({ length: dayCount }, (_, i) => i + 1).map((day) => (
            <option key={day} value={day}>{day}</option>
          ))}
        </select>
        <select
          aria-label="Tháng"
          value={m || ""}
          onChange={(e) => update("m", e.target.value)}
          className={selectCls}
        >
          <option value="">Tháng</option>
          {MONTHS.map((month) => (
            <option key={month} value={month}>Tháng {month}</option>
          ))}
        </select>
        <select
          aria-label="Năm"
          value={y || ""}
          onChange={(e) => update("y", e.target.value)}
          className={selectCls}
        >
          <option value="">Năm</option>
          {YEARS.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>
      <p className="text-xs text-muted-foreground">
        Ngày sinh giúp ROVA hiểu thiên hướng tự nhiên của bạn — chỉ mentor của bạn xem được.
      </p>
    </div>
  );
}
