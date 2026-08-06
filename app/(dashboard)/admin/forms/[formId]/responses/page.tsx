"use client";

import { useState, useEffect, use } from "react";
import { ArrowLeft, Download, BarChart3, User, Mail, Phone, FileText, GraduationCap } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { cn, formatDate } from "@/lib/utils";
import { GRADE_LABELS } from "@/lib/status-labels";
import { GRADE_STYLES, type Grade } from "@/lib/api-forms";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/shared/PageTransition";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";

interface Form {
  id: string;
  title: string;
  form_type: string;
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  order_index: number;
}

interface Response {
  id: string;
  user_id: string | null;
  respondent_name: string | null;
  respondent_email: string | null;
  respondent_phone: string | null;
  score_pct: number | null;
  grade: Grade | null;
  submitted_at: string;
}

interface Answer {
  response_id: string;
  question_id: string;
  answer_value: string;
}

type GradeFilter = "all" | Grade;

export default function FormResponsesPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = use(params);
  const [form, setForm] = useState<Form | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [profileNames, setProfileNames] = useState<Record<string, string>>({});
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>("all");
  const [loading, setLoading] = useState(true);

  const isGraduation = form?.form_type === "graduation";

  useEffect(() => {
    async function load() {
      const [{ data: f }, { data: q }, { data: r }, { data: a }] = await Promise.all([
        supabase.from("forms").select("*").eq("id", formId).single(),
        supabase.from("form_questions").select("*").eq("form_id", formId).order("order_index"),
        supabase.from("form_responses").select("*").eq("form_id", formId).order("submitted_at", { ascending: false }),
        supabase.from("form_answers").select("*").in(
          "response_id",
          (await supabase.from("form_responses").select("id").eq("form_id", formId)).data?.map((r: { id: string }) => r.id) || []
        ),
      ]);
      if (f) setForm(f as Form);
      setQuestions((q || []) as Question[]);
      const resps = (r || []) as Response[];
      setResponses(resps);
      setAnswers((a || []) as Answer[]);

      // Tên học viên cho response có user_id (form tốt nghiệp nộp trong app)
      const userIds = [...new Set(resps.map((x) => x.user_id).filter(Boolean))] as string[];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
        const names: Record<string, string> = {};
        for (const p of profiles || []) names[p.id] = p.full_name;
        setProfileNames(names);
      }
      setLoading(false);
    }
    load();
  }, [formId]);

  function getAnswer(responseId: string, questionId: string) {
    return answers.find((a) => a.response_id === responseId && a.question_id === questionId)?.answer_value || "—";
  }

  function displayName(r: Response) {
    return r.respondent_name || (r.user_id ? profileNames[r.user_id] : null) || "—";
  }

  // Lần nộp thứ mấy của cùng một người (theo user_id, tính từ cũ đến mới)
  const attemptNumber: Record<string, number> = {};
  {
    const byUser: Record<string, Response[]> = {};
    for (const r of responses) {
      if (!r.user_id) continue;
      (byUser[r.user_id] ||= []).push(r);
    }
    for (const list of Object.values(byUser)) {
      const sorted = [...list].sort(
        (a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
      );
      sorted.forEach((r, i) => { attemptNumber[r.id] = i + 1; });
    }
  }

  const filteredResponses = isGraduation && gradeFilter !== "all"
    ? responses.filter((r) => r.grade === gradeFilter)
    : responses;

  function exportCSV() {
    const headers = [
      "Họ tên", "Email", "SĐT",
      ...(isGraduation ? ["Điểm %", "Xếp loại", "Lần nộp"] : []),
      "Thời gian",
      ...questions.map((q) => q.question_text),
    ];
    const rows = filteredResponses.map((r) => [
      displayName(r) === "—" ? "" : displayName(r),
      r.respondent_email || "",
      r.respondent_phone || "",
      ...(isGraduation
        ? [
            r.score_pct !== null ? String(r.score_pct) : "",
            r.grade ? GRADE_LABELS[r.grade] : "",
            r.user_id && attemptNumber[r.id] ? String(attemptNumber[r.id]) : "",
          ]
        : []),
      new Date(r.submitted_at).toLocaleString("vi-VN"),
      ...questions.map((q) => {
        const val = getAnswer(r.id, q.id);
        return val.replace(/\|\|\|/g, ", "); // checkbox separator
      }),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form?.title || "responses"}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-muted-foreground">Đang tải...</div></div>;
  if (!form) return <div className="p-6 text-center text-muted-foreground">Biểu mẫu không tồn tại.</div>;

  const gradeCount = (g: Grade) => responses.filter((r) => r.grade === g).length;

  const statCards = isGraduation
    ? [
        { label: "Tổng lượt nộp", value: responses.length, icon: BarChart3 },
        { label: GRADE_LABELS.xuat_sac, value: gradeCount("xuat_sac"), icon: GraduationCap },
        { label: GRADE_LABELS.tot, value: gradeCount("tot"), icon: GraduationCap },
        { label: GRADE_LABELS.khong_dat, value: gradeCount("khong_dat"), icon: GraduationCap },
      ]
    : [
        { label: "Tổng phản hồi", value: responses.length, icon: BarChart3 },
        { label: "Có tên", value: responses.filter((r) => r.respondent_name).length, icon: User },
        { label: "Có email", value: responses.filter((r) => r.respondent_email).length, icon: Mail },
        { label: "Có SĐT", value: responses.filter((r) => r.respondent_phone).length, icon: Phone },
      ];

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Link href={`/admin/forms/${formId}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold transition-colors">
              <ArrowLeft className="h-4 w-4" /> Quay lại form builder
            </Link>
            <h1 className="text-2xl font-bold"><span className="gold-gradient-text">{form.title}</span></h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><BarChart3 className="h-4 w-4" /> {responses.length} phản hồi</span>
              <span className="flex items-center gap-1"><FileText className="h-4 w-4" /> {questions.length} câu hỏi</span>
              {isGraduation && (
                <span className="flex items-center gap-1 text-gold"><GraduationCap className="h-4 w-4" /> Form tốt nghiệp</span>
              )}
            </div>
          </div>
          {responses.length > 0 && (
            <Button onClick={exportCSV} variant="outline" className="border-gold/50 text-gold hover:bg-gold/10">
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          )}
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                    <stat.icon className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground tabular-nums">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter theo xếp loại — chỉ form graduation */}
        {isGraduation && responses.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium">Lọc xếp loại:</span>
            {([
              { value: "all", label: "Tất cả" },
              { value: "xuat_sac", label: GRADE_LABELS.xuat_sac },
              { value: "tot", label: GRADE_LABELS.tot },
              { value: "khong_dat", label: GRADE_LABELS.khong_dat },
            ] as { value: GradeFilter; label: string }[]).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setGradeFilter(opt.value)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-all",
                  gradeFilter === opt.value
                    ? "border-gold bg-gold/10 text-gold font-medium"
                    : "border-border text-muted-foreground hover:border-gold/30"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Table */}
        {filteredResponses.length === 0 ? (
          <Card className="py-16">
            <CardContent className="text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-semibold">{responses.length === 0 ? "Chưa có phản hồi nào" : "Không có phản hồi khớp bộ lọc"}</p>
              {responses.length === 0 && <p className="text-sm mt-1">Chia sẻ link biểu mẫu để bắt đầu thu thập dữ liệu</p>}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-4">
              <div className="overflow-x-auto rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">#</TableHead>
                      <TableHead className="whitespace-nowrap">Họ tên</TableHead>
                      <TableHead className="whitespace-nowrap">Email</TableHead>
                      <TableHead className="whitespace-nowrap">SĐT</TableHead>
                      {isGraduation && (
                        <>
                          <TableHead className="whitespace-nowrap">Điểm %</TableHead>
                          <TableHead className="whitespace-nowrap">Xếp loại</TableHead>
                          <TableHead className="whitespace-nowrap">Lần nộp</TableHead>
                        </>
                      )}
                      {questions.map((q) => (
                        <TableHead key={q.id} className="whitespace-nowrap max-w-[200px] truncate" title={q.question_text}>
                          {q.question_text}
                        </TableHead>
                      ))}
                      <TableHead className="whitespace-nowrap">Thời gian</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResponses.map((r, i) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                        <TableCell className="text-sm">{displayName(r)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.respondent_email || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.respondent_phone || "—"}</TableCell>
                        {isGraduation && (
                          <>
                            <TableCell className="text-sm font-semibold tabular-nums">
                              {r.score_pct !== null ? `${r.score_pct}%` : "—"}
                            </TableCell>
                            <TableCell>
                              {r.grade ? (
                                <Badge variant="outline" className={cn("text-[10px]", GRADE_STYLES[r.grade])}>
                                  {GRADE_LABELS[r.grade]}
                                </Badge>
                              ) : "—"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground tabular-nums">
                              {r.user_id && attemptNumber[r.id] ? `Lần ${attemptNumber[r.id]}` : "—"}
                            </TableCell>
                          </>
                        )}
                        {questions.map((q) => {
                          const val = getAnswer(r.id, q.id);
                          return (
                            <TableCell key={q.id} className="text-sm max-w-[200px]">
                              {q.question_type === "rating" ? (
                                <span className="text-amber-400 font-semibold">{val} ⭐</span>
                              ) : q.question_type === "checkbox" ? (
                                val.split("|||").filter(Boolean).map((v, j) => (
                                  <Badge key={j} variant="outline" className="mr-1 mb-0.5 text-[10px]">{v}</Badge>
                                ))
                              ) : (
                                <span className="truncate block" title={val}>{val}</span>
                              )}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(r.submitted_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
