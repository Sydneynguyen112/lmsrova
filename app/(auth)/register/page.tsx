"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { UserPlus, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Register:", form);
    // Giả lập: tạo user mới sẽ đăng nhập với student-001 default
    signIn("u-student-001");
    router.push("/onboarding");
  };

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md mx-auto rounded-2xl border border-gold-shadow/30 bg-card p-8"
    >
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground">Tạo tài khoản</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Bắt đầu hành trình Trading cùng ROVA
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Họ và tên
          </label>
          <Input
            placeholder="Nguyễn Văn A"
            value={form.full_name}
            onChange={(e) => update("full_name", e.target.value)}
            required
            className="bg-background border-gold-shadow/30 focus:border-gold/50"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Email
          </label>
          <Input
            type="email"
            placeholder="email@example.com"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            required
            className="bg-background border-gold-shadow/30 focus:border-gold/50"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Số điện thoại
          </label>
          <Input
            type="tel"
            placeholder="0912 345 678"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            required
            className="bg-background border-gold-shadow/30 focus:border-gold/50"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Mật khẩu
          </label>
          <div className="relative">
            <Input
              type={showPw ? "text" : "password"}
              placeholder="Tối thiểu 8 ký tự"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              required
              minLength={8}
              className="bg-background border-gold-shadow/30 focus:border-gold/50 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-gold hover:bg-gold-medium text-gold-black font-semibold py-5 rounded-xl mt-2"
        >
          <UserPlus size={16} className="mr-2" />
          Đăng ký
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Đã có tài khoản?{" "}
        <Link href="/sign-in" className="text-gold hover:underline font-medium">
          Đăng nhập
        </Link>
      </p>
    </motion.div>
  );
}
