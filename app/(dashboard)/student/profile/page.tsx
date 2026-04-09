"use client";

import { motion } from "framer-motion";
import { User, Mail, Phone, Shield, Users, Calendar } from "lucide-react";

import { users } from "@/lib/mock-data";
import { cn, formatDate } from "@/lib/utils";
import { useCurrentUser } from "@/lib/auth";
import { PageTransition } from "@/components/shared/PageTransition";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const classificationLabels: Record<string, string> = {
  newbie: "Newbie",
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const classificationColors: Record<string, string> = {
  newbie: "bg-blue-600/20 text-blue-400",
  beginner: "bg-green-600/20 text-green-400",
  intermediate: "bg-gold/20 text-gold",
  advanced: "bg-purple-600/20 text-purple-400",
};

export default function StudentProfilePage() {
  const currentUser = useCurrentUser("student");

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  const mentor = users.find((u) => u.id === currentUser.mentor_id);

  const infoRows = [
    {
      icon: <Mail className="h-4 w-4 text-gold" />,
      label: "Email",
      value: currentUser.email,
    },
    {
      icon: <Phone className="h-4 w-4 text-gold" />,
      label: "Số điện thoại",
      value: currentUser.phone,
    },
    {
      icon: <Shield className="h-4 w-4 text-gold" />,
      label: "Phân loại",
      value: (
        <Badge
          className={cn(
            classificationColors[currentUser.classification || "newbie"]
          )}
        >
          {classificationLabels[currentUser.classification || "newbie"]}
        </Badge>
      ),
    },
    {
      icon: <Users className="h-4 w-4 text-gold" />,
      label: "Mentor",
      value: mentor?.full_name || "Chưa có",
    },
    {
      icon: <Calendar className="h-4 w-4 text-gold" />,
      label: "Ngày tham gia",
      value: formatDate(currentUser.created_at),
    },
  ];

  return (
    <PageTransition>
    <div className="space-y-6 p-6 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold gold-gradient-text">
          Hồ sơ cá nhân
        </h1>
        <p className="text-muted-foreground mt-1">
          Thông tin tài khoản của bạn.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card>
          <CardContent className="space-y-6">
            {/* Avatar + Name */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-gold-shadow/30">
                <AvatarFallback className="bg-gold/10 text-gold text-lg font-bold">
                  {currentUser.full_name
                    .split(" ")
                    .map((w) => w[0])
                    .slice(-2)
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {currentUser.full_name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {currentUser.role === "student" ? "Học viên" : currentUser.role}
                </p>
              </div>
            </div>

            <Separator />

            {/* Info Rows */}
            <div className="space-y-4">
              {infoRows.map((row, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/10">
                    {row.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{row.label}</p>
                    <div className="text-sm text-foreground mt-0.5">
                      {row.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Discord */}
            {currentUser.discord_id && (
              <>
                <Separator />
                <div className="flex items-center gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
                    <svg
                      className="h-4 w-4 text-indigo-400"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Discord</p>
                    <p className="text-sm text-foreground mt-0.5">
                      {currentUser.discord_id}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
    </PageTransition>
  );
}
