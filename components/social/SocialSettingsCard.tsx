"use client";

// Cài đặt hiển thị xã hội trong Hồ sơ: hiện tên đầy đủ (tự bật) hoặc ẩn danh.
// Mặc định: tên rút gọn kiểu "Minh N." + avatar. Kèm chuỗi kỷ lục của mình.
import { useState, useEffect } from "react";
import { Eye, EyeOff, Flame } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { getMyPulse } from "@/lib/api-social";

interface Props {
  userId: string;
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-gold" : "bg-muted",
        disabled && "opacity-50"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 rounded-full bg-white transition-transform",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

export function SocialSettingsCard({ userId }: Props) {
  const [showFullName, setShowFullName] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [bestStreak, setBestStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [{ data }, pulse] = await Promise.all([
        supabase.from("profiles").select("show_full_name, is_anonymous").eq("id", userId).single(),
        getMyPulse(userId),
      ]);
      if (cancelled) return;
      if (data) {
        setShowFullName(!!data.show_full_name);
        setIsAnonymous(!!data.is_anonymous);
      }
      setBestStreak(pulse?.best_streak ?? 0);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function save(fields: { show_full_name?: boolean; is_anonymous?: boolean }) {
    setSaving(true);
    await supabase.from("profiles").update(fields).eq("id", userId);
    setSaving(false);
  }

  if (loading) return null;

  return (
    <Card className="border-gold/20">
      <CardContent className="py-5 space-y-4">
        <h3 className="font-semibold text-foreground">Hiển thị trên cộng đồng</h3>

        {bestStreak > 0 && (
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Flame className="h-4 w-4 text-orange-500" />
            Chuỗi học đều dài nhất bạn từng đạt:{" "}
            <span className="font-bold text-orange-500">{bestStreak} ngày</span>
          </div>
        )}

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-2.5">
            <Eye className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Hiện tên đầy đủ</p>
              <p className="text-xs text-muted-foreground">
                Mặc định tên bạn hiện dạng rút gọn (vd &ldquo;Minh N.&rdquo;) trên bảng xếp hạng và
                dòng tin.
              </p>
            </div>
          </div>
          <Toggle
            checked={showFullName}
            disabled={saving}
            onChange={(v) => {
              setShowFullName(v);
              save({ show_full_name: v });
            }}
          />
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-2.5">
            <EyeOff className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Ẩn danh</p>
              <p className="text-xs text-muted-foreground">
                Tên bạn trên bảng của người khác sẽ thành &ldquo;Một bạn học&rdquo;. Bạn vẫn thấy
                hạng của chính mình.
              </p>
            </div>
          </div>
          <Toggle
            checked={isAnonymous}
            disabled={saving}
            onChange={(v) => {
              setIsAnonymous(v);
              save({ is_anonymous: v });
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
