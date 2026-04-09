"use client";

import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import Link from "next/link";
import { courses } from "@/lib/mock-data";
import { formatPrice } from "@/lib/utils";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { staggerContainer, fadeInUp } from "@/components/shared/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const plans = [
  {
    courseId: "c-pro",
    features: [
      "12 video bài giảng chuyên sâu",
      "Quiz kiểm tra sau mỗi bài",
      "Bài tập thực hành chart thực tế",
      "Tài liệu PDF + Template Excel",
      "Truy cập cộng đồng Discord",
      "Hỗ trợ từ mentor trong 30 ngày",
    ],
    highlight: false,
  },
  {
    courseId: "c-coaching",
    features: [
      "Tất cả tính năng của Khoá PRO",
      "Mentor 1:1 review bài nộp chi tiết",
      "Chiến lược trading cá nhân hoá",
      "15 video nâng cao + case study",
      "Coaching call hàng tuần",
      "Hỗ trợ không giới hạn thời gian",
      "Cập nhật nội dung trọn đời",
    ],
    highlight: true,
  },
];

const faqs = [
  {
    q: "Tôi chưa biết gì về Trading, có học được không?",
    a: "Hoàn toàn có! Khoá 3 Hộp PRO được thiết kế cho người mới bắt đầu. Bạn sẽ được hướng dẫn từ những kiến thức cơ bản nhất như đọc chart, vẽ trendline, đến các chiến lược trading thực tế.",
  },
  {
    q: "Mentor hỗ trợ như thế nào?",
    a: "Mentor sẽ review bài nộp của bạn, chỉ ra điểm mạnh và điểm cần cải thiện. Với khoá Coaching, bạn còn được 1:1 call hàng tuần để thảo luận chiến lược cá nhân hoá.",
  },
  {
    q: "Tôi có thể học trên điện thoại không?",
    a: "Có, giao diện ROVA được tối ưu cho mọi thiết bị. Tuy nhiên, chúng tôi khuyến khích dùng máy tính để thực hành phân tích chart hiệu quả hơn.",
  },
  {
    q: "Có chính sách hoàn tiền không?",
    a: "Có, ROVA cam kết hoàn tiền 100% trong 7 ngày đầu tiên nếu bạn cảm thấy khoá học không phù hợp. Không điều kiện, không phức tạp.",
  },
  {
    q: "Sau khi hoàn thành khoá PRO, tôi nên làm gì tiếp?",
    a: "Bạn có thể nâng cấp lên khoá Coaching Nâng Cao để được mentor hỗ trợ chuyên sâu hơn, xây dựng chiến lược trading cá nhân hoá, và tiếp cận nội dung nâng cao.",
  },
];

export default function PricingPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-20 md:py-28 relative">
        <div className="absolute inset-0 gold-gradient-radial" />
        <div className="relative mx-auto max-w-7xl px-4 lg:px-8 text-center">
          <ScrollReveal>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold">
              <span className="gold-gradient-text">Bảng giá</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              Đầu tư vào kiến thức — lợi nhuận theo bạn suốt đời
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 md:pb-28">
        <div className="mx-auto max-w-5xl px-4 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-6 lg:gap-8"
          >
            {plans.map((plan) => {
              const course = courses.find((c) => c.id === plan.courseId)!;
              return (
                <motion.div
                  key={plan.courseId}
                  variants={fadeInUp}
                  className={`relative rounded-2xl border p-8 lg:p-10 transition-all duration-300 ${
                    plan.highlight
                      ? "border-gold/40 bg-card gold-glow"
                      : "border-gold-shadow/30 bg-card"
                  }`}
                >
                  {plan.highlight && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-gold-black font-bold px-4">
                      <Star size={14} className="mr-1" />
                      BEST VALUE
                    </Badge>
                  )}

                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    {course.title}
                  </h3>
                  <p className="text-muted-foreground mb-6 text-sm">
                    {course.description}
                  </p>

                  <div className="mb-8">
                    <span className="text-4xl font-extrabold text-gold">
                      {formatPrice(course.price)}
                    </span>
                    <span className="text-muted-foreground text-sm ml-2">
                      / trọn đời
                    </span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-3 text-sm text-foreground"
                      >
                        <Check
                          size={16}
                          className="text-gold mt-0.5 shrink-0"
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link href="/register">
                    <Button
                      className={`w-full font-semibold py-6 rounded-xl ${
                        plan.highlight
                          ? "bg-gold hover:bg-gold-medium text-gold-black"
                          : "bg-gold/10 hover:bg-gold/20 text-gold"
                      }`}
                    >
                      Đăng ký ngay
                    </Button>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-20 md:pb-32">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-bold text-center gold-gradient-text mb-12">
              Câu hỏi thường gặp
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <Accordion className="space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="border border-gold-shadow/30 rounded-xl px-6 bg-card"
                >
                  <AccordionTrigger className="text-left text-foreground hover:text-gold hover:no-underline py-5">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
