import { courses, modules, lessons } from "@/lib/mock-data";
import { LessonPlayerView } from "./LessonPlayerView";

export function generateStaticParams() {
  const params: { courseId: string; lessonId: string }[] = [];
  for (const course of courses) {
    const courseModules = modules.filter((m) => m.course_id === course.id);
    for (const mod of courseModules) {
      const moduleLessons = lessons.filter((l) => l.module_id === mod.id);
      for (const lesson of moduleLessons) {
        params.push({ courseId: course.id, lessonId: lesson.id });
      }
    }
  }
  return params;
}

export default async function LessonPlayerPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  return <LessonPlayerView courseId={courseId} lessonId={lessonId} />;
}
