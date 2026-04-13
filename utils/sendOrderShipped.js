const { transporter, formatDate, emailWrapper } = require("./emailHelpers");

const sendOrderShipped = async (order) => {
  const { customer, _id, createdAt } = order;

  const deliveryDate = new Date(createdAt || Date.now());
  deliveryDate.setDate(deliveryDate.getDate() + 7);

  const shortId = `#${String(_id).slice(-8).toUpperCase()}`;

  const body = `
    <p style="margin:0 0 8px;font-size:16px;color:#2d2040;">Hi <strong>${customer.name}</strong>,</p>
    <p style="margin:0 0 24px;font-size:14px;color:#5a4a7a;line-height:1.6;">
      Good news! Your order <strong style="color:#6a50a0;">${shortId}</strong> has been shipped.<br>
      It is on the way and will reach you soon.
    </p>

    <!-- Estimated Delivery Badge -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background:#f8f5ff;border:1px solid #e8e0f0;border-radius:8px;padding:18px 20px;">
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#c8a060;">Estimated Delivery</p>
          <p style="margin:0;font-size:20px;font-weight:700;color:#1a1030;">${formatDate(deliveryDate)}</p>
        </td>
      </tr>
    </table>

    <!-- Note -->
    <div style="background:#fdf8ff;border-left:3px solid #c8a060;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:28px;">
      <p style="margin:0;font-size:13px;color:#5a4a7a;line-height:1.6;">
        <strong style="color:#1a1030;">Heads up:</strong> Please keep your phone available — our delivery team may contact you before arrival.
      </p>
    </div>

    <p style="margin:0;font-size:14px;color:#5a4a7a;line-height:1.6;">
      If you have any questions, feel free to <a href="mailto:${process.env.MAIL_USER}" style="color:#6a50a0;text-decoration:none;">contact us</a>.
    </p>`;

  const html = emailWrapper(
    "Your Order Has Been Shipped 🚚",
    "It's on its way to you!",
    body
  );

  await transporter.sendMail({
    from: `"Celestra Jewelry" <${process.env.MAIL_USER}>`,
    to: customer.email,
    subject: `Your Order Has Been Shipped – Celestra Jewelry`,
    html,
  });
};

module.exports = sendOrderShipped;
