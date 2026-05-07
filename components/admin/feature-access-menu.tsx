"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  FEATURES,
  setFeature,
  subscribe,
  type FeatureId,
} from "@/lib/feature-flags/store";
import { supabase } from "@/lib/supabase";

interface Props {
  userId: string;
  /** Hiển thị label rút gọn / số quyền active. Defaults full label. */
  compact?: boolean;
}

export function FeatureAccessMenu({ userId, compact }: Props) {
  const [enabled, setEnabled] = useState<FeatureId[]>([]);

  // Load thẳng từ Supabase (không dùng localStorage admin's view của target user)
  async function refresh() {
    const { data } = await supabase
      .from("user_features")
      .select("feature")
      .eq("user_id", userId);
    setEnabled(((data ?? []) as { feature: string }[]).map((d) => d.feature as FeatureId));
  }

  useEffect(() => {
    refresh();
    return subscribe(() => refresh());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const activeCount = enabled.length;
  const totalCount = FEATURES.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-lg border border-primary/40 bg-transparent px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 data-[popup-open]:bg-primary/10">
        <ShieldCheck className="h-3.5 w-3.5" />
        {compact ? `${activeCount}/${totalCount}` : `Quyền (${activeCount}/${totalCount})`}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {FEATURES.map((f) => {
          const isOn = enabled.includes(f.id);
          const Icon = f.icon;
          return (
            <DropdownMenuCheckboxItem
              key={f.id}
              checked={isOn}
              onCheckedChange={(next) => setFeature(userId, f.id, !!next)}
              className="gap-2"
            >
              <Icon className="h-4 w-4 text-primary shrink-0" />
              <span className="font-medium text-foreground">{f.label}</span>
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
