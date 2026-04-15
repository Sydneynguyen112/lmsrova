import { users } from "@/lib/mock-data";
import { AdminStudentDetailView } from "./AdminStudentDetailView";

export function generateStaticParams() {
  return users
    .filter((u) => u.role === "student")
    .map((u) => ({ studentId: u.id }));
}

export const dynamicParams = true;

export default async function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return <AdminStudentDetailView studentId={studentId} />;
}
