"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCurrentUser } from "@/lib/auth";
import {
  getMachinesForScope,
  getReportsForScope,
  getTxForScope,
  getUserScope,
} from "@/lib/co-may/mock-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NhatKyTab } from "./nhat-ky-tab";
import { BaoCaoTab } from "./bao-cao-tab";

type RoleSlug = "student" | "mentor" | "admin";

const SCOPE_LABEL: Record<RoleSlug, string> = {
  student: "Lịch sử của bạn",
  mentor: "Lịch sử các mentee",
  admin: "Lịch sử toàn hệ thống",
};

function LichSuViewInner({ role }: { role: RoleSlug }) {
  const user = useCurrentUser(role);
  const router = useRouter();
  const sp = useSearchParams();
  const initialTab = sp.get("tab") === "bao-cao" ? "bao-cao" : "nhat-ky";
  const [tab, setTab] = useState<string>(initialTab);

  useEffect(() => {
    const next = sp.get("tab") === "bao-cao" ? "bao-cao" : "nhat-ky";
    if (next !== tab) setTab(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  function handleTabChange(value: string) {
    setTab(value);
    const params = new URLSearchParams(sp.toString());
    params.set("tab", value);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  const data = useMemo(() => {
    if (!user) return null;
    const userIds = getUserScope(user.role ?? role, user.id);
    return {
      machines: getMachinesForScope(userIds),
      tx: getTxForScope(userIds),
      reports: getReportsForScope(userIds),
      userIds,
    };
  }, [user, role]);

  if (!user || !data) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground text-sm">
        Đang tải lịch sử...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Báo cáo & Nhật ký</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {SCOPE_LABEL[role]} • {data.tx.length} giao dịch • {data.reports.length} chu kỳ đã đóng
        </p>
      </div>

      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList variant="line">
          <TabsTrigger value="nhat-ky">Nhật ký</TabsTrigger>
          <TabsTrigger value="bao-cao">Báo cáo</TabsTrigger>
        </TabsList>
        <TabsContent value="nhat-ky" className="mt-4">
          <NhatKyTab tx={data.tx} machines={data.machines} />
        </TabsContent>
        <TabsContent value="bao-cao" className="mt-4">
          <BaoCaoTab reports={data.reports} machines={data.machines} tx={data.tx} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function LichSuView({ role }: { role: RoleSlug }) {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Đang tải...</div>}>
      <LichSuViewInner role={role} />
    </Suspense>
  );
}
