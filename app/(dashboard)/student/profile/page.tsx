"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PlayCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/auth";
import type { Profile } from "@/lib/auth";
import { ProfileEditor } from "@/components/shared/ProfileEditor";
import { Button } from "@/components/ui/button";
import { getOnboardingVideoSetting } from "@/lib/api-onboarding-video";

export default function StudentProfilePage() {
  const currentUser = useCurrentUser("student");
  const [mentorName, setMentorName] = useState<string | null>(null);
  const [hasOnboardingVideo, setHasOnboardingVideo] = useState(false);

  useEffect(() => {
    getOnboardingVideoSetting().then((s) => setHasOnboardingVideo(!!s.video_id));
  }, []);

  useEffect(() => {
    if (!currentUser?.mentor_id) return;
    async function loadMentor() {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", currentUser!.mentor_id)
        .single();
      if (data) setMentorName(data.full_name);
    }
    loadMentor();
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  return (
    <>
      <ProfileEditor user={currentUser} mentorName={mentorName} />
      {hasOnboardingVideo && (
        <div className="px-6 pb-6">
          <Link href="/onboarding-video?rewatch=1">
            <Button variant="outline">
              <PlayCircle className="h-4 w-4 mr-2" />
              Xem lại video hướng dẫn bắt đầu
            </Button>
          </Link>
        </div>
      )}
    </>
  );
}
