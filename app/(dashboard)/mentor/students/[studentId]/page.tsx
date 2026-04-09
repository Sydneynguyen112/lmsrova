import { users } from "@/lib/mock-data";
import { StudentDetailView } from "./StudentDetailView";

export function generateStaticParams() {
  return users
    .filter((u) => u.role === "student")
    .map((u) => ({ studentId: u.id }));
}

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return <StudentDetailView studentId={studentId} />;
}
