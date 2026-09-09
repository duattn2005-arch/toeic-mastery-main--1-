import type { Metadata } from "next";
import {
  COMMISSION_CONFIRM_DAYS,
  COMMISSION_TIERS,
  LATE_ATTRIBUTION_RATE_PERCENT,
  NON_PAYING_REFERRER_RATE_PERCENT,
  REFERRAL_DISCOUNT_PERCENT,
} from "@/lib/constants/referral";

export const metadata: Metadata = { title: "Chính sách chia sẻ" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      <div className="flex flex-col gap-2 text-sm text-muted-foreground [&_strong]:font-medium [&_strong]:text-foreground">
        {children}
      </div>
    </div>
  );
}

export default function ReferralPolicyPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Chính sách chia sẻ website</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Toàn bộ quy định về hoa hồng, xác nhận và rút tiền khi giới thiệu bạn bè đến TOEIC Mastery.
        </p>
      </div>

      <Section title="1. Cách tính hoa hồng">
        <p>
          Hoa hồng được tính trên <strong>mọi lần thanh toán thành công</strong> của người bạn giới thiệu, kể cả các
          lần gia hạn sau này — không chỉ lần nâng cấp đầu tiên.
        </p>
        <p>
          Nếu bạn <strong>chưa từng nâng cấp Pro</strong>, hoặc lượt giới thiệu thuộc diện{" "}
          <strong>ghi nhận muộn</strong> (xem mục 3), mức hoa hồng cố định là{" "}
          <strong>{NON_PAYING_REFERRER_RATE_PERCENT}%</strong> giá trị đơn hàng.
        </p>
        <p>
          Nếu bạn đã từng nâng cấp Pro, mức hoa hồng tăng theo số lượt giới thiệu thành công (số người, không phải số
          lần thanh toán):
        </p>
        <ul className="ml-5 list-disc">
          {COMMISSION_TIERS.map((tier, i) => {
            const next = COMMISSION_TIERS[i + 1];
            const range = next ? `${tier.minReferrals} – ${next.minReferrals - 1}` : `từ ${tier.minReferrals}`;
            return (
              <li key={tier.tier}>
                <strong>{tier.label}</strong>: {range} lượt giới thiệu thành công → hoa hồng{" "}
                <strong>{tier.ratePercent}%</strong>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="2. Lượt giới thiệu thành công được tính thế nào">
        <p>
          Một người được tính là &quot;1 lượt giới thiệu thành công&quot; ngay lần đầu tiên họ nâng cấp Pro thành công qua link
          của bạn. Các lần họ gia hạn thêm sau đó vẫn tạo ra hoa hồng mới cho bạn, nhưng{" "}
          <strong>không làm tăng thêm số lượt</strong> dùng để tính bậc hoa hồng.
        </p>
      </Section>

      <Section title="3. Ghi nhận người giới thiệu (attribution)">
        <p>
          Khi ai đó bấm vào link giới thiệu của bạn, hệ thống ghi nhớ bạn là người giới thiệu trong{" "}
          <strong>60 ngày</strong> kể từ lần bấm đầu tiên (first-touch) — dù sau đó họ có bấm thêm link giới thiệu của
          người khác, bạn vẫn là người được ghi nhận.
        </p>
        <p>
          Nếu người đó đăng ký tài khoản rồi hơn 1 giờ sau mới bấm vào link giới thiệu (&quot;ghi nhận muộn&quot;), lượt giới
          thiệu này luôn nhận mức hoa hồng cố định {LATE_ATTRIBUTION_RATE_PERCENT}%, không tính theo bậc.
        </p>
        <p>
          Người đã từng thanh toán thành công trước khi bấm link giới thiệu của bạn sẽ không thể bị gán làm người bạn
          giới thiệu nữa.
        </p>
      </Section>

      <Section title="4. Xác nhận và rút hoa hồng">
        <p>
          Mỗi hoa hồng mới được tạo ở trạng thái <strong>Đang chờ</strong> và tự động chuyển sang{" "}
          <strong>Có thể rút</strong> sau <strong>{COMMISSION_CONFIRM_DAYS} ngày</strong> kể từ ngày thanh toán, để dự
          phòng trường hợp giao dịch bị hoàn tiền.
        </p>
        <p>
          Tại trang <strong>Hoa hồng</strong>, bạn có thể thêm tài khoản ngân hàng nhận tiền và gửi yêu cầu rút toàn bộ
          số dư có thể rút. Đội ngũ quản trị sẽ duyệt và chuyển khoản thủ công.
        </p>
      </Section>

      <Section title="5. Ưu đãi cho người được giới thiệu">
        <p>
          Người được bạn giới thiệu sẽ được giảm <strong>{REFERRAL_DISCOUNT_PERCENT}%</strong> khi nâng cấp Pro lần
          đầu. Nếu họ cũng đang trong thời gian được hưởng ưu đãi thành viên mới, hệ thống sẽ tự động áp dụng mức giá
          nào thấp hơn — hai ưu đãi không cộng dồn với nhau.
        </p>
      </Section>

      <Section title="6. Chống gian lận">
        <p>
          Hệ thống tự động phát hiện các trường hợp bất thường như: người giới thiệu và người được giới thiệu dùng
          chung <strong>số tài khoản ngân hàng</strong> hoặc <strong>cùng một thiết bị đăng nhập</strong>.
        </p>
        <p>
          Khi phát hiện, hoa hồng liên quan sẽ bị huỷ và tài khoản người giới thiệu bị đánh dấu để đội ngũ quản trị
          xem xét. Tài khoản vẫn có thể đăng nhập và sử dụng bình thường trong lúc chờ xem xét.
        </p>
      </Section>
    </div>
  );
}
