import { courses } from "@/lib/mock-data";
import { CourseDetailView } from "./CourseDetailView";

export function generateStaticParams() {
  return courses.map((c) => ({ courseId: c.id }));
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  return <CourseDetailView courseId={courseId} />;
}
