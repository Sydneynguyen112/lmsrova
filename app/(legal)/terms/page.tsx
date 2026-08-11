import type { Metadata } from "next";
import { LegalArticle, type LegalSection } from "../legal-article";

export const metadata: Metadata = {
  title: "Điều khoản dịch vụ | ROVA",
  description:
    "Điều khoản dịch vụ của nền tảng học Trading ROVA — quy định về tài khoản, thanh toán, sở hữu trí tuệ và miễn trừ trách nhiệm.",
};

const sections: LegalSection[] = [
  {
    heading: "Giới thiệu và chấp thuận điều khoản",
    blocks: [
      {
        type: "p",
        text: "ROVA (\"chúng tôi\") là nền tảng học Trading trực tuyến dành cho người Việt, cung cấp khoá học video, lộ trình học tập, bài tập có mentor chấm, quiz và các công cụ hỗ trợ học tập khác (gọi chung là \"Dịch vụ\").",
      },
      {
        type: "p",
        text: "Bằng việc đăng ký tài khoản, truy cập hoặc sử dụng Dịch vụ, bạn xác nhận đã đọc, hiểu và đồng ý bị ràng buộc bởi toàn bộ Điều khoản dịch vụ này cùng Chính sách bảo mật của ROVA. Nếu không đồng ý với bất kỳ nội dung nào, vui lòng không sử dụng Dịch vụ.",
      },
    ],
  },
  {
    heading: "Điều kiện sử dụng",
    blocks: [
      {
        type: "list",
        items: [
          "Bạn phải đủ 18 tuổi trở lên và có đầy đủ năng lực hành vi dân sự để đăng ký và sử dụng Dịch vụ.",
          "Thông tin bạn cung cấp khi đăng ký (họ tên, email, số điện thoại) phải chính xác, đầy đủ và được cập nhật khi có thay đổi.",
          "Mỗi cá nhân chỉ được đăng ký và sử dụng một tài khoản, trừ khi được ROVA chấp thuận khác đi.",
        ],
      },
    ],
  },
  {
    heading: "Tài khoản và bảo mật tài khoản",
    blocks: [
      {
        type: "list",
        items: [
          "Bạn chịu trách nhiệm bảo mật thông tin đăng nhập (email, mật khẩu) và mọi hoạt động diễn ra dưới tài khoản của mình.",
          "Không chia sẻ, cho thuê, cho mượn hoặc chuyển nhượng tài khoản cho bất kỳ ai. Việc nhiều người dùng chung một tài khoản là vi phạm điều khoản và có thể dẫn đến khoá tài khoản mà không hoàn phí.",
          "Nếu phát hiện tài khoản bị truy cập trái phép, bạn cần thông báo ngay cho ROVA qua kênh liên hệ ở cuối trang này.",
        ],
      },
    ],
  },
  {
    heading: "Nội dung dịch vụ và quyền truy cập khoá học",
    blocks: [
      {
        type: "p",
        text: "Sau khi hoàn tất thanh toán và được xác nhận, bạn được cấp quyền truy cập nội dung khoá học tương ứng theo gói đã mua. Quyền truy cập là quyền sử dụng cá nhân, không độc quyền, không được chuyển nhượng.",
      },
      {
        type: "list",
        items: [
          "ROVA có thể cập nhật, bổ sung hoặc điều chỉnh nội dung khoá học, lộ trình học và tính năng của nền tảng để nâng cao chất lượng.",
          "Một số tính năng (nộp bài, quiz, chat mentor, form tốt nghiệp) có thể yêu cầu bạn hoàn thành các bước trước đó trong lộ trình.",
          "ROVA nỗ lực duy trì Dịch vụ hoạt động ổn định nhưng không cam kết Dịch vụ không bị gián đoạn do bảo trì, sự cố kỹ thuật hoặc các nguyên nhân ngoài tầm kiểm soát.",
        ],
      },
    ],
  },
  {
    heading: "Thanh toán và hoàn tiền",
    blocks: [
      {
        type: "list",
        items: [
          "Học phí được niêm yết trên trang bảng giá tại thời điểm mua. ROVA có quyền điều chỉnh giá nhưng không áp dụng hồi tố cho các giao dịch đã hoàn tất.",
          "Thanh toán được thực hiện qua chuyển khoản ngân hàng theo hướng dẫn tại trang thanh toán. Quyền truy cập được kích hoạt sau khi giao dịch được xác nhận.",
          "Do đặc thù sản phẩm là nội dung số có thể truy cập ngay, học phí đã thanh toán không được hoàn lại, trừ trường hợp lỗi phát sinh từ phía ROVA (ví dụ: thu trùng, không cấp được quyền truy cập) hoặc theo chính sách hoàn tiền được công bố riêng cho từng chương trình.",
          "Mọi thắc mắc về giao dịch vui lòng liên hệ ROVA trong vòng 7 ngày kể từ ngày thanh toán để được hỗ trợ.",
        ],
      },
    ],
  },
  {
    heading: "Quyền sở hữu trí tuệ",
    blocks: [
      {
        type: "p",
        text: "Toàn bộ nội dung trên nền tảng — bao gồm video bài giảng, tài liệu, hình ảnh, quiz, lộ trình học, logo và giao diện — thuộc quyền sở hữu của ROVA hoặc bên cấp phép cho ROVA, được bảo hộ theo pháp luật về sở hữu trí tuệ.",
      },
      {
        type: "list",
        items: [
          "Nghiêm cấm sao chép, ghi hình, tải xuống, phát tán, bán lại hoặc chia sẻ nội dung khoá học dưới mọi hình thức khi chưa có văn bản chấp thuận của ROVA.",
          "Vi phạm quyền sở hữu trí tuệ sẽ dẫn đến khoá tài khoản vĩnh viễn không hoàn phí, và ROVA bảo lưu quyền yêu cầu bồi thường theo quy định pháp luật.",
        ],
      },
    ],
  },
  {
    heading: "Hành vi bị cấm",
    blocks: [
      {
        type: "list",
        items: [
          "Sử dụng Dịch vụ vào mục đích vi phạm pháp luật Việt Nam hoặc quyền lợi hợp pháp của bên thứ ba.",
          "Can thiệp, phá hoại, dò quét lỗ hổng, vượt qua các biện pháp bảo mật hoặc thu thập dữ liệu tự động (scraping) trên nền tảng.",
          "Mạo danh ROVA, mentor hoặc học viên khác; đăng tải nội dung sai sự thật, xúc phạm, quấy rối trong các kênh tương tác của nền tảng.",
          "Sử dụng nội dung khoá học để tổ chức giảng dạy, tư vấn thu phí hoặc xây dựng sản phẩm cạnh tranh khi chưa được phép.",
        ],
      },
    ],
  },
  {
    heading: "Miễn trừ trách nhiệm về đầu tư",
    blocks: [
      {
        type: "note",
        text: "QUAN TRỌNG: Toàn bộ nội dung trên ROVA chỉ mang tính chất giáo dục và chia sẻ kiến thức, KHÔNG phải lời khuyên đầu tư, khuyến nghị mua/bán bất kỳ tài sản tài chính nào. Giao dịch ngoại hối, chứng khoán, hàng hoá phái sinh và tài sản số tiềm ẩn rủi ro rất cao và có thể dẫn đến mất một phần hoặc toàn bộ vốn.",
      },
      {
        type: "list",
        items: [
          "ROVA và các mentor không cam kết, bảo đảm hay hứa hẹn bất kỳ mức lợi nhuận nào từ việc áp dụng kiến thức được học.",
          "Kết quả giao dịch trong quá khứ (của mentor hoặc học viên khác) không bảo đảm cho kết quả trong tương lai.",
          "Mọi quyết định giao dịch là quyết định cá nhân của bạn. Bạn tự chịu trách nhiệm về vốn, khẩu vị rủi ro và kết quả giao dịch của mình. Chỉ giao dịch bằng số vốn bạn chấp nhận có thể mất.",
          "ROVA không quản lý vốn, không nhận uỷ thác đầu tư, không kêu gọi góp vốn dưới bất kỳ hình thức nào. Hãy cảnh giác với mọi cá nhân mạo danh ROVA để kêu gọi đầu tư.",
        ],
      },
    ],
  },
  {
    heading: "Giới hạn trách nhiệm",
    blocks: [
      {
        type: "p",
        text: "Trong phạm vi tối đa mà pháp luật cho phép, ROVA không chịu trách nhiệm đối với các thiệt hại gián tiếp, ngẫu nhiên hoặc hệ quả phát sinh từ việc sử dụng hoặc không thể sử dụng Dịch vụ, bao gồm nhưng không giới hạn ở tổn thất tài chính từ hoạt động giao dịch của bạn. Tổng trách nhiệm của ROVA trong mọi trường hợp không vượt quá số học phí bạn đã thanh toán cho khoá học liên quan trong 12 tháng gần nhất.",
      },
    ],
  },
  {
    heading: "Tạm ngưng và chấm dứt tài khoản",
    blocks: [
      {
        type: "list",
        items: [
          "ROVA có quyền tạm khoá hoặc chấm dứt tài khoản vi phạm Điều khoản này, sau khi cân nhắc mức độ vi phạm và (khi phù hợp) thông báo cho bạn.",
          "Bạn có thể yêu cầu xoá tài khoản bất kỳ lúc nào qua kênh liên hệ bên dưới. Việc xoá tài khoản không phát sinh nghĩa vụ hoàn học phí đã thanh toán, trừ trường hợp nêu tại mục Thanh toán và hoàn tiền.",
        ],
      },
    ],
  },
  {
    heading: "Thay đổi điều khoản",
    blocks: [
      {
        type: "p",
        text: "ROVA có thể cập nhật Điều khoản này theo thời gian. Phiên bản mới sẽ được đăng tại trang này kèm ngày cập nhật. Với các thay đổi quan trọng, chúng tôi sẽ thông báo qua email hoặc thông báo trên nền tảng. Việc bạn tiếp tục sử dụng Dịch vụ sau khi điều khoản mới có hiệu lực đồng nghĩa với việc bạn chấp nhận điều khoản mới.",
      },
    ],
  },
  {
    heading: "Luật áp dụng và giải quyết tranh chấp",
    blocks: [
      {
        type: "p",
        text: "Điều khoản này được điều chỉnh bởi pháp luật Việt Nam. Mọi tranh chấp phát sinh trước hết được giải quyết thông qua thương lượng, hoà giải; nếu không thành, tranh chấp sẽ được đưa ra Toà án có thẩm quyền tại Việt Nam.",
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

export default function TermsPage() {
  return (
    <LegalArticle
      title="Điều khoản dịch vụ"
      updated="11/08/2026"
      intro="Vui lòng đọc kỹ Điều khoản dịch vụ này trước khi đăng ký và sử dụng nền tảng học Trading ROVA. Điều khoản này là thoả thuận pháp lý giữa bạn và ROVA về việc sử dụng toàn bộ dịch vụ trên nền tảng."
      sections={sections}
    />
  );
}
