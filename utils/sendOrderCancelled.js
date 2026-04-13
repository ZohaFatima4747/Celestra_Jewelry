const { transporter, emailWrapper } = require("./emailHelpers");

const sendOrderCancelled = async (order) => {
  const { customer, _id } = order;
  const shortId = `#${String(_id).slice(-8).toUpperCase()}`;

  const body = `
    <p style="margin:0 0 8px;font-size:16px;color:#2d2040;">Hi <strong>${customer.name}</strong>,</p>
    <p style="margin:0 0 24px;font-size:14px;color:#5a4a7a;line-height:1.6;">
      Your order <strong style="color:#6a50a0;">${shortId}</strong> has been cancelled.
    </p>

    <div style="background:#fff5f5;border-left:3px solid #e74c3c;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:28px;">
      <p style="margin:0;font-size:13px;color:#5a4a7a;line-height:1.6;">
        If this was not intentional or you need assistance, feel free to
        <a href="mailto:${process.env.MAIL_USER}" style="color:#6a50a0;text-decoration:none;">contact us</a>.
      </p>
    </div>

    <p style="margin:0;font-size:14px;color:#5a4a7a;line-height:1.6;">
      We hope to serve you again in the future.
    </p>`;

  const html = emailWrapper(
    "Order Cancelled",
    "We're sorry to see your order go.",
    body
  );

  await transporter.sendMail({
    from: `"Celestra Jewelry" <${process.env.MAIL_USER}>`,
    to: customer.email,
    subject: `Order Cancelled – Celestra Jewelry`,
    html,
  });
};

module.exports = sendOrderCancelled;
