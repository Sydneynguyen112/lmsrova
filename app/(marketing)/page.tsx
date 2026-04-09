import { HeroSection } from "@/components/landing/HeroSection";
import { CoursesSection } from "@/components/landing/CoursesSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { MentorsSection } from "@/components/landing/MentorsSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CTASection } from "@/components/landing/CTASection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CoursesSection />
      <FeaturesSection />
      <MentorsSection />
      <StatsSection />
      <TestimonialsSection />
      <CTASection />
    </>
  );
}
