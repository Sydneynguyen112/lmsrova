"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogIn, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { users } from "@/lib/mock-data";
import { signIn } from "@/lib/auth";

export default function SignInPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    console.log("Sign in:", form);

    // Lookup user by email từ mock-data
    const user = users.find(
      (u) => u.email.toLowerCase() === form.email.trim().toLowerCase()
    );

    if (!user) {
      setError("Email không tồn tại trong hệ thống");
      return;
    }

    // Lưu user vào localStorage
    signIn(user.id);

    // Redirect theo role từ database
    if (user.role === "admin") router.push("/admin");
    else if (user.role === "mentor") router.push("/mentor");
    else router.push("/student");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md mx-auto rounded-2xl border border-gold-shadow/30 bg-card p-8"
    >
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground">Đăng nhập</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Chào mừng bạn quay lại ROVA
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Email
          </label>
          <Input
            type="email"
            placeholder="email@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
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
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
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

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-gold hover:bg-gold-medium text-gold-black font-semibold py-5 rounded-xl mt-2"
        >
          <LogIn size={16} className="mr-2" />
          Đăng nhập
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="text-gold hover:underline font-medium">
          Đăng ký ngay
        </Link>
      </p>
    </motion.div>
  );
}
