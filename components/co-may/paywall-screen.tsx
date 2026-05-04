"use client";

import { Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  "3 module quản trị chuyên nghiệp",
  "Realtime P&L update",
  "Hiệu ứng kỷ luật rút tiền",
  "Báo cáo chu kỳ tự động",
  "Đồng bộ với khoá học LMS đang theo",
];

export function PaywallScreen() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 border-2 border-primary/30 rounded-3xl p-8 md:p-12 text-center space-y-6 gold-glow">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5" />
          Premium Add-on
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
            Nâng cấp <span className="gold-gradient-text">Cỗ Máy In Tiền</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            Quản trị kỷ luật trading như pro — đồng bộ với khoá học bạn đang theo.
          </p>
        </div>

        <div className="pt-2">
          <Button variant="anchor" size="lg" className="text-base px-8 py-3">
            Nâng cấp ngay — 1.990.000đ/tháng
          </Button>
        </div>

        <ul className="text-left max-w-md mx-auto space-y-2.5 pt-4">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-foreground/80">
              <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <p className="text-xs text-muted-foreground pt-4">
          Đã có gói? <button className="text-primary hover:underline font-medium">Liên hệ hỗ trợ</button>
        </p>
      </div>
    </div>
  );
}
