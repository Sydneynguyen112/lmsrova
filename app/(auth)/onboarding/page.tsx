"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Brain,
  Target,
  BarChart3,
  Monitor,
  LineChart,
  Dice5,
  Wallet,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { getStoredUserId } from "@/lib/auth";
import { initStudentRoadmap, checkAndCompleteStages } from "@/lib/roadmap";

// â”€â”€ Question definitions derived from mock-data answers â”€â”€

interface ScoredOption {
  score: number;
  label: string;
}

interface ScoredQuestion {
  type: "scored";
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  options: ScoredOption[];
}

interface TextQuestion {
  type: "text";
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  placeholder: string;
}

type Question = ScoredQuestion | TextQuestion;

const questions: Question[] = [
  {
    type: "scored",
    id: "self_learning",
    icon: Brain,
    title: "Kháº£ nÄƒng tá»± há»c",
    subtitle: "Khi gáº·p má»™t khÃ¡i niá»‡m má»›i mÃ  báº¡n chÆ°a hiá»ƒu rÃµ, báº¡n thÆ°á»ng lÃ m gÃ¬?",
    options: [
      { score: 1, label: "Xem láº¡i má»™t vÃ i láº§n, náº¿u váº«n chÆ°a rÃµ thÃ¬ chuyá»ƒn sang pháº§n khÃ¡c" },
      { score: 2, label: "Há»i báº¡n bÃ¨ hoáº·c tÃ¬m video khÃ¡c giáº£i thÃ­ch Ä‘Æ¡n giáº£n hÆ¡n" },
      { score: 3, label: "Tá»± tÃ¬m hiá»ƒu thÃªm rá»“i má»›i tiáº¿p tá»¥c" },
      { score: 4, label: "Ghi láº¡i vÃ  tÃ¬m cÃ¡ch hiá»ƒu rÃµ, rá»“i má»›i sang bÃ i tiáº¿p" },
    ],
  },
  {
    type: "scored",
    id: "motivation",
    icon: Target,
    title: "Äá»™ng lá»±c há»c Trading",
    subtitle: "Äiá»u gÃ¬ thÃºc Ä‘áº©y báº¡n tÃ¬m Ä‘áº¿n ROVA?",
    options: [
      { score: 1, label: "TÃ² mÃ², muá»‘n thá»­ xem trading cÃ³ kiáº¿m tiá»n Ä‘Æ°á»£c khÃ´ng" },
      { score: 2, label: "Äang cáº§n thu nháº­p nhanh, muá»‘n há»c vÃ  Ã¡p dá»¥ng sá»›m" },
      { score: 3, label: "Äang gáº·p váº¥n Ä‘á» trong giao dá»‹ch, muá»‘n cÃ³ phÆ°Æ¡ng phÃ¡p rÃµ rÃ ng" },
      { score: 4, label: "ÄÃ£ cÃ³ Ã½ Ä‘á»‹nh há»c bÃ i báº£n, Ä‘i Ä‘Æ°á»ng dÃ i" },
    ],
  },
  {
    type: "scored",
    id: "tradingview_skill",
    icon: BarChart3,
    title: "Ká»¹ nÄƒng TradingView",
    subtitle: "Báº¡n Ä‘Ã£ sá»­ dá»¥ng TradingView á»Ÿ má»©c nÃ o?",
    options: [
      { score: 1, label: "ChÆ°a biáº¿t, chÆ°a cÃ³ tÃ i khoáº£n TradingView" },
      { score: 2, label: "ÄÃ£ tá»«ng dÃ¹ng, chá»§ yáº¿u má»Ÿ lÃªn xem giÃ¡" },
      { score: 3, label: "Biáº¿t váº½ Ä‘Æ°á»ng, Ä‘Ã¡nh dáº¥u vÃ¹ng giÃ¡, thÃªm indicator" },
      { score: 4, label: "CÃ³ layout riÃªng vÃ  sá»­ dá»¥ng thÆ°á»ng xuyÃªn Ä‘á»ƒ phÃ¢n tÃ­ch" },
    ],
  },
  {
    type: "scored",
    id: "device",
    icon: Monitor,
    title: "Thiáº¿t bá»‹ há»c táº­p",
    subtitle: "Báº¡n thÆ°á»ng dÃ¹ng thiáº¿t bá»‹ gÃ¬ Ä‘á»ƒ há»c vÃ  giao dá»‹ch?",
    options: [
      { score: 1, label: "Chá»‰ dÃ¹ng Ä‘iá»‡n thoáº¡i, chÆ°a cÃ³ mÃ¡y tÃ­nh" },
      { score: 2, label: "Chá»§ yáº¿u dÃ¹ng Ä‘iá»‡n thoáº¡i, cÃ³ mÃ¡y tÃ­nh nhÆ°ng khÃ´ng thÆ°á»ng xuyÃªn" },
      { score: 3, label: "Chá»§ yáº¿u dÃ¹ng mÃ¡y tÃ­nh Ä‘á»ƒ há»c vÃ  giao dá»‹ch" },
      { score: 4, label: "ThÃ nh tháº¡o mÃ¡y tÃ­nh vÃ  á»©ng dá»¥ng Ä‘iá»‡n thoáº¡i" },
    ],
  },
  {
    type: "scored",
    id: "trading_method",
    icon: LineChart,
    title: "PhÆ°Æ¡ng phÃ¡p giao dá»‹ch",
    subtitle: "Hiá»‡n táº¡i báº¡n giao dá»‹ch theo phÆ°Æ¡ng phÃ¡p nÃ o?",
    options: [
      { score: 1, label: "ChÆ°a cÃ³ phÆ°Æ¡ng phÃ¡p, chá»§ yáº¿u vÃ o lá»‡nh theo cáº£m tÃ­nh" },
      { score: 2, label: "ÄÃ£ thá»­ qua nhiá»u phÆ°Æ¡ng phÃ¡p, chÆ°a kiá»ƒm chá»©ng rÃµ" },
      { score: 3, label: "Äang táº­p trung giao dá»‹ch theo má»™t phÆ°Æ¡ng phÃ¡p" },
      { score: 4, label: "ÄÃ£ cÃ³ phÆ°Æ¡ng phÃ¡p riÃªng, Ä‘ang tá»‘i Æ°u" },
    ],
  },
  {
    type: "scored",
    id: "probability_thinking",
    icon: Dice5,
    title: "TÆ° duy xÃ¡c suáº¥t",
    subtitle: "Khi báº¡n thua lá»— liÃªn tiáº¿p 3 lá»‡nh, báº¡n thÆ°á»ng lÃ m gÃ¬?",
    options: [
      { score: 1, label: "Xem láº¡i thá»‹ trÆ°á»ng vÃ  Ä‘iá»u chá»‰nh cÃ¡ch vÃ o lá»‡nh" },
      { score: 2, label: "Táº¡m dá»«ng má»™t thá»i gian Ä‘á»ƒ quan sÃ¡t" },
      { score: 3, label: "Xem láº¡i cÃ¡c lá»‡nh Ä‘Ã£ vÃ o Ä‘á»ƒ hiá»ƒu Ä‘iá»u gÃ¬ chÆ°a á»•n" },
      { score: 4, label: "Tiáº¿p tá»¥c giao dá»‹ch nhÆ° bÃ¬nh thÆ°á»ng vÃ  theo dÃµi" },
    ],
  },
  {
    type: "text",
    id: "income_status",
    icon: Wallet,
    title: "TÃ¬nh tráº¡ng thu nháº­p",
    subtitle: "MÃ´ táº£ ngáº¯n gá»n tÃ¬nh tráº¡ng tÃ i chÃ­nh hiá»‡n táº¡i cá»§a báº¡n",
    placeholder: "VÃ­ dá»¥: CÃ³ thu nháº­p á»•n Ä‘á»‹nh hÃ ng thÃ¡ng, trading lÃ  thÃªm",
  },
  {
    type: "text",
    id: "device_detail",
    icon: Smartphone,
    title: "Chi tiáº¿t thiáº¿t bá»‹",
    subtitle: "Báº¡n Ä‘ang dÃ¹ng thiáº¿t bá»‹ gÃ¬ cá»¥ thá»ƒ?",
    placeholder: "VÃ­ dá»¥: MacBook Pro, iPhone 15, setup 2 mÃ n hÃ¬nh...",
  },
];

