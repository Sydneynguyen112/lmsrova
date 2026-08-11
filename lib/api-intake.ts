// Data access cho bài test khám bệnh — plans/260807-intake-assessment/plan.md
// KHÔNG đụng lib/api.ts — file này gom riêng logic intake.
import { supabase } from "./supabase";
import type { Profile } from "./auth";
import type { FormRow } from "./api-forms";
import { initStudentRoadmap, checkAndCompleteStages } from "./roadmap";
import {
  computeIntake,
  buildLegacyOnboardingBlob,
  type IntakeQuestion,
  type IntakeComputed,
} from "./intake-scoring";

// Course id lộ trình chính — giữ NGUYÊN giá trị onboarding cũ đang dùng
const ROADMAP_COURSE_ID = "c-mov3c81m-fdq2";

export interface IntakeForm {
  form: FormRow;
  questions: IntakeQuestion[];
}

// Form khám bệnh đang published mới nhất (soạn từ rova-ops). Null → dùng fallback.
export async function getPublishedIntakeForm(): Promise<IntakeForm | null> {
  const { data: form } = await supabase
    .from("forms")
    .select("*")
    .eq("form_type", "intake")
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!form) return null;

  const { data: questions } = await supabase
    .from("form_questions")
    .select("*")
    .eq("form_id", form.id)
    .order("order_index", { ascending: true });

  return {
    form: form as FormRow,
    questions: (questions as IntakeQuestion[]) || [],
  };
}

// Học viên đã có kết quả khám bệnh chưa (để không bắt làm lại)
export async function hasIntakeResult(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("intake_results")
    .select("id")
    .eq("user_id", userId)
    .limit(1);
  return (data || []).length > 0;
}

/**
 * Pipeline nộp bài — thứ tự BẮT BUỘC (xem plan, mục Ràng buộc sống còn):
 * 1. form_responses (grade null) + form_answers (chỉ câu đã trả lời)
 * 2. Tính điểm client-side
 * 3. Upsert intake_results
 * 4. Update profiles: classification, care_group, date_of_birth,
 *    onboarding_survey (blob legacy — thiếu là học viên kẹt stage 1)
 * 5. initStudentRoadmap → checkAndCompleteStages (y hệt onboarding cũ)
 *
 * formId = null khi dùng bộ câu hỏi fallback (không ghi form_responses).
 */
export async function submitIntake(
  profile: Profile,
  formId: string | null,
  questions: IntakeQuestion[],
  answers: Record<string, string>
): Promise<{ computed: IntakeComputed; error: string | null }> {
  const computed = computeIntake(questions, answers);

  let responseId: string | null = null;
  if (formId) {
    const { data: response, error: respError } = await supabase
      .from("form_responses")
      .insert({
        form_id: formId,
        user_id: profile.id,
        respondent_name: profile.full_name,
        respondent_email: profile.email,
        respondent_phone: profile.phone,
        score_pct: computed.student_visible.trading_dimensions.length > 0
          ? computed.student_visible.trading_dimensions.reduce((s, d) => s + d.pct, 0) /
            computed.student_visible.trading_dimensions.length
          : null,
        grade: null, // intake không xếp loại — grade null để không lọt vào query tốt nghiệp
      })
      .select()
      .single();
    if (respError) return { computed, error: respError.message };
    responseId = response.id;

    const answerRows = questions
      .filter((q) => answers[q.id] !== undefined && answers[q.id] !== "")
      .map((q) => ({
        response_id: responseId,
        question_id: q.id,
        answer_value: answers[q.id],
      }));
    if (answerRows.length > 0) {
      const { error: ansError } = await supabase.from("form_answers").insert(answerRows);
      if (ansError) return { computed, error: ansError.message };
    }
  }

  // Upsert intake_results. UNIQUE(user_id, form_id) không bắt được NULL form_id
  // (NULL != NULL trong Postgres) → đường fallback phải tự dọn dòng cũ.
  const resultRow = {
    user_id: profile.id,
    response_id: responseId,
    form_id: formId,
    birth_date: computed.birth_date,
    birth_time: computed.birth_time,
    life_path_number: computed.life_path_number,
    zodiac: computed.zodiac,
    can_chi: computed.can_chi,
    personality_group: computed.personality_group,
    classification: computed.classification,
    care_group: computed.care_group,
    dimension_scores: computed.dimension_scores,
    flags: computed.flags,
    student_visible: computed.student_visible,
    engine_version: 1,
    computed_at: new Date().toISOString(),
  };

  let intakeResultId: string | undefined;
  if (formId) {
    const { data, error } = await supabase
      .from("intake_results")
      .upsert(resultRow, { onConflict: "user_id,form_id" })
      .select()
      .single();
    if (error) return { computed, error: error.message };
    intakeResultId = data?.id;
  } else {
    await supabase.from("intake_results").delete()
      .eq("user_id", profile.id).is("form_id", null);
    const { data, error } = await supabase
      .from("intake_results")
      .insert(resultRow)
      .select()
      .single();
    if (error) return { computed, error: error.message };
    intakeResultId = data?.id;
  }

  // Blob legacy — BẮT BUỘC, roadmap gate đọc profiles.onboarding_survey
  const legacyBlob = buildLegacyOnboardingBlob(computed, intakeResultId);
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      classification: computed.classification,
      care_group: computed.care_group,
      date_of_birth: computed.birth_date,
      onboarding_survey: legacyBlob,
    })
    .eq("id", profile.id);
  if (profileError) return { computed, error: profileError.message };

  // Giữ NGUYÊN thứ tự gọi của onboarding cũ
  try {
    await initStudentRoadmap(profile.id, ROADMAP_COURSE_ID);
    await checkAndCompleteStages(profile.id, ROADMAP_COURSE_ID);
  } catch (e) {
    // Lộ trình lỗi không chặn học viên — giống hành vi onboarding cũ (console.error only)
    console.error("submitIntake roadmap error:", e);
  }

  return { computed, error: null };
}
