// ============================================
// ROVA LMS — Mock Data
// 14 bảng, đúng schema đã chốt
// Dùng cho frontend Phase 1 trước khi lắp Supabase
// ============================================

// ─── USERS (18 cột) ───
export const users = [
    // Admin
    {
      id: "u-admin-001",
      email: "admin@rova.vn",
      full_name: "ROVA Admin",
      phone: "0901000001",
      avatar_url: "/avatars/admin.jpg",
      date_of_birth: "1990-01-15",
      discord_id: "rova_admin#0001",
      role: "admin",
      mentor_id: null,
      classification: null,
      onboarding_completed: true,
      pro_upgraded_at: null,
      upsale_upgraded_at: null,
      referral_source: null,
      risk_tag: "normal",
      last_active_date: "2026-04-03",
      last_login_at: "2026-04-03T08:00:00Z",
      created_at: "2025-01-01T00:00:00Z",
    },
    // Mentor 1
    {
      id: "u-mentor-001",
      email: "tien@rova.vn",
      full_name: "Trương Văn Tiến",
      phone: "0901000002",
      avatar_url: "/avatars/tien.jpg",
      date_of_birth: "1992-05-20",
      discord_id: "tien_trader#1234",
      role: "mentor",
      mentor_id: null,
      classification: null,
      onboarding_completed: true,
      pro_upgraded_at: null,
      upsale_upgraded_at: null,
      referral_source: null,
      risk_tag: "normal",
      last_active_date: "2026-04-03",
      last_login_at: "2026-04-03T09:30:00Z",
      created_at: "2025-01-15T00:00:00Z",
    },
    // Mentor 2
    {
      id: "u-mentor-002",
      email: "dai@rova.vn",
      full_name: "Nguyễn Xuân Đại",
      phone: "0901000003",
      avatar_url: "/avatars/dai.jpg",
      date_of_birth: "1994-08-12",
      discord_id: "dai_fx#5678",
      role: "mentor",
      mentor_id: null,
      classification: null,
      onboarding_completed: true,
      pro_upgraded_at: null,
      upsale_upgraded_at: null,
      referral_source: null,
      risk_tag: "normal",
      last_active_date: "2026-04-03",
      last_login_at: "2026-04-03T10:00:00Z",
      created_at: "2025-02-01T00:00:00Z",
    },
    // Student 1 — Newbie, đang học tốt
    {
      id: "u-student-001",
      email: "huy@gmail.com",
      full_name: "Lê Quốc Huy",
      phone: "0912000001",
      avatar_url: "/avatars/huy.jpg",
      date_of_birth: "1998-03-10",
      discord_id: "huy_newbie#0001",
      role: "student",
      mentor_id: "u-mentor-001",
      classification: "newbie",
      onboarding_completed: true,
      pro_upgraded_at: "2026-03-15T00:00:00Z",
      upsale_upgraded_at: null,
      referral_source: "facebook",
      risk_tag: "normal",
      last_active_date: "2026-04-03",
      last_login_at: "2026-04-03T07:30:00Z",
      created_at: "2026-03-15T00:00:00Z",
    },
    // Student 2 — Beginner, tiến độ trung bình
    {
      id: "u-student-002",
      email: "mai@gmail.com",
      full_name: "Phạm Thị Mai",
      phone: "0912000002",
      avatar_url: "/avatars/mai.jpg",
      date_of_birth: "1996-07-22",
      discord_id: "mai_trade#0002",
      role: "student",
      mentor_id: "u-mentor-001",
      classification: "beginner",
      onboarding_completed: true,
      pro_upgraded_at: "2026-03-01T00:00:00Z",
      upsale_upgraded_at: null,
      referral_source: "youtube",
      risk_tag: "normal",
      last_active_date: "2026-04-02",
      last_login_at: "2026-04-02T20:00:00Z",
      created_at: "2026-03-01T00:00:00Z",
    },
    // Student 3 — Beginner, nguy cơ bỏ học
    {
      id: "u-student-003",
      email: "duc@gmail.com",
      full_name: "Trần Văn Đức",
      phone: "0912000003",
      avatar_url: "/avatars/duc.jpg",
      date_of_birth: "2000-11-05",
      discord_id: null,
      role: "student",
      mentor_id: "u-mentor-001",
      classification: "beginner",
      onboarding_completed: true,
      pro_upgraded_at: "2026-03-10T00:00:00Z",
      upsale_upgraded_at: null,
      referral_source: "tiktok",
      risk_tag: "at_risk",
      last_active_date: "2026-03-28",
      last_login_at: "2026-03-28T15:00:00Z",
      created_at: "2026-03-10T00:00:00Z",
    },
    // Student 4 — Intermediate, học nhanh
    {
      id: "u-student-004",
      email: "trang@gmail.com",
      full_name: "Nguyễn Thùy Trang",
      phone: "0912000004",
      avatar_url: "/avatars/trang.jpg",
      date_of_birth: "1995-01-18",
      discord_id: "trang_pro#0004",
      role: "student",
      mentor_id: "u-mentor-002",
      classification: "intermediate",
      onboarding_completed: true,
      pro_upgraded_at: "2026-02-15T00:00:00Z",
      upsale_upgraded_at: "2026-03-20T00:00:00Z",
      referral_source: "referral",
      risk_tag: "normal",
      last_active_date: "2026-04-03",
      last_login_at: "2026-04-03T06:00:00Z",
      created_at: "2026-02-15T00:00:00Z",
    },
    // Student 5 — Advanced, đã xong Pro, đang học Coaching
    {
      id: "u-student-005",
      email: "long@gmail.com",
      full_name: "Võ Hoàng Long",
      phone: "0912000005",
      avatar_url: "/avatars/long.jpg",
      date_of_birth: "1993-09-30",
      discord_id: "long_fx#0005",
      role: "student",
      mentor_id: "u-mentor-002",
      classification: "advanced",
      onboarding_completed: true,
      pro_upgraded_at: "2026-01-10T00:00:00Z",
      upsale_upgraded_at: "2026-02-20T00:00:00Z",
      referral_source: "google",
      risk_tag: "normal",
      last_active_date: "2026-04-03",
      last_login_at: "2026-04-03T08:45:00Z",
      created_at: "2026-01-10T00:00:00Z",
    },
    // Student 6 — Newbie, mới đăng ký, chưa bắt đầu
    {
      id: "u-student-006",
      email: "anh@gmail.com",
      full_name: "Hoàng Việt Anh",
      phone: "0912000006",
      avatar_url: null,
      date_of_birth: "1999-04-14",
      discord_id: null,
      role: "student",
      mentor_id: "u-mentor-002",
      classification: "newbie",
      onboarding_completed: true,
      pro_upgraded_at: "2026-04-01T00:00:00Z",
      upsale_upgraded_at: null,
      referral_source: "ads",
      risk_tag: "watch",
      last_active_date: "2026-04-01",
      last_login_at: "2026-04-01T12:00:00Z",
      created_at: "2026-04-01T00:00:00Z",
    },
    // Student 7 — Đã bỏ học
    {
      id: "u-student-007",
      email: "khoa@gmail.com",
      full_name: "Bùi Đăng Khoa",
      phone: "0912000007",
      avatar_url: "/avatars/khoa.jpg",
      date_of_birth: "1997-12-25",
      discord_id: null,
      role: "student",
      mentor_id: "u-mentor-001",
      classification: "newbie",
      onboarding_completed: true,
      pro_upgraded_at: "2026-02-01T00:00:00Z",
      upsale_upgraded_at: null,
      referral_source: "facebook",
      risk_tag: "churned",
      last_active_date: "2026-02-20",
      last_login_at: "2026-02-20T10:00:00Z",
      created_at: "2026-02-01T00:00:00Z",
    },
  ];
  
  // ─── MENTOR PROFILES (3 cột) ───
  export const mentorProfiles = [
    {
      id: "mp-001",
      user_id: "u-mentor-001",
      bio: "5 năm kinh nghiệm trading Forex. Chuyên Price Action và Smart Money Concept. Đã đào tạo hơn 200 học viên từ zero đến profitable.",
    },
    {
      id: "mp-002",
      user_id: "u-mentor-002",
      bio: "Chuyên gia phân tích kỹ thuật với 4 năm kinh nghiệm. Focus vào Crypto và Stock trading. Phong cách mentoring kiên nhẫn, phù hợp với người mới.",
    },
  ];
  
  // ─── USER NOTES (5 cột) ───
  export const userNotes = [
    {
      id: "un-001",
      user_id: "u-student-003",
      author_id: "u-mentor-001",
      content: "Đã nhắn Zalo hỏi thăm, bạn nói đang bận dự án công ty. Hẹn quay lại tuần sau.",
      created_at: "2026-03-29T10:00:00Z",
    },
    {
      id: "un-002",
      user_id: "u-student-003",
      author_id: "u-mentor-001",
      content: "Đã 5 ngày chưa thấy quay lại. Gọi điện lần 2, không nghe máy.",
      created_at: "2026-04-02T14:00:00Z",
    },
    {
      id: "un-003",
      user_id: "u-student-007",
      author_id: "u-mentor-001",
      content: "Học viên xin nghỉ vì lý do tài chính. Đã hoàn thành 3/12 video.",
      created_at: "2026-02-20T11:00:00Z",
    },
    {
      id: "un-004",
      user_id: "u-student-004",
      author_id: "u-mentor-002",
      content: "Học rất nhanh, bài nộp chất lượng. Có thể upsale Coaching sớm.",
      created_at: "2026-03-18T09:00:00Z",
    },
    {
      id: "un-005",
      user_id: "u-student-001",
      author_id: "u-mentor-001",
      content: "Chăm chỉ, ngày nào cũng vào học. Nộp bài đúng hạn. Tư duy tốt.",
      created_at: "2026-04-01T16:00:00Z",
    },
  ];
  
  // ─── MENTOR REVIEWS (6 cột) ───
  export const mentorReviews = [
    {
      id: "mr-001",
      mentor_id: "u-mentor-001",
      student_id: "u-student-001",
      rating: 5,
      feedback: "Anh Thành giải thích rất dễ hiểu, reply nhanh, sửa bài kỹ lưỡng.",
      created_at: "2026-04-01T20:00:00Z",
    },
    {
      id: "mr-002",
      mentor_id: "u-mentor-001",
      student_id: "u-student-002",
      rating: 4,
      feedback: "Mentor nhiệt tình, nhưng đôi khi reply hơi chậm vào cuối tuần.",
      created_at: "2026-03-28T18:00:00Z",
    },
    {
      id: "mr-003",
      mentor_id: "u-mentor-002",
      student_id: "u-student-004",
      rating: 5,
      feedback: "Chị Linh rất kiên nhẫn, phân tích bài nộp chi tiết, chỉ ra cả điểm mình chưa thấy.",
      created_at: "2026-03-25T21:00:00Z",
    },
    {
      id: "mr-004",
      mentor_id: "u-mentor-002",
      student_id: "u-student-005",
      rating: 5,
      feedback: "Mentoring chiến lược rất hay, giúp mình tối ưu hệ thống trading đang có.",
      created_at: "2026-03-30T19:00:00Z",
    },
  ];
  
  // ─── COURSES (6 cột) ───
  export const courses = [
    {
      id: "c-pro",
      title: "Khoá 3 Hộp PRO",
      description:
        "Khóa học nền tảng giúp bạn hiểu từ A-Z về giao dịch: từ cách đọc biểu đồ, vẽ trendline, xác định vùng cung cầu, đến quản lý rủi ro và tâm lý trading. 12 video ngắn gọn dưới 15 phút, dễ học mỗi ngày.",
      thumbnail_url: "/thumbnails/pro-course.jpg",
      price: 7990000,
      created_at: "2025-06-01T00:00:00Z",
    },
    {
      id: "c-coaching",
      title: "Khoá Coaching Nâng Cao",
      description:
        "Dành cho học viên đã hoàn thành Khoá PRO. Đi sâu vào chiến lược giao dịch nâng cao, tối ưu hệ thống, quản trị danh mục và tâm lý giao dịch chuyên nghiệp. Được mentor 1:1 sửa bài hàng ngày.",
      thumbnail_url: "/thumbnails/coaching-course.jpg",
      price: "Nhận tư vấn",
      created_at: "2025-09-01T00:00:00Z",
    },
  ];
  
  // ─── MODULES (4 cột) ───
  export const modules = [
    // Khoá Pro — 1 module duy nhất
    {
      id: "m-pro-all",
      course_id: "c-pro",
      title: "Toàn bộ bài học",
      order_index: 1,
    },
    // Khoá Coaching — 3 modules
    {
      id: "m-coach-1",
      course_id: "c-coaching",
      title: "Nâng cao Price Action",
      order_index: 1,
    },
    {
      id: "m-coach-2",
      course_id: "c-coaching",
      title: "Quản trị rủi ro chuyên sâu",
      order_index: 2,
    },
    {
      id: "m-coach-3",
      course_id: "c-coaching",
      title: "Tâm lý giao dịch chuyên nghiệp",
      order_index: 3,
    },
  ];
  
  // ─── LESSONS (8 cột) ───
  export const lessons = [
    // === Khoá Pro — 12 video ===
    {
      id: "l-pro-01",
      module_id: "m-pro-all",
      title: "Giới thiệu khoá học & Tư duy đúng về Trading",
      thumbnail_url: "/thumbnails/lessons/pro-01.jpg",
      video_url: "https://video.rova.vn/pro/01-intro.mp4",
      materials: [
        { name: "Cheatsheet: Tư duy Trader", url: "/files/pro-01-cheatsheet.pdf", type: "pdf" },
      ],
      duration_sec: 720,
      order_index: 1,
    },
    {
      id: "l-pro-02",
      module_id: "m-pro-all",
      title: "Cách đọc biểu đồ nến Nhật",
      thumbnail_url: "/thumbnails/lessons/pro-02.jpg",
      video_url: "https://video.rova.vn/pro/02-candlestick.mp4",
      materials: [
        { name: "Cheatsheet: Các mẫu nến quan trọng", url: "/files/pro-02-cheatsheet.pdf", type: "pdf" },
        { name: "Slide bài giảng", url: "/files/pro-02-slide.pdf", type: "slide" },
      ],
      duration_sec: 840,
      order_index: 2,
    },
    {
      id: "l-pro-03",
      module_id: "m-pro-all",
      title: "Cách vẽ Trendline chính xác",
      thumbnail_url: "/thumbnails/lessons/pro-03.jpg",
      video_url: "https://video.rova.vn/pro/03-trendline.mp4",
      materials: [
        { name: "Cheatsheet: Quy tắc vẽ Trendline", url: "/files/pro-03-cheatsheet.pdf", type: "pdf" },
      ],
      duration_sec: 780,
      order_index: 3,
    },
    {
      id: "l-pro-04",
      module_id: "m-pro-all",
      title: "Vùng hỗ trợ & kháng cự (Support/Resistance)",
      thumbnail_url: "/thumbnails/lessons/pro-04.jpg",
      video_url: "https://video.rova.vn/pro/04-sr.mp4",
      materials: [
        { name: "Cheatsheet: Cách xác định S/R", url: "/files/pro-04-cheatsheet.pdf", type: "pdf" },
      ],
      duration_sec: 900,
      order_index: 4,
    },
    {
      id: "l-pro-05",
      module_id: "m-pro-all",
      title: "Cung cầu (Supply/Demand) cơ bản",
      thumbnail_url: "/thumbnails/lessons/pro-05.jpg",
      video_url: "https://video.rova.vn/pro/05-supply-demand.mp4",
      materials: [
        { name: "Slide: Supply & Demand", url: "/files/pro-05-slide.pdf", type: "slide" },
      ],
      duration_sec: 850,
      order_index: 5,
    },
    {
      id: "l-pro-06",
      module_id: "m-pro-all",
      title: "Mô hình giá (Chart Patterns)",
      thumbnail_url: "/thumbnails/lessons/pro-06.jpg",
      video_url: "https://video.rova.vn/pro/06-patterns.mp4",
      materials: [
        { name: "Cheatsheet: 10 mô hình giá quan trọng", url: "/files/pro-06-cheatsheet.pdf", type: "pdf" },
      ],
      duration_sec: 870,
      order_index: 6,
    },
    {
      id: "l-pro-07",
      module_id: "m-pro-all",
      title: "Công thức 1: Entry cơ bản",
      thumbnail_url: "/thumbnails/lessons/pro-07.jpg",
      video_url: "https://video.rova.vn/pro/07-entry.mp4",
      materials: [
        { name: "Cheatsheet: Công thức Entry", url: "/files/pro-07-cheatsheet.pdf", type: "pdf" },
      ],
      duration_sec: 810,
      order_index: 7,
    },
    {
      id: "l-pro-08",
      module_id: "m-pro-all",
      title: "Stoploss & Take Profit đúng cách",
      thumbnail_url: "/thumbnails/lessons/pro-08.jpg",
      video_url: "https://video.rova.vn/pro/08-sl-tp.mp4",
      materials: [
        { name: "Cheatsheet: Quy tắc SL/TP", url: "/files/pro-08-cheatsheet.pdf", type: "pdf" },
      ],
      duration_sec: 750,
      order_index: 8,
    },
    {
      id: "l-pro-09",
      module_id: "m-pro-all",
      title: "Quản lý vốn (Risk Management)",
      thumbnail_url: "/thumbnails/lessons/pro-09.jpg",
      video_url: "https://video.rova.vn/pro/09-risk.mp4",
      materials: [
        { name: "Bảng tính quản lý vốn (Excel)", url: "/files/pro-09-calculator.xlsx", type: "excel" },
      ],
      duration_sec: 890,
      order_index: 9,
    },
    {
      id: "l-pro-10",
      module_id: "m-pro-all",
      title: "Tâm lý giao dịch — Kẻ thù lớn nhất là chính mình",
      thumbnail_url: "/thumbnails/lessons/pro-10.jpg",
      video_url: "https://video.rova.vn/pro/10-psychology.mp4",
      materials: [
        { name: "Checklist: Kiểm soát cảm xúc", url: "/files/pro-10-checklist.pdf", type: "pdf" },
      ],
      duration_sec: 820,
      order_index: 10,
    },
    {
      id: "l-pro-11",
      module_id: "m-pro-all",
      title: "Xây dựng Trading Plan cá nhân",
      thumbnail_url: "/thumbnails/lessons/pro-11.jpg",
      video_url: "https://video.rova.vn/pro/11-plan.mp4",
      materials: [
        { name: "Template: Trading Plan", url: "/files/pro-11-template.pdf", type: "pdf" },
      ],
      duration_sec: 860,
      order_index: 11,
    },
    {
      id: "l-pro-12",
      module_id: "m-pro-all",
      title: "Tổng kết & Bước tiếp theo",
      thumbnail_url: "/thumbnails/lessons/pro-12.jpg",
      video_url: "https://video.rova.vn/pro/12-summary.mp4",
      materials: [],
      duration_sec: 600,
      order_index: 12,
    },
    // === Khoá Coaching — Module 1: 5 video ===
    {
      id: "l-coach-01",
      module_id: "m-coach-1",
      title: "Price Action nâng cao: Order Flow",
      thumbnail_url: "/thumbnails/lessons/coach-01.jpg",
      video_url: "https://video.rova.vn/coaching/01-order-flow.mp4",
      materials: [
        { name: "Slide: Order Flow", url: "/files/coach-01-slide.pdf", type: "slide" },
      ],
      duration_sec: 890,
      order_index: 1,
    },
    {
      id: "l-coach-02",
      module_id: "m-coach-1",
      title: "Liquidity Sweep & Stop Hunt",
      thumbnail_url: "/thumbnails/lessons/coach-02.jpg",
      video_url: "https://video.rova.vn/coaching/02-liquidity.mp4",
      materials: [
        { name: "Cheatsheet: Liquidity", url: "/files/coach-02-cheatsheet.pdf", type: "pdf" },
      ],
      duration_sec: 850,
      order_index: 2,
    },
    {
      id: "l-coach-03",
      module_id: "m-coach-1",
      title: "Multi-timeframe Analysis",
      thumbnail_url: "/thumbnails/lessons/coach-03.jpg",
      video_url: "https://video.rova.vn/coaching/03-mtf.mp4",
      materials: [],
      duration_sec: 900,
      order_index: 3,
    },
    {
      id: "l-coach-04",
      module_id: "m-coach-1",
      title: "Confluence Zone — Giao điểm xác suất cao",
      thumbnail_url: "/thumbnails/lessons/coach-04.jpg",
      video_url: "https://video.rova.vn/coaching/04-confluence.mp4",
      materials: [
        { name: "Cheatsheet: Confluence", url: "/files/coach-04-cheatsheet.pdf", type: "pdf" },
      ],
      duration_sec: 870,
      order_index: 4,
    },
    {
      id: "l-coach-05",
      module_id: "m-coach-1",
      title: "Case Study: Phân tích giao dịch thực tế",
      thumbnail_url: "/thumbnails/lessons/coach-05.jpg",
      video_url: "https://video.rova.vn/coaching/05-case-study.mp4",
      materials: [
        { name: "PDF: 5 case studies", url: "/files/coach-05-cases.pdf", type: "pdf" },
      ],
      duration_sec: 880,
      order_index: 5,
    },
    // === Khoá Coaching — Module 2: 5 video ===
    {
      id: "l-coach-06",
      module_id: "m-coach-2",
      title: "Position Sizing nâng cao",
      thumbnail_url: "/thumbnails/lessons/coach-06.jpg",
      video_url: "https://video.rova.vn/coaching/06-position-size.mp4",
      materials: [
        { name: "Calculator: Position Size", url: "/files/coach-06-calc.xlsx", type: "excel" },
      ],
      duration_sec: 820,
      order_index: 1,
    },
    {
      id: "l-coach-07",
      module_id: "m-coach-2",
      title: "Drawdown & Recovery Plan",
      thumbnail_url: "/thumbnails/lessons/coach-07.jpg",
      video_url: "https://video.rova.vn/coaching/07-drawdown.mp4",
      materials: [],
      duration_sec: 790,
      order_index: 2,
    },
    {
      id: "l-coach-08",
      module_id: "m-coach-2",
      title: "Portfolio Management cho Retail Trader",
      thumbnail_url: "/thumbnails/lessons/coach-08.jpg",
      video_url: "https://video.rova.vn/coaching/08-portfolio.mp4",
      materials: [
        { name: "Template: Portfolio Tracker", url: "/files/coach-08-tracker.xlsx", type: "excel" },
      ],
      duration_sec: 860,
      order_index: 3,
    },
    {
      id: "l-coach-09",
      module_id: "m-coach-2",
      title: "Risk per Trade vs Risk per Day",
      thumbnail_url: "/thumbnails/lessons/coach-09.jpg",
      video_url: "https://video.rova.vn/coaching/09-risk-rules.mp4",
      materials: [],
      duration_sec: 750,
      order_index: 4,
    },
    {
      id: "l-coach-10",
      module_id: "m-coach-2",
      title: "Khi nào nên nghỉ trading",
      thumbnail_url: "/thumbnails/lessons/coach-10.jpg",
      video_url: "https://video.rova.vn/coaching/10-when-stop.mp4",
      materials: [
        { name: "Checklist: Dấu hiệu cần nghỉ", url: "/files/coach-10-checklist.pdf", type: "pdf" },
      ],
      duration_sec: 680,
      order_index: 5,
    },
    // === Khoá Coaching — Module 3: 5 video ===
    {
      id: "l-coach-11",
      module_id: "m-coach-3",
      title: "Nhận diện FOMO & Revenge Trading",
      thumbnail_url: "/thumbnails/lessons/coach-11.jpg",
      video_url: "https://video.rova.vn/coaching/11-fomo.mp4",
      materials: [],
      duration_sec: 830,
      order_index: 1,
    },
    {
      id: "l-coach-12",
      module_id: "m-coach-3",
      title: "Trading Journal — Gương phản chiếu",
      thumbnail_url: "/thumbnails/lessons/coach-12.jpg",
      video_url: "https://video.rova.vn/coaching/12-journal.mp4",
      materials: [
        { name: "Template: Trading Journal", url: "/files/coach-12-journal.xlsx", type: "excel" },
      ],
      duration_sec: 870,
      order_index: 2,
    },
    {
      id: "l-coach-13",
      module_id: "m-coach-3",
      title: "Kỷ luật — Skill #1 của Trader",
      thumbnail_url: "/thumbnails/lessons/coach-13.jpg",
      video_url: "https://video.rova.vn/coaching/13-discipline.mp4",
      materials: [],
      duration_sec: 810,
      order_index: 3,
    },
    {
      id: "l-coach-14",
      module_id: "m-coach-3",
      title: "Xây dựng Routine giao dịch hàng ngày",
      thumbnail_url: "/thumbnails/lessons/coach-14.jpg",
      video_url: "https://video.rova.vn/coaching/14-routine.mp4",
      materials: [
        { name: "Template: Daily Routine", url: "/files/coach-14-routine.pdf", type: "pdf" },
      ],
      duration_sec: 760,
      order_index: 4,
    },
    {
      id: "l-coach-15",
      module_id: "m-coach-3",
      title: "Roadmap: Từ học viên đến Trader độc lập",
      thumbnail_url: "/thumbnails/lessons/coach-15.jpg",
      video_url: "https://video.rova.vn/coaching/15-roadmap.mp4",
      materials: [
        { name: "Roadmap PDF", url: "/files/coach-15-roadmap.pdf", type: "pdf" },
      ],
      duration_sec: 700,
      order_index: 5,
    },
  ];
  
  // ─── QUIZZES (5 cột) ───
  export const quizzes = [
    {
      id: "q-pro-02",
      lesson_id: "l-pro-02",
      title: "Kiểm tra: Biểu đồ nến Nhật",
      questions: [
        {
          question: "Nến Doji thể hiện điều gì?",
          options: ["Xu hướng tăng mạnh", "Sự do dự giữa mua và bán", "Xu hướng giảm mạnh", "Không có ý nghĩa gì"],
          correct: 1,
        },
        {
          question: "Nến Hammer xuất hiện ở đâu có ý nghĩa nhất?",
          options: ["Đỉnh xu hướng tăng", "Đáy xu hướng giảm", "Giữa trend", "Bất kỳ đâu"],
          correct: 1,
        },
        {
          question: "Bóng nến dài phía dưới cho thấy điều gì?",
          options: ["Lực bán mạnh", "Lực mua đẩy giá lên từ đáy", "Giá đang sideway", "Không có volume"],
          correct: 1,
        },
      ],
      pass_score: 70,
    },
    {
      id: "q-pro-03",
      lesson_id: "l-pro-03",
      title: "Kiểm tra: Trendline",
      questions: [
        {
          question: "Trendline tăng được vẽ bằng cách nào?",
          options: ["Nối 2 đỉnh cao nhất", "Nối 2 đáy thấp dần", "Nối 2 đáy cao dần", "Nối đỉnh và đáy"],
          correct: 2,
        },
        {
          question: "Cần tối thiểu bao nhiêu điểm chạm để trendline có giá trị?",
          options: ["1 điểm", "2 điểm", "3 điểm", "5 điểm"],
          correct: 2,
        },
        {
          question: "Khi giá break trendline tăng, tín hiệu gì xuất hiện?",
          options: ["Mua mạnh", "Có thể đảo chiều giảm", "Không có ý nghĩa", "Sideway"],
          correct: 1,
        },
      ],
      pass_score: 70,
    },
    {
      id: "q-pro-04",
      lesson_id: "l-pro-04",
      title: "Kiểm tra: Support & Resistance",
      questions: [
        {
          question: "Vùng hỗ trợ (Support) là gì?",
          options: [
            "Vùng giá mà lực mua mạnh hơn lực bán",
            "Vùng giá mà lực bán mạnh hơn lực mua",
            "Đường trung bình động",
            "Vùng giá không có giao dịch",
          ],
          correct: 0,
        },
        {
          question: "Khi Support bị phá vỡ, nó thường trở thành gì?",
          options: ["Support mạnh hơn", "Resistance", "Không có ý nghĩa", "Vùng sideway"],
          correct: 1,
        },
      ],
      pass_score: 70,
    },
    {
      id: "q-pro-07",
      lesson_id: "l-pro-07",
      title: "Kiểm tra: Công thức Entry",
      questions: [
        {
          question: "Trước khi vào lệnh, cần xác nhận mấy yếu tố?",
          options: ["1 yếu tố là đủ", "Ít nhất 2 yếu tố", "Ít nhất 3 yếu tố", "Càng nhiều càng tốt"],
          correct: 2,
        },
        {
          question: "Signal entry nên được xác nhận tại vùng nào?",
          options: ["Bất kỳ đâu trên chart", "Tại vùng S/R hoặc Supply/Demand", "Chỉ tại trendline", "Chỉ khi có indicator xác nhận"],
          correct: 1,
        },
      ],
      pass_score: 70,
    },
    {
      id: "q-pro-09",
      lesson_id: "l-pro-09",
      title: "Kiểm tra: Quản lý vốn",
      questions: [
        {
          question: "Không nên risk quá bao nhiêu % tài khoản cho 1 lệnh?",
          options: ["1-2%", "5-10%", "10-20%", "Tùy cảm hứng"],
          correct: 0,
        },
        {
          question: "Risk:Reward ratio tối thiểu nên là bao nhiêu?",
          options: ["1:0.5", "1:1", "1:2", "1:5"],
          correct: 2,
        },
        {
          question: "Khi thua 3 lệnh liên tiếp, nên làm gì?",
          options: ["Gỡ gấp đôi lot size", "Dừng lại, review lại hệ thống", "Đổi sang cặp tiền khác", "Trading tiếp bình thường"],
          correct: 1,
        },
      ],
      pass_score: 70,
    },
  ];
  
  // ─── ASSIGNMENTS (5 cột) ───
  export const assignments = [
    {
      id: "a-pro-03",
      lesson_id: "l-pro-03",
      title: "Bài tập: Vẽ Trendline trên chart thực tế",
      description:
        "Mở TradingView, chọn cặp EUR/USD khung H4. Vẽ ít nhất 2 trendline (1 tăng, 1 giảm). Chụp ảnh chart đã vẽ và nộp lên. Ghi chú lý do tại sao bạn chọn các điểm đó.",
      materials: [
        { name: "Hướng dẫn: Cách vẽ trendline chuẩn", url: "/files/a-pro-03-guide.pdf", type: "pdf" },
        { name: "Ảnh mẫu tham khảo", url: "/files/a-pro-03-sample.jpg", type: "image" },
      ],
    },
    {
      id: "a-pro-04",
      lesson_id: "l-pro-04",
      title: "Bài tập: Xác định vùng S/R",
      description:
        "Chọn cặp GBP/USD khung D1. Đánh dấu ít nhất 3 vùng Support và 3 vùng Resistance quan trọng. Chụp chart và giải thích ngắn tại sao đó là vùng S/R.",
      materials: [
        { name: "Hướng dẫn xác định S/R", url: "/files/a-pro-04-guide.pdf", type: "pdf" },
      ],
    },
    {
      id: "a-pro-07",
      lesson_id: "l-pro-07",
      title: "Bài tập: Áp dụng Công thức 1",
      description:
        "Tìm 1 setup giao dịch theo Công thức 1 trên bất kỳ cặp tiền nào, khung H1 hoặc H4. Chụp chart với đầy đủ: entry, stoploss, take profit. Ghi lý do vào lệnh.",
      materials: [
        { name: "Template: Trading Setup", url: "/files/a-pro-07-template.jpg", type: "image" },
      ],
    },
    {
      id: "a-pro-11",
      lesson_id: "l-pro-11",
      title: "Bài tập: Viết Trading Plan",
      description:
        "Sử dụng template được cung cấp, viết Trading Plan cá nhân của bạn. Bao gồm: cặp tiền giao dịch, khung thời gian, điều kiện entry/exit, quản lý vốn, và quy tắc tâm lý.",
      materials: [
        { name: "Template: Trading Plan", url: "/files/pro-11-template.pdf", type: "pdf" },
      ],
    },
  ];
  
  // ─── ENROLLMENTS (8 cột) ───
  export const enrollments = [
    // Student 1 — đang học Pro
    {
      id: "e-001",
      user_id: "u-student-001",
      course_id: "c-pro",
      status: "active",
      progress_pct: 58.3,
      target_days: 21,
      enrolled_at: "2026-03-15T00:00:00Z",
      completed_at: null,
    },
    // Student 2 — đang học Pro
    {
      id: "e-002",
      user_id: "u-student-002",
      course_id: "c-pro",
      status: "active",
      progress_pct: 75.0,
      target_days: 14,
      enrolled_at: "2026-03-01T00:00:00Z",
      completed_at: null,
    },
    // Student 3 — tạm dừng Pro
    {
      id: "e-003",
      user_id: "u-student-003",
      course_id: "c-pro",
      status: "paused",
      progress_pct: 25.0,
      target_days: 21,
      enrolled_at: "2026-03-10T00:00:00Z",
      completed_at: null,
    },
    // Student 4 — hoàn thành Pro, đang học Coaching
    {
      id: "e-004",
      user_id: "u-student-004",
      course_id: "c-pro",
      status: "completed",
      progress_pct: 100,
      target_days: 14,
      enrolled_at: "2026-02-15T00:00:00Z",
      completed_at: "2026-03-05T00:00:00Z",
    },
    {
      id: "e-005",
      user_id: "u-student-004",
      course_id: "c-coaching",
      status: "active",
      progress_pct: 40.0,
      target_days: 21,
      enrolled_at: "2026-03-20T00:00:00Z",
      completed_at: null,
    },
    // Student 5 — hoàn thành Pro, đang học Coaching
    {
      id: "e-006",
      user_id: "u-student-005",
      course_id: "c-pro",
      status: "completed",
      progress_pct: 100,
      target_days: 7,
      enrolled_at: "2026-01-10T00:00:00Z",
      completed_at: "2026-01-18T00:00:00Z",
    },
    {
      id: "e-007",
      user_id: "u-student-005",
      course_id: "c-coaching",
      status: "active",
      progress_pct: 66.7,
      target_days: 14,
      enrolled_at: "2026-02-20T00:00:00Z",
      completed_at: null,
    },
    // Student 6 — mới đăng ký, chưa bắt đầu
    {
      id: "e-008",
      user_id: "u-student-006",
      course_id: "c-pro",
      status: "active",
      progress_pct: 0,
      target_days: 21,
      enrolled_at: "2026-04-01T00:00:00Z",
      completed_at: null,
    },
    // Student 7 — dropped
    {
      id: "e-009",
      user_id: "u-student-007",
      course_id: "c-pro",
      status: "dropped",
      progress_pct: 25.0,
      target_days: 21,
      enrolled_at: "2026-02-01T00:00:00Z",
      completed_at: null,
    },
  ];
  
  // ─── LESSON PROGRESS (11 cột) ───
  export const lessonProgress = [
    // Student 1 — đã xem 7/12 video Pro
    { id: "lp-001", user_id: "u-student-001", lesson_id: "l-pro-01", status: "completed", watched_seconds: 720, time_spent_sec: 1200, last_position_sec: 720, watch_count: 1, started_at: "2026-03-15T08:00:00Z", completed_at: "2026-03-15T08:20:00Z", last_watched_at: "2026-03-15T08:20:00Z" },
    { id: "lp-002", user_id: "u-student-001", lesson_id: "l-pro-02", status: "completed", watched_seconds: 1680, time_spent_sec: 2400, last_position_sec: 840, watch_count: 2, started_at: "2026-03-16T07:30:00Z", completed_at: "2026-03-16T08:10:00Z", last_watched_at: "2026-03-17T07:00:00Z" },
    { id: "lp-003", user_id: "u-student-001", lesson_id: "l-pro-03", status: "completed", watched_seconds: 2340, time_spent_sec: 3600, last_position_sec: 780, watch_count: 3, started_at: "2026-03-18T08:00:00Z", completed_at: "2026-03-18T09:00:00Z", last_watched_at: "2026-03-20T07:30:00Z" },
    { id: "lp-004", user_id: "u-student-001", lesson_id: "l-pro-04", status: "completed", watched_seconds: 900, time_spent_sec: 1800, last_position_sec: 900, watch_count: 1, started_at: "2026-03-21T08:00:00Z", completed_at: "2026-03-21T08:30:00Z", last_watched_at: "2026-03-21T08:30:00Z" },
    { id: "lp-005", user_id: "u-student-001", lesson_id: "l-pro-05", status: "completed", watched_seconds: 850, time_spent_sec: 2100, last_position_sec: 850, watch_count: 1, started_at: "2026-03-23T07:00:00Z", completed_at: "2026-03-23T07:35:00Z", last_watched_at: "2026-03-23T07:35:00Z" },
    { id: "lp-006", user_id: "u-student-001", lesson_id: "l-pro-06", status: "completed", watched_seconds: 1740, time_spent_sec: 2700, last_position_sec: 870, watch_count: 2, started_at: "2026-03-25T08:00:00Z", completed_at: "2026-03-25T08:45:00Z", last_watched_at: "2026-03-26T07:00:00Z" },
    { id: "lp-007", user_id: "u-student-001", lesson_id: "l-pro-07", status: "in_progress", watched_seconds: 500, time_spent_sec: 900, last_position_sec: 500, watch_count: 1, started_at: "2026-04-02T07:30:00Z", completed_at: null, last_watched_at: "2026-04-02T07:45:00Z" },
  
    // Student 3 — at_risk, chỉ xem 3 video, dừng lâu
    { id: "lp-020", user_id: "u-student-003", lesson_id: "l-pro-01", status: "completed", watched_seconds: 720, time_spent_sec: 800, last_position_sec: 720, watch_count: 1, started_at: "2026-03-10T20:00:00Z", completed_at: "2026-03-10T20:12:00Z", last_watched_at: "2026-03-10T20:12:00Z" },
    { id: "lp-021", user_id: "u-student-003", lesson_id: "l-pro-02", status: "completed", watched_seconds: 840, time_spent_sec: 900, last_position_sec: 840, watch_count: 1, started_at: "2026-03-12T21:00:00Z", completed_at: "2026-03-12T21:14:00Z", last_watched_at: "2026-03-12T21:14:00Z" },
    { id: "lp-022", user_id: "u-student-003", lesson_id: "l-pro-03", status: "in_progress", watched_seconds: 300, time_spent_sec: 350, last_position_sec: 300, watch_count: 1, started_at: "2026-03-15T20:00:00Z", completed_at: null, last_watched_at: "2026-03-15T20:06:00Z" },
  ];
  
  // ─── QUIZ ATTEMPTS (5 cột) ───
  export const quizAttempts = [
    // Student 1 — quiz bài 2, lần 1
    {
      id: "qa-001",
      quiz_id: "q-pro-02",
      user_id: "u-student-001",
      answers: [1, 1, 1],
      submitted_at: "2026-03-16T08:15:00Z",
    },
    // Student 1 — quiz bài 3, lần 1
    {
      id: "qa-002",
      quiz_id: "q-pro-03",
      user_id: "u-student-001",
      answers: [2, 2, 1],
      submitted_at: "2026-03-18T09:05:00Z",
    },
    // Student 2 — quiz bài 2, lần 1 (sai 1 câu)
    {
      id: "qa-003",
      quiz_id: "q-pro-02",
      user_id: "u-student-002",
      answers: [1, 0, 1],
      submitted_at: "2026-03-05T19:00:00Z",
    },
    // Student 2 — quiz bài 2, lần 2 (làm lại)
    {
      id: "qa-004",
      quiz_id: "q-pro-02",
      user_id: "u-student-002",
      answers: [1, 1, 1],
      submitted_at: "2026-03-06T07:00:00Z",
    },
  ];
  
  // ─── SUBMISSIONS (8 cột) ───
  export const submissions = [
    // Student 1 — nộp bài trendline
    {
      id: "s-001",
      assignment_id: "a-pro-03",
      user_id: "u-student-001",
      image_urls: ["/uploads/s-001-chart1.jpg", "/uploads/s-001-chart2.jpg"],
      metadata: {
        pair: "EUR/USD",
        timeframe: "H4",
        date: "2026-03-19",
        formula: null,
        direction: null,
        note: "Em vẽ 2 trendline tăng và 1 trendline giảm. Trendline tăng nối 2 đáy ngày 10 và 15/3.",
      },
      annotated_image_urls: ["/uploads/s-001-annotated1.jpg"],
      mentor_feedback: "Trendline tăng vẽ đúng. Trendline giảm cần điều chỉnh — nối sai đỉnh, xem lại phút 8:30 trong video.",
      graded_at: "2026-03-19T14:00:00Z",
      submitted_at: "2026-03-19T09:00:00Z",
    },
    // Student 1 — nộp bài trendline lần 2 (sau khi sửa)
    {
      id: "s-002",
      assignment_id: "a-pro-03",
      user_id: "u-student-001",
      image_urls: ["/uploads/s-002-chart1.jpg"],
      metadata: {
        pair: "EUR/USD",
        timeframe: "H4",
        date: "2026-03-20",
        formula: null,
        direction: null,
        note: "Em đã sửa lại trendline giảm theo feedback của mentor.",
      },
      annotated_image_urls: null,
      mentor_feedback: "Chuẩn rồi! Trendline giảm đã đúng. Tiếp tục bài S/R nhé.",
      graded_at: "2026-03-20T15:30:00Z",
      submitted_at: "2026-03-20T08:00:00Z",
    },
    // Student 2 — nộp bài S/R, chưa được chấm
    {
      id: "s-003",
      assignment_id: "a-pro-04",
      user_id: "u-student-002",
      image_urls: ["/uploads/s-003-chart1.jpg", "/uploads/s-003-chart2.jpg", "/uploads/s-003-chart3.jpg"],
      metadata: {
        pair: "GBP/USD",
        timeframe: "D1",
        date: "2026-04-02",
        formula: null,
        direction: null,
        note: "Em đánh dấu 3 vùng Support và 3 vùng Resistance trên khung D1.",
      },
      annotated_image_urls: null,
      mentor_feedback: null,
      graded_at: null,
      submitted_at: "2026-04-02T21:00:00Z",
    },
    // Student 4 — nộp bài Công thức 1
    {
      id: "s-004",
      assignment_id: "a-pro-07",
      user_id: "u-student-004",
      image_urls: ["/uploads/s-004-chart1.jpg"],
      metadata: {
        pair: "XAU/USD",
        timeframe: "H1",
        date: "2026-03-22",
        formula: "Công thức 1",
        direction: "long",
        note: "Entry tại vùng demand H1, SL dưới swing low, TP tại resistance gần nhất. R:R = 1:2.5",
      },
      annotated_image_urls: ["/uploads/s-004-annotated1.jpg"],
      mentor_feedback: "Setup rất tốt! Entry chính xác, SL hợp lý. Một điểm cải thiện: nên check thêm khung H4 trước khi vào lệnh H1.",
      graded_at: "2026-03-22T16:00:00Z",
      submitted_at: "2026-03-22T10:00:00Z",
    },
  ];
  
  // ─── ONBOARDING SURVEYS (7 cột) ───
  export const onboardingSurveys = [
    {
      id: "os-001",
      user_id: "u-student-001",
      answers: {
        self_learning: { score: 1, answer: "Xem lại một vài lần, nếu vẫn chưa rõ thì chuyển sang phần khác" },
        motivation: { score: 2, answer: "Đang cần thu nhập nhanh, muốn học và áp dụng sớm" },
        tradingview_skill: { score: 1, answer: "Chưa biết, chưa có tài khoản TradingView" },
        device: { score: 2, answer: "Chủ yếu dùng điện thoại, có máy tính nhưng không thường xuyên" },
        trading_method: { score: 1, answer: "Chưa có phương pháp, chủ yếu vào lệnh theo cảm tính" },
        probability_thinking: { score: 1, answer: "Xem lại thị trường và điều chỉnh cách vào lệnh" },
        income_status: "Chưa ổn định, phụ thuộc nhiều vào trading",
        device_detail: "Dùng điện thoại Samsung, laptop cũ",
      },
      total_score: 8,
      has_any_one: true,
      classification: "newbie",
      completed_at: "2026-03-15T00:05:00Z",
    },
    {
      id: "os-002",
      user_id: "u-student-002",
      answers: {
        self_learning: { score: 3, answer: "Tự tìm hiểu thêm rồi mới tiếp tục" },
        motivation: { score: 3, answer: "Đang gặp vấn đề trong giao dịch, muốn có phương pháp rõ ràng" },
        tradingview_skill: { score: 2, answer: "Đã từng dùng, chủ yếu mở lên xem giá" },
        device: { score: 3, answer: "Chủ yếu dùng máy tính để học và giao dịch" },
        trading_method: { score: 2, answer: "Đã thử qua nhiều phương pháp, chưa kiểm chứng rõ" },
        probability_thinking: { score: 2, answer: "Tạm dừng một thời gian để quan sát" },
        income_status: "Có thu nhập ổn định hàng tháng, trading là thêm",
        device_detail: "MacBook Pro",
      },
      total_score: 15,
      has_any_one: false,
      classification: "intermediate",
      completed_at: "2026-03-01T00:10:00Z",
    },
    {
      id: "os-003",
      user_id: "u-student-004",
      answers: {
        self_learning: { score: 4, answer: "Ghi lại và tìm cách hiểu rõ, rồi mới sang bài tiếp" },
        motivation: { score: 4, answer: "Đã có ý định học bài bản, đi đường dài" },
        tradingview_skill: { score: 3, answer: "Biết vẽ đường, đánh dấu vùng giá, thêm indicator" },
        device: { score: 4, answer: "Thành thạo máy tính và ứng dụng điện thoại" },
        trading_method: { score: 3, answer: "Đang tập trung giao dịch theo một phương pháp" },
        probability_thinking: { score: 3, answer: "Xem lại các lệnh đã vào để hiểu điều gì chưa ổn" },
        income_status: "Có thu nhập ổn định và không phụ thuộc vào trading",
        device_detail: "iMac + iPhone",
      },
      total_score: 21,
      has_any_one: false,
      classification: "advanced",
      completed_at: "2026-02-15T00:08:00Z",
    },
    {
      id: "os-004",
      user_id: "u-student-005",
      answers: {
        self_learning: { score: 4, answer: "Ghi lại và tìm cách hiểu rõ, rồi mới sang bài tiếp" },
        motivation: { score: 4, answer: "Đã có ý định học bài bản, đi đường dài" },
        tradingview_skill: { score: 4, answer: "Có layout riêng và sử dụng thường xuyên để phân tích" },
        device: { score: 4, answer: "Thành thạo máy tính và ứng dụng điện thoại" },
        trading_method: { score: 4, answer: "Đã có phương pháp riêng, đang tối ưu" },
        probability_thinking: { score: 4, answer: "Tiếp tục giao dịch như bình thường và theo dõi" },
        income_status: "Có thu nhập ổn định và không phụ thuộc vào trading",
        device_detail: "Setup 2 màn hình",
      },
      total_score: 24,
      has_any_one: false,
      classification: "advanced",
      completed_at: "2026-01-10T00:06:00Z",
    },
  ];
  
  // ============================================
  // HELPER: Lấy dữ liệu nhanh
  // ============================================
  
  export const getStudents = () => users.filter((u) => u.role === "student");
  export const getMentors = () => users.filter((u) => u.role === "mentor");
  export const getAdmin = () => users.find((u) => u.role === "admin");
  
  export const getStudentsByMentor = (mentorId: string) =>
    users.filter((u) => u.mentor_id === mentorId);
  
  export const getAtRiskStudents = () =>
    users.filter((u) => u.risk_tag === "at_risk" || u.risk_tag === "watch");
  
  export const getCourseById = (courseId: string) =>
    courses.find((c) => c.id === courseId);
  
  export const getModulesByCourse = (courseId: string) =>
    modules.filter((m) => m.course_id === courseId).sort((a, b) => a.order_index - b.order_index);
  
  export const getLessonsByModule = (moduleId: string) =>
    lessons.filter((l) => l.module_id === moduleId).sort((a, b) => a.order_index - b.order_index);
  
  export const getQuizByLesson = (lessonId: string) =>
    quizzes.find((q) => q.lesson_id === lessonId);
  
  export const getAssignmentByLesson = (lessonId: string) =>
    assignments.find((a) => a.lesson_id === lessonId);
  
  export const getEnrollmentsByUser = (userId: string) =>
    enrollments.filter((e) => e.user_id === userId);
  
  export const getLessonProgressByUser = (userId: string) =>
    lessonProgress.filter((lp) => lp.user_id === userId);
  
  export const getSubmissionsByUser = (userId: string) =>
    submissions.filter((s) => s.user_id === userId);
  
  export const getUngradedSubmissions = () =>
    submissions.filter((s) => s.graded_at === null);
  
  export const getNotesByUser = (userId: string) =>
    userNotes.filter((n) => n.user_id === userId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  export const getReviewsByMentor = (mentorId: string) =>
    mentorReviews.filter((r) => r.mentor_id === mentorId);
  
  export const getAvgRating = (mentorId: string) => {
    const reviews = getReviewsByMentor(mentorId);
    if (reviews.length === 0) return 0;
    return Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10;
  };

  export const getOnboardingSurveyByUser = (userId: string) =>
    onboardingSurveys.find((s) => s.user_id === userId);