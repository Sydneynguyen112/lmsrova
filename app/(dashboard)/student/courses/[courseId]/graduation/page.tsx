import { GraduationView } from "./GraduationView";

export const dynamic = "force-dynamic";

export default async function CourseGraduationPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  return <GraduationView courseId={courseId} />;
}