function classifyScore(totalScore: number, hasAnyOne: boolean): string {
  if (hasAnyOne || totalScore <= 10) return "newbie";
  if (totalScore <= 14) return "beginner";
  if (totalScore <= 19) return "intermediate";
  return "advanced";
}

const classificationInfo: Record<string, { label: string; color: string; description: string }> = {
  newbie: {
    label: "Newbie",
    color: "text-gray-700 dark:text-gray-300",
    description: "Báº¡n má»›i báº¯t Ä‘áº§u hÃ nh trÃ¬nh Trading. ROVA sáº½ hÆ°á»›ng dáº«n báº¡n tá»«ng bÆ°á»›c tá»« cÆ¡ báº£n nháº¥t!",
  },
  beginner: {
    label: "Beginner",
    color: "text-blue-700 dark:text-blue-300",
    description: "Báº¡n Ä‘Ã£ cÃ³ ná»n táº£ng ban Ä‘áº§u. HÃ£y cÃ¹ng ROVA xÃ¢y dá»±ng phÆ°Æ¡ng phÃ¡p giao dá»‹ch vá»¯ng cháº¯c!",
  },
  intermediate: {
    label: "Intermediate",
    color: "text-amber-700 dark:text-amber-300",
    description: "Báº¡n cÃ³ kiáº¿n thá»©c khÃ¡ tá»‘t. ROVA sáº½ giÃºp báº¡n tá»‘i Æ°u chiáº¿n lÆ°á»£c vÃ  quáº£n lÃ½ rá»§i ro!",
  },
  advanced: {
    label: "Advanced",
    color: "text-green-700 dark:text-green-300",
    description: "Báº¡n lÃ  trader cÃ³ kinh nghiá»‡m. ROVA sáº½ Ä‘á»“ng hÃ nh nÃ¢ng cáº¥p há»‡ thá»‘ng giao dá»‹ch cá»§a báº¡n!",
  },
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [showResult, setShowResult] = useState(false);

  const totalSteps = questions.length;
  const currentQuestion = questions[step];
  const progress = ((step + (showResult ? 1 : 0)) / totalSteps) * 100;

  const currentAnswer = answers[currentQuestion?.id];
  const canNext =
    currentQuestion?.type === "scored"
      ? typeof currentAnswer === "number"
      : typeof currentAnswer === "string" && (currentAnswer as string).trim().length > 0;

  const handleSelect = (value: number | string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      setShowResult(true);
    }
  };

  const handleBack = () => {
    if (showResult) {
      setShowResult(false);
    } else if (step > 0) {
      setStep(step - 1);
    }
  };

  // Calculate results
  const scoredQuestions = questions.filter((q) => q.type === "scored");
  const totalScore = scoredQuestions.reduce(
    (sum, q) => sum + (typeof answers[q.id] === "number" ? (answers[q.id] as number) : 0),
    0
  );
  const hasAnyOne = scoredQuestions.some((q) => answers[q.id] === 1);
  const classification = classifyScore(totalScore, hasAnyOne);
  const result = classificationInfo[classification];

  const [saving, setSaving] = useState(false);

  const handleFinish = async () => {
    setSaving(true);
    try {
      const userId = getStoredUserId();
      if (userId) {
        // Build full survey object â€” scored q lÆ°u {score, answer}, text q lÆ°u string
        const surveyAnswers: Record<string, { score: number; answer: string } | string> = {};
        for (const q of questions) {
          const v = answers[q.id];
          if (q.type === "scored" && typeof v === "number") {
            const opt = q.options.find((o) => o.score === v);
            surveyAnswers[q.id] = { score: v, answer: opt?.label ?? "" };
          } else if (q.type === "text" && typeof v === "string") {
            surveyAnswers[q.id] = v;
          }
        }
        const onboarding_survey = {
          answers: surveyAnswers,
          total_score: totalScore,
          has_any_one: hasAnyOne,
          classification,
          completed_at: new Date().toISOString(),
        };
        await supabase
          .from("profiles")
          .update({ classification, onboarding_survey })
          .eq("id", userId);

        // Phase 02: survey xong = khoi tao lo trinh + qua chang onboarding
        await initStudentRoadmap(userId, "c-pro");
        await checkAndCompleteStages(userId, "c-pro");
      }
    } catch (err) {
      console.error("Failed to save onboarding survey:", err);
    }
    router.push("/student");
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            {showResult ? "Káº¿t quáº£" : `CÃ¢u ${step + 1} / ${totalSteps}`}
          </span>
          <span className="text-sm text-gold font-medium">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-gold/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gold"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!showResult ? (
          <motion.div
            key={`step-${step}`}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border border-gold-shadow/30 bg-card p-8 md:p-10"
          >
            {/* Question */}
            <h2 className="text-xl md:text-2xl font-bold text-foreground leading-snug mb-10">
              {currentQuestion.subtitle}
            </h2>

            {/* Options or Text Input */}
            {currentQuestion.type === "scored" ? (
              <div className="space-y-4">
                {currentQuestion.options.map((option) => {
                  const isSelected = answers[currentQuestion.id] === option.score;
                  return (
                    <motion.button
                      key={option.score}
                      onClick={() => handleSelect(option.score)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={cn(
                        "w-full text-left px-5 py-4 rounded-xl border transition-all duration-200",
                        isSelected
                          ? "border-gold/50 bg-gold/10 gold-border-glow"
                          : "border-gold-shadow/30 bg-background hover:border-gold/20 hover:bg-gold/5"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors",
                            isSelected
                              ? "border-gold bg-gold"
                              : "border-muted-foreground/30"
                          )}
                        >
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2 h-2 rounded-full bg-gold-black"
                            />
                          )}
                        </div>
                        <span
                          className={cn(
                            "text-[15px] leading-relaxed",
                            isSelected ? "text-foreground font-medium" : "text-muted-foreground"
                          )}
                        >
                          {option.label}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              <Input
                placeholder={currentQuestion.placeholder}
                value={(answers[currentQuestion.id] as string) || ""}
                onChange={(e) => handleSelect(e.target.value)}
                className="bg-background border-gold-shadow/30 focus:border-gold/50 py-6 text-base"
              />
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-gold-shadow/20">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={step === 0}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft size={16} className="mr-2" />
                Quay láº¡i
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canNext}
                className="bg-gold hover:bg-gold-medium text-gold-black font-semibold px-8 py-5"
              >
                {step === totalSteps - 1 ? "Xem káº¿t quáº£" : "Tiáº¿p theo"}
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          </motion.div>
        ) : (
          /* â”€â”€ Result Screen â”€â”€ */
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-gold-shadow/30 bg-card p-6 md:p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-gold/10 border-2 border-gold/30 flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 size={36} className="text-gold" />
            </motion.div>

            <h2 className="text-2xl font-bold text-foreground mb-2">
              HoÃ n thÃ nh kháº£o sÃ¡t!
            </h2>
            <p className="text-muted-foreground mb-8">
              Dá»±a trÃªn cÃ¢u tráº£ lá»i cá»§a báº¡n, Ä‘Ã¢y lÃ  káº¿t quáº£ phÃ¢n loáº¡i:
            </p>

            {/* Score display */}
            <div className="inline-flex items-center gap-6 rounded-2xl border border-gold/20 bg-gold/5 px-8 py-5 mb-6">
              <div className="text-center">
                <div className="text-4xl font-extrabold text-gold">{totalScore}</div>
                <div className="text-xs text-muted-foreground mt-1">Tá»•ng Ä‘iá»ƒm</div>
              </div>
              <div className="w-px h-12 bg-gold/20" />
              <div className="text-center">
                <div className={cn("text-2xl font-bold", result.color)}>
                  {result.label}
                </div>
                <div className="text-xs text-muted-foreground mt-1">PhÃ¢n loáº¡i</div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
              {result.description}
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft size={16} className="mr-2" />
                Xem láº¡i cÃ¢u tráº£ lá»i
              </Button>
              <Button
                onClick={handleFinish}
                disabled={saving}
                className="bg-gold hover:bg-gold-medium text-gold-black font-bold px-8 py-5 rounded-xl"
              >
                {saving ? "Äang lÆ°u..." : "Báº¯t Ä‘áº§u há»c ngay"}
                {!saving && <ArrowRight size={16} className="ml-2" />}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
