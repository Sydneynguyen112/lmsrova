import { LessonPlayerView } from "./LessonPlayerView";

export const dynamic = "force-dynamic";

export default async function LessonPlayerPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  return <LessonPlayerView courseId={courseId} lessonId={lessonId} />;
}
