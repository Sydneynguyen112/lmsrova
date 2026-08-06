"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  AlertTriangle,
  PhoneCall,
  FileCheck,
  GraduationCap,
  UserPlus,
  Filter,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FLAG_LABELS } from "@/lib/status-labels";
import {
  fetchTodayActions,
  fetchFunnel,
  fetchStageSpeed,
  fetchCohortMonthly,
  fetchMentorScorecard,
  fmtPct,
  fmtNum,
  safeNum,
  type TodayActionRow,
  type FunnelRow,
  type StageSpeedRow,
  type CohortMonthlyRow,
  type MentorScorecardRow,
  type ActionGroup,
} from "@/lib/api-analytics";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { PageTransition } from "@/components/shared/PageTransition";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
};

// ─── Tầng 1: cấu hình 5 thẻ hành động hôm nay ───
interface ActionCardConfig {
  group: ActionGroup;
  label: string;
  icon: LucideIcon;
  iconClass: string;
  countClass: string;
  selectedClass: string;
}

const ACTION_CARDS: ActionCardConfig[] = [
  {
    group: "ket",
    label: FLAG_LABELS.ket,
    icon: AlertTriangle,
    iconClass: "text-red-500",
    countClass: "text-red-500",
    selectedClass: "ring-2 ring-red-500/60 border-red-500/40",
  },
  {
    group: "can_cham",
    label: "Cần chạm",
    icon: PhoneCall,
    iconClass: "text-amber-500",
    countClass: "text-amber-500",
    selectedClass: "ring-2 ring-amber-500/60 border-amber-500/40",
  },
  {
    group: "cho_cham",
    label: FLAG_LABELS.cho_cham,
    icon: FileCheck,
    iconClass: "text-sky-500",
    countClass: "text-sky-500",
    selectedClass: "ring-2 ring-sky-500/60 border-sky-500/40",
  },
  {
    group: "cho_tot_nghiep",
    label: "Chờ tốt nghiệp",
    icon: GraduationCap,
    iconClass: "text-emerald-500",
    countClass: "text-emerald-500",
    selectedClass: "ring-2 ring-emerald-500/60 border-emerald-500/40",
  },
  {
    group: "moi_chua_vao_guong",
    label: "Mới chưa vào guồng",
    icon: UserPlus,
    iconClass: "text-zinc-400",
    countClass: "text-foreground",
    selectedClass: "ring-2 ring-zinc-400/60 border-zinc-400/40",
  },
];

// Hàng phễu tầng 2 = v_stage_speed (đủ 10 chặng) + số học viên từ v_funnel
interface FunnelDisplayRow {
  stage_key: string;
  title: string;
  order_index: number;
  students: number;
  median_days: number | null;
  target_days: number | null;
}

function cohortLabel(cohortMonth: string): string {
  // cohort_month dạng "YYYY-MM-01" — parse bằng chuỗi, tránh lệch múi giờ
  const [y, m] = cohortMonth.split("-");
  const month = parseInt(m, 10);
  const year = parseInt(y, 10);
  const currentYear = new Date().getFullYear();
  return year === currentYear ? `Lứa T${month}` : `Lứa T${month}/${String(year).slice(2)}`;
}

