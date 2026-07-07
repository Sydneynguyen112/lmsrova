import { AdminStudentDetailView } from "./AdminStudentDetailView";

export default async function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return <AdminStudentDetailView studentId={studentId} />;
}
