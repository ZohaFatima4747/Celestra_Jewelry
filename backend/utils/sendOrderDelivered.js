const { transporter, emailWrapper } = require("./emailHelpers");

const sendOrderDelivered = async (order) => {
  const { customer, _id } = order;
  const shortId = `#${String(_id).slice(-8).toUpperCase()}`;

  const body = `
    <p style="margin:0 0 8px;font-size:16px;color:#2d2040;">Hi <strong>${customer.name}</strong>,</p>
    <p style="margin:0 0 24px;font-size:14px;color:#5a4a7a;line-height:1.6;">
      Your order <strong style="color:#6a50a0;">${shortId}</strong> has been successfully delivered.
    </p>

    <!-- Delivered Badge -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td align="center" style="background:#f8f5ff;border:1px solid #e8e0f0;border-radius:8px;padding:24px 20px;">
          <p style="margin:0 0 6px;font-size:28px;">💎</p>
          <p style="margin:0;font-size:15px;font-weight:600;color:#1a1030;">We hope you loved your purchase!</p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 20px;font-size:14px;color:#5a4a7a;line-height:1.6;">
      Thank you for choosing Celestra Jewelry. We'd love to see you shop with us again!
    </p>

    <p style="margin:0;font-size:14px;color:#5a4a7a;line-height:1.6;">
      Have feedback or questions? <a href="mailto:${process.env.MAIL_USER}" style="color:#6a50a0;text-decoration:none;">We'd love to hear from you.</a>
    </p>`;

  const html = emailWrapper(
    "Order Delivered ✅",
    "Thank you for shopping with us!",
    body
  );

  await transporter.sendMail({
    from: `"Celestra Jewelry" <${process.env.MAIL_USER}>`,
    to: customer.email,
    subject: `Order Delivered – Thank You for Shopping!`,
    html,
  });
};

module.exports = sendOrderDelivered;