export default function AdminAnalyticsPage() {
  const [actions, setActions] = useState<TodayActionRow[]>([]);
  const [funnel, setFunnel] = useState<FunnelRow[]>([]);
  const [stageSpeed, setStageSpeed] = useState<StageSpeedRow[]>([]);
  const [cohorts, setCohorts] = useState<CohortMonthlyRow[]>([]);
  const [scorecard, setScorecard] = useState<MentorScorecardRow[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ActionGroup | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [actionsData, funnelData, speedData, cohortData, scorecardData] =
        await Promise.all([
          fetchTodayActions(),
          fetchFunnel(),
          fetchStageSpeed(),
          fetchCohortMonthly(),
          fetchMentorScorecard(),
        ]);
      setActions(actionsData);
      setFunnel(funnelData);
      setStageSpeed(speedData);
      setCohorts(cohortData);
      setScorecard(scorecardData);
      setLoading(false);
    }
    load();
  }, []);

  const countByGroup = useMemo(() => {
    const map = new Map<ActionGroup, number>();
    actions.forEach((a) => map.set(a.action_group, (map.get(a.action_group) || 0) + 1));
    return map;
  }, [actions]);

  const selectedRows = useMemo(
    () => (selectedGroup ? actions.filter((a) => a.action_group === selectedGroup) : []),
    [actions, selectedGroup]
  );
  const selectedConfig = ACTION_CARDS.find((c) => c.group === selectedGroup);

  // Tầng 2: ưu tiên v_stage_speed làm khung (đủ 10 chặng), ghép số học viên từ v_funnel
  const funnelRows: FunnelDisplayRow[] = useMemo(() => {
    const countByStage = new Map(funnel.map((f) => [f.stage_key, safeNum(f.students)]));
    if (stageSpeed.length > 0) {
      return [...stageSpeed]
        .sort((a, b) => a.order_index - b.order_index)
        .map((s) => ({
          stage_key: s.stage_key,
          title: s.title,
          order_index: s.order_index,
          students: countByStage.get(s.stage_key) ?? 0,
          median_days: s.median_days,
          target_days: s.target_days,
        }));
    }
    // Fallback khi view stage_speed chưa có dữ liệu chặng
    return funnel.map((f) => ({
      stage_key: f.stage_key,
      title: f.stage_title,
      order_index: f.order_index,
      students: safeNum(f.students),
      median_days: null,
      target_days: null,
    }));
  }, [funnel, stageSpeed]);
  const maxFunnel = Math.max(...funnelRows.map((r) => r.students), 1);

  const maxCohortPct = 100; // pct 0–100, cột scale theo 100%

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl font-bold gold-gradient-text">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Lộ trình khoá PRO — hành động hôm nay, phễu chặng, lứa tháng, mentor
          </p>
        </motion.div>

        {/* ─── Tầng 1: 5 thẻ hành động hôm nay ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {ACTION_CARDS.map((cfg, i) => {
            const count = countByGroup.get(cfg.group) || 0;
            const isSelected = selectedGroup === cfg.group;
            return (
              <motion.div key={cfg.group} custom={i} variants={fadeUp} initial="hidden" animate="visible">
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setSelectedGroup(isSelected ? null : cfg.group)}
                >
                  <Card className={cn("transition-shadow hover:shadow-md cursor-pointer", isSelected && cfg.selectedClass)}>
                    <CardContent className="py-4 text-center">
                      <cfg.icon className={cn("h-5 w-5 mx-auto", cfg.iconClass)} />
                      <p className={cn("text-xl font-bold mt-1 tabular-nums", cfg.countClass)}>{count}</p>
                      <p className="text-[11px] text-muted-foreground">{cfg.label}</p>
                    </CardContent>
                  </Card>
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Danh sách khi click thẻ */}
        {selectedGroup && selectedConfig && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className={cn("h-5 w-5", selectedConfig.iconClass)} />
                  {selectedConfig.label}
                  <Badge className="bg-gold/15 text-gold ml-2">{selectedRows.length} học viên</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Không có học viên nào trong nhóm này hôm nay
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Học viên</TableHead>
                          <TableHead>Mentor</TableHead>
                          <TableHead>Chi tiết</TableHead>
                          <TableHead className="text-right">Hồ sơ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRows.map((row) => (
                          <TableRow key={`${row.action_group}-${row.user_id}`}>
                            <TableCell className="font-medium text-foreground">{row.full_name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {row.mentor_name || <span className="italic">Chưa gán</span>}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{row.detail}</TableCell>
                            <TableCell className="text-right">
                              <Link
                                href={`/admin/students/${row.user_id}`}
                                className="text-sm text-gold hover:underline whitespace-nowrap"
                              >
                                Xem hồ sơ
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── Tầng 2: phễu 10 chặng + tốc độ vs chuẩn ─── */}
        <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-gold" />
                Phễu chặng — học viên đang đứng ở đâu
              </CardTitle>
              <CardDescription>
                Cạnh mỗi chặng: median ngày thực tế / ngày chuẩn — đỏ nhạt = chậm hơn chuẩn
              </CardDescription>
            </CardHeader>
            <CardContent>
              {funnelRows.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Chưa có dữ liệu lộ trình — kiểm tra đã chạy SQL views và seed chặng chưa
                </p>
              ) : (
                <div className="space-y-3">
                  {funnelRows.map((row, i) => {
                    const median = row.median_days === null ? null : safeNum(row.median_days);
                    const target = row.target_days === null ? null : safeNum(row.target_days);
                    const isSlow = median !== null && target !== null && median > target;
                    return (
                      <div key={row.stage_key} className="flex items-center gap-3">
                        <div className="w-44 shrink-0 flex items-center gap-2">
                          <span className="text-[11px] text-muted-foreground tabular-nums w-4">{i + 1}</span>
                          <span className="text-sm text-foreground truncate" title={row.title}>{row.title}</span>
                        </div>
                        <div className="flex-1 h-5 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-gold-dark to-gold"
                            initial={{ width: 0 }}
                            animate={{ width: `${(row.students / maxFunnel) * 100}%` }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 + i * 0.05 }}
                          />
                        </div>
                        <span className="w-12 shrink-0 text-right text-sm font-medium text-foreground tabular-nums">
                          {row.students}
                        </span>
                        <span
                          className={cn(
                            "w-32 shrink-0 text-right text-xs tabular-nums rounded-md px-2 py-0.5",
                            isSlow ? "bg-red-500/10 text-red-500" : "text-muted-foreground"
                          )}
                          title="Median ngày thực tế / ngày chuẩn"
                        >
                          {median === null ? "—" : `${fmtNum(median)} ngày`}
                          {target !== null && ` / chuẩn ${fmtNum(target)}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── Tầng 3: so sánh lứa tháng ─── */}
        <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-gold" />
                So sánh lứa nhập học theo tháng
              </CardTitle>
              <CardDescription>
                Lứa mới chưa tròn 30 ngày nên chưa có cột tốt nghiệp
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cohorts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Chưa có lứa học viên nào — dữ liệu sẽ hiện sau khi import/ghi danh
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Legend */}
                  <div className="flex items-center gap-5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-500" />
                      % kích hoạt 7 ngày
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                      % tốt nghiệp 30 ngày
                    </span>
                  </div>

                  {/* Grouped bars */}
                  <div className="overflow-x-auto">
                    <div className="flex items-end gap-6 min-h-[190px] pt-4">
                      {cohorts.map((c) => {
                        const activated = c.pct_activated_7d === null ? null : safeNum(c.pct_activated_7d);
                        const graduated = c.pct_graduated_30d === null ? null : safeNum(c.pct_graduated_30d);
                        return (
                          <div key={c.cohort_month} className="flex flex-col items-center gap-2 shrink-0">
                            <div className="flex items-end gap-1.5 h-36">
                              {/* Cột % kích hoạt 7 ngày */}
                              <div className="flex flex-col items-center justify-end h-full w-9">
                                {activated === null ? (
                                  <span className="text-[10px] text-muted-foreground italic mb-1">đang chạy</span>
                                ) : (
                                  <>
                                    <span className="text-[10px] text-blue-500 tabular-nums mb-0.5">
                                      {fmtPct(activated)}
                                    </span>
                                    <motion.div
                                      className="w-full rounded-t-md bg-blue-500"
                                      initial={{ height: 0 }}
                                      animate={{ height: `${Math.min(activated, maxCohortPct)}%` }}
                                      transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
                                      style={{ minHeight: activated > 0 ? 3 : 0 }}
                                    />
                                  </>
                                )}
                              </div>
                              {/* Cột % tốt nghiệp 30 ngày */}
                              <div className="flex flex-col items-center justify-end h-full w-9">
                                {graduated === null ? (
                                  <span className="text-[10px] text-muted-foreground italic mb-1">đang chạy</span>
                                ) : (
                                  <>
                                    <span className="text-[10px] text-emerald-500 tabular-nums mb-0.5">
                                      {fmtPct(graduated)}
                                    </span>
                                    <motion.div
                                      className="w-full rounded-t-md bg-emerald-500"
                                      initial={{ height: 0 }}
                                      animate={{ height: `${Math.min(graduated, maxCohortPct)}%` }}
                                      transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
                                      style={{ minHeight: graduated > 0 ? 3 : 0 }}
                                    />
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-medium text-foreground whitespace-nowrap">
                                {cohortLabel(c.cohort_month)}
                              </p>
                              <p className="text-[10px] text-muted-foreground tabular-nums">
                                ({safeNum(c.total)} hv)
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── Tầng 4: bảng mentor ─── */}
        <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">So sánh mentor</CardTitle>
              <CardDescription>
                SLA chấm bài tính median 30 ngày gần nhất — thời gian chờ chấm không tính lỗi học viên
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scorecard.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Chưa có dữ liệu mentor
                </p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mentor</TableHead>
                        <TableHead className="text-right">HV đang học</TableHead>
                        <TableHead className="text-right">% đúng tiến độ</TableHead>
                        <TableHead className="text-right">Kẹt</TableHead>
                        <TableHead className="text-right">Tốt nghiệp tháng này</TableHead>
                        <TableHead className="text-right">Ảnh chờ chấm</TableHead>
                        <TableHead className="text-right">Median giờ chấm (30d)</TableHead>
                        <TableHead className="text-right">Lần chạm 7 ngày</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scorecard.map((m) => (
                        <TableRow key={m.mentor_id}>
                          <TableCell className="font-medium text-foreground whitespace-nowrap">
                            {m.mentor_name}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{safeNum(m.students_active)}</TableCell>
                          <TableCell className="text-right tabular-nums">{fmtPct(m.pct_dung_tien_do)}</TableCell>
                          <TableCell className={cn("text-right tabular-nums", safeNum(m.count_ket) > 0 && "text-red-500 font-medium")}>
                            {safeNum(m.count_ket)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{safeNum(m.graduated_this_month)}</TableCell>
                          <TableCell className={cn("text-right tabular-nums", safeNum(m.pending_to_grade) > 0 && "text-sky-500 font-medium")}>
                            {safeNum(m.pending_to_grade)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {m.median_grading_hours === null ? "—" : `${fmtNum(m.median_grading_hours)} giờ`}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{safeNum(m.touches_this_week)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  );
}
