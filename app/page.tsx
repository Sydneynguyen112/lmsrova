import { redirect } from "next/navigation";

// LMS chỉ dành cho học viên — không còn trang marketing công khai.
export default function RootPage() {
  redirect("/sign-in");
}
