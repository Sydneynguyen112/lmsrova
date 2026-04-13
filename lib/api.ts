import { supabase } from "./supabase";

// ─── PROFILES ───
export async function getProfiles() {
  const { data } = await supabase.from("profiles").select("*").order("created_at");
  return data || [];
}

export async function getProfileById(id: string) {
  const { data } = await supabase.from("profiles").select("*").eq("id", id).single();
  return data;
}

export async function getProfileByEmail(email: string) {
  const { data } = await supabase.from("profiles").select("*").eq("email", email).single();
  return data;
}

export async function getStudents() {
  const { data } = await supabase.from("profiles").select("*").eq("role", "student").order("created_at");
  return data || [];
}

export async function getMentors() {
  const { data } = await supabase.from("profiles").select("*").eq("role", "mentor").order("created_at");
  return data || [];
}

export async function getStudentsByMentor(mentorId: string) {
  const { data } = await supabase.from("profiles").select("*").eq("mentor_id", mentorId).eq("role", "student").order("created_at");
  return data || [];
}

// ─── COURSES ───
export async function getCourses() {
  const { data } = await supabase.from("courses").select("*").order("created_at");
  return data || [];
}

export async function getCourseById(courseId: string) {
  const { data } = await supabase.from("courses").select("*").eq("id", courseId).single();
  return data;
}

// ─── MODULES & LESSONS ───
export async function getModulesByCourse(courseId: string) {
  const { data } = await supabase.from("modules").select("*").eq("course_id", courseId).order("order_index");
  return data || [];
}

export async function getLessonsByModule(moduleId: string) {
  const { data } = await supabase.from("lessons").select("*").eq("module_id", moduleId).order("order_index");
  return data || [];
}

export async function getLessonById(lessonId: string) {
  const { data } = await supabase.from("lessons").select("*").eq("id", lessonId).single();
  return data;
}

// ─── ASSIGNMENTS ───
export async function getAssignmentsByCourse(courseId: string) {
  const { data } = await supabase.from("assignments").select("*").eq("course_id", courseId).order("order_index");
  return data || [];
}

// ─── SUBMISSIONS ───
export async function getSubmissionsByUser(userId: string) {
  const { data } = await supabase.from("submissions").select("*").eq("user_id", userId).order("submitted_at", { ascending: false });
  return data || [];
}

export async function getUngradedSubmissions() {
  const { data } = await supabase.from("submissions").select("*").is("graded_at", null).order("submitted_at");
  return data || [];
}

export async function createSubmission(submission: {
  assignment_id: string;
  user_id: string;
  image_urls?: string[];
  note?: string;
  metadata?: Record<string, unknown>;
}) {
  const { data, error } = await supabase.from("submissions").insert(submission).select().single();
  if (error) throw error;
  return data;
}

export async function gradeSubmission(submissionId: string, feedback: string) {
  const { data, error } = await supabase
    .from("submissions")
    .update({ mentor_feedback: feedback, graded_at: new Date().toISOString() })
    .eq("id", submissionId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── ENROLLMENTS ───
export async function getEnrollmentsByUser(userId: string) {
  const { data } = await supabase.from("enrollments").select("*").eq("user_id", userId);
  return data || [];
}

// ─── LESSON PROGRESS ───
export async function getLessonProgressByUser(userId: string) {
  const { data } = await supabase.from("lesson_progress").select("*").eq("user_id", userId);
  return data || [];
}

export async function markLessonComplete(userId: string, lessonId: string) {
  const { data, error } = await supabase
    .from("lesson_progress")
    .upsert({ user_id: userId, lesson_id: lessonId, completed: true, completed_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── MENTOR REVIEWS ───
export async function getReviewsByMentor(mentorId: string) {
  const { data } = await supabase.from("mentor_reviews").select("*").eq("mentor_id", mentorId).order("created_at", { ascending: false });
  return data || [];
}

export async function getAvgRating(mentorId: string) {
  const reviews = await getReviewsByMentor(mentorId);
  if (reviews.length === 0) return 0;
  return Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10;
}

export async function createReview(review: {
  mentor_id: string;
  student_id: string;
  rating: number;
  feedback: string;
}) {
  const { data, error } = await supabase.from("mentor_reviews").insert(review).select().single();
  if (error) throw error;
  return data;
}

// ─── BLOG ───
export async function getPublishedPosts() {
  const { data } = await supabase.from("blog_posts").select("*").eq("published", true).order("created_at", { ascending: false });
  return data || [];
}

export async function getAllPosts() {
  const { data } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
  return data || [];
}

export async function createBlogPost(post: {
  title: string;
  type: string;
  summary: string;
  content: string;
  cover_url?: string;
  author_id: string;
  published: boolean;
}) {
  const { data, error } = await supabase.from("blog_posts").insert(post).select().single();
  if (error) throw error;
  return data;
}

export async function getCommentsByPost(postId: string) {
  const { data } = await supabase.from("blog_comments").select("*").eq("post_id", postId).order("created_at");
  return data || [];
}

export async function createComment(comment: {
  post_id: string;
  user_id: string;
  content: string;
}) {
  const { data, error } = await supabase.from("blog_comments").insert(comment).select().single();
  if (error) throw error;
  return data;
}

export async function toggleLike(postId: string, userId: string) {
  const { data: existing } = await supabase
    .from("blog_likes")
    .select("*")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .single();

  if (existing) {
    await supabase.from("blog_likes").delete().eq("post_id", postId).eq("user_id", userId);
    return false;
  } else {
    await supabase.from("blog_likes").insert({ post_id: postId, user_id: userId });
    return true;
  }
}
