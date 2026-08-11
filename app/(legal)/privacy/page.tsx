import type { Metadata } from "next";
import { LegalArticle, type LegalSection } from "../legal-article";

export const metadata: Metadata = {
  title: "Chính sách bảo mật | ROVA",
  description:
    "Chính sách bảo mật của nền tảng học Trading ROVA — cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ dữ liệu cá nhân của bạn.",
};

const sections: LegalSection[] = [
  {
    heading: "Phạm vi áp dụng",
    blocks: [
      {
        type: "p",
        text: "Chính sách bảo mật này mô tả cách ROVA thu thập, sử dụng, lưu trữ, chia sẻ và bảo vệ dữ liệu cá nhân của bạn khi bạn truy cập và sử dụng nền tảng học Trading ROVA. Chính sách được xây dựng phù hợp với quy định pháp luật Việt Nam về bảo vệ dữ liệu cá nhân (Nghị định 13/2023/NĐ-CP và các văn bản liên quan).",
      },
      {
        type: "p",
        text: "Bằng việc đăng ký tài khoản và sử dụng dịch vụ, bạn đồng ý với việc xử lý dữ liệu cá nhân theo Chính sách này.",
      },
    ],
  },
  {
    heading: "Dữ liệu chúng tôi thu thập",
    blocks: [
      {
        type: "p",
        text: "Tuỳ theo cách bạn sử dụng nền tảng, ROVA thu thập các nhóm dữ liệu sau:",
      },
      {
        type: "list",
        items: [
          "Thông tin tài khoản: họ tên, địa chỉ email, số điện thoại, mật khẩu (được mã hoá — chúng tôi không thể đọc mật khẩu gốc của bạn).",
          "Thông tin từ Google khi bạn đăng nhập bằng Google OAuth: tên, email, ảnh đại diện theo phạm vi bạn cho phép.",
          "Thông tin khảo sát đầu vào (onboarding): kinh nghiệm giao dịch, mục tiêu học tập và các câu trả lời bạn cung cấp.",
          "Dữ liệu học tập: tiến độ xem bài giảng, bài tập đã nộp, kết quả quiz, ghi chú, form tốt nghiệp và tương tác với mentor (bao gồm tin nhắn trao đổi trong nền tảng).",
          "Thông tin giao dịch: khoá học đã mua, thời điểm thanh toán và trạng thái xác nhận. ROVA không lưu trữ số thẻ hay thông tin đăng nhập ngân hàng của bạn.",
          "Dữ liệu kỹ thuật: loại thiết bị, trình duyệt, dữ liệu cookie/bộ nhớ cục bộ (localStorage) phục vụ duy trì phiên đăng nhập và cải thiện trải nghiệm.",
        ],
      },
    ],
  },
  {
    heading: "Mục đích sử dụng dữ liệu",
    blocks: [
      {
        type: "list",
        items: [
          "Tạo và quản lý tài khoản, xác thực đăng nhập, duy trì phiên làm việc.",
          "Cung cấp dịch vụ học tập: mở quyền truy cập khoá học, theo dõi lộ trình, chấm bài, phản hồi từ mentor.",
          "Hỗ trợ học viên: liên hệ qua email/số điện thoại để xác nhận thanh toán, thông báo lịch học, nhắc tiến độ và chăm sóc trong quá trình học.",
          "Cải thiện chất lượng nền tảng: phân tích dữ liệu học tập ở dạng tổng hợp để tối ưu nội dung khoá học và trải nghiệm người dùng.",
          "Bảo đảm an toàn: phát hiện truy cập bất thường, ngăn chặn gian lận và hành vi vi phạm điều khoản dịch vụ.",
          "Thực hiện nghĩa vụ pháp lý khi cơ quan nhà nước có thẩm quyền yêu cầu theo đúng quy định pháp luật.",
        ],
      },
    ],
  },
  {
    heading: "Lưu trữ dữ liệu và bên xử lý thứ ba",
    blocks: [
      {
        type: "p",
        text: "Dữ liệu của bạn được lưu trữ và xử lý trên hạ tầng của các nhà cung cấp dịch vụ uy tín mà ROVA sử dụng để vận hành nền tảng:",
      },
      {
        type: "list",
        items: [
          "Supabase — lưu trữ cơ sở dữ liệu và dịch vụ xác thực (đăng nhập, mã hoá mật khẩu).",
          "Vercel — hạ tầng máy chủ vận hành website.",
          "Bunny Stream — lưu trữ và phát video bài giảng.",
          "Google — dịch vụ đăng nhập Google OAuth (chỉ khi bạn chọn đăng nhập bằng Google).",
        ],
      },
      {
        type: "p",
        text: "Các nhà cung cấp này chỉ xử lý dữ liệu theo phạm vi cần thiết để cung cấp dịch vụ cho ROVA và có chính sách bảo mật riêng đáp ứng tiêu chuẩn quốc tế. Máy chủ của các nhà cung cấp có thể đặt ngoài lãnh thổ Việt Nam.",
      },
    ],
  },
  {
    heading: "Chia sẻ dữ liệu",
    blocks: [
      {
        type: "note",
        text: "ROVA KHÔNG bán, cho thuê hay trao đổi dữ liệu cá nhân của bạn cho bất kỳ bên thứ ba nào vì mục đích thương mại.",
      },
      {
        type: "p",
        text: "Dữ liệu chỉ được chia sẻ trong các trường hợp: (1) với mentor và đội ngũ vận hành của ROVA ở phạm vi cần thiết để phục vụ việc học của bạn; (2) với các nhà cung cấp hạ tầng nêu tại mục 4; (3) khi có yêu cầu hợp pháp từ cơ quan nhà nước có thẩm quyền; hoặc (4) khi có sự đồng ý rõ ràng của bạn.",
      },
    ],
  },
  {
    heading: "Cookie và bộ nhớ cục bộ",
    blocks: [
      {
        type: "p",
        text: "Nền tảng sử dụng cookie và localStorage của trình duyệt để duy trì phiên đăng nhập, ghi nhớ tuỳ chọn giao diện và bảo đảm các tính năng hoạt động đúng. Bạn có thể xoá cookie/localStorage trong cài đặt trình duyệt, tuy nhiên việc này sẽ khiến bạn phải đăng nhập lại và một số tính năng có thể không hoạt động ổn định.",
      },
    ],
  },
  {
    heading: "Biện pháp bảo vệ dữ liệu",
    blocks: [
      {
        type: "list",
        items: [
          "Toàn bộ kết nối giữa trình duyệt và máy chủ được mã hoá qua HTTPS/TLS.",
          "Mật khẩu được băm (hash) một chiều — kể cả đội ngũ ROVA cũng không thể xem mật khẩu gốc.",
          "Cơ sở dữ liệu áp dụng cơ chế phân quyền theo hàng (Row Level Security) — mỗi tài khoản chỉ truy cập được dữ liệu thuộc về mình theo đúng vai trò (học viên, mentor, admin).",
          "Quyền truy cập dữ liệu trong nội bộ được giới hạn theo nguyên tắc cần-mới-được-biết (need-to-know).",
        ],
      },
      {
        type: "p",
        text: "Không có hệ thống nào an toàn tuyệt đối. Trong trường hợp xảy ra sự cố rò rỉ dữ liệu ảnh hưởng đến bạn, ROVA sẽ thông báo cho bạn và cơ quan chức năng theo quy định pháp luật, đồng thời triển khai ngay các biện pháp khắc phục.",
      },
    ],
  },
  {
    heading: "Quyền của bạn đối với dữ liệu cá nhân",
    blocks: [
      {
        type: "p",
        text: "Theo quy định về bảo vệ dữ liệu cá nhân, bạn có các quyền sau:",
      },
      {
        type: "list",
        items: [
          "Quyền được biết và truy cập dữ liệu cá nhân mà ROVA đang lưu trữ về bạn.",
          "Quyền chỉnh sửa dữ liệu không chính xác (bạn có thể tự cập nhật hồ sơ trong phần cài đặt tài khoản hoặc yêu cầu ROVA hỗ trợ).",
          "Quyền yêu cầu xoá tài khoản và dữ liệu cá nhân, trừ dữ liệu ROVA buộc phải lưu theo nghĩa vụ pháp lý (ví dụ: chứng từ giao dịch).",
          "Quyền rút lại sự đồng ý xử lý dữ liệu, quyền hạn chế hoặc phản đối việc xử lý dữ liệu.",
          "Quyền khiếu nại tới cơ quan quản lý nhà nước có thẩm quyền nếu cho rằng quyền dữ liệu của mình bị xâm phạm.",
        ],
      },
      {
        type: "p",
        text: "Để thực hiện các quyền trên, vui lòng gửi yêu cầu qua email ở mục Thông tin liên hệ. ROVA sẽ phản hồi trong vòng 72 giờ làm việc kể từ khi nhận được yêu cầu hợp lệ.",
      },
    ],
  },
  {
    heading: "Thời gian lưu trữ",
    blocks: [
      {
        type: "p",
        text: "Dữ liệu cá nhân được lưu trữ trong suốt thời gian tài khoản của bạn còn hoạt động. Khi bạn yêu cầu xoá tài khoản, dữ liệu cá nhân sẽ được xoá hoặc ẩn danh hoá trong thời hạn hợp lý, ngoại trừ các dữ liệu phải lưu giữ theo quy định pháp luật về kế toán, thuế và giao dịch điện tử.",
      },
    ],
  },
  {
    heading: "Dịch vụ không dành cho người dưới 18 tuổi",
    blocks: [
      {
        type: "p",
        text: "Nội dung của ROVA liên quan đến giao dịch tài chính và chỉ dành cho người đủ 18 tuổi trở lên. Chúng tôi không chủ đích thu thập dữ liệu của người dưới 18 tuổi. Nếu phát hiện tài khoản do người chưa đủ tuổi đăng ký, ROVA sẽ khoá tài khoản và xoá dữ liệu liên quan.",
      },
    ],
  },
  {
    heading: "Thay đổi chính sách",
    blocks: [
      {
        type: "p",
        text: "ROVA có thể cập nhật Chính sách bảo mật này theo thời gian để phản ánh thay đổi về dịch vụ hoặc quy định pháp luật. Phiên bản mới sẽ được đăng tại trang này kèm ngày cập nhật; với thay đổi quan trọng, chúng tôi sẽ thông báo qua email hoặc trên nền tảng.",
      },
    ],
  },
  {
    heading: "Thông tin liên hệ",
    blocks: [
      {
        type: "list",
        items: [
          "Đơn vị vận hành: ROVA Trading Academy",
          "Email hỗ trợ: moneyisthebest97@gmail.com",
          "Website: https://lmsrova.vercel.app",
        ],
      },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalArticle
      title="Chính sách bảo mật"
      updated="11/08/2026"
      intro="ROVA tôn trọng quyền riêng tư của bạn. Chính sách này giải thích rõ chúng tôi thu thập những dữ liệu nào, dùng vào việc gì, lưu ở đâu, chia sẻ với ai và bạn có những quyền gì đối với dữ liệu cá nhân của mình."
      sections={sections}
    />
  );
}
