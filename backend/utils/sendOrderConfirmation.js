const { transporter, formatDate, formatDateTime } = require("./emailHelpers");

const buildItemsRows = (items) =>
  items
    .map(
      (item) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f0ecf8;color:#2d2040;font-size:14px;">
        ${item.name}${item.selectedSize ? ` <span style="color:#9080b0;font-size:12px;">(${item.selectedSize})</span>` : ""}
        ${item.selectedColor ? ` <span style="color:#9080b0;font-size:12px;">/ ${item.selectedColor}</span>` : ""}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0ecf8;color:#6a50a0;font-size:14px;text-align:center;">${item.qty}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0ecf8;color:#2d2040;font-size:14px;text-align:right;">PKR ${(item.price * item.qty).toLocaleString()}</td>
    </tr>`
    )
    .join("");

const sendOrderConfirmation = async (order) => {
  const { customer, items, total, _id, createdAt } = order;

  const orderDate = createdAt || new Date();
  const deliveryDate = new Date(orderDate);
  deliveryDate.setDate(deliveryDate.getDate() + 7);

  const shortId = `#${String(_id).slice(-8).toUpperCase()}`;
  const shippingFee = 0; // COD — adjust if you add shipping logic
  const subtotal = total - shippingFee;
  const fullAddress = `${customer.address}, ${customer.city}, ${customer.province}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="margin:0;padding:0;background:#f4f1f8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1f8;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td align="center" style="background:#1a1030;border-radius:12px 12px 0 0;padding:36px 40px;">
            <p style="margin:0 0 6px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c8a060;">Celestra Jewelry</p>
            <h1 style="margin:0;font-size:22px;font-weight:600;color:#ffffff;letter-spacing:0.5px;">Order Confirmed 💎</h1>
            <p style="margin:10px 0 0;font-size:13px;color:#a090c0;">Thank you for shopping with us!</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:40px;border-left:1px solid #e8e0f0;border-right:1px solid #e8e0f0;">

            <!-- Greeting -->
            <p style="margin:0 0 8px;font-size:16px;color:#2d2040;">Hi <strong>${customer.name}</strong>,</p>
            <p style="margin:0 0 24px;font-size:14px;color:#5a4a7a;line-height:1.6;">
              Your order <strong style="color:#6a50a0;">${shortId}</strong> has been successfully placed on
              <strong>${formatDateTime(orderDate)}</strong>.<br>
              Payment method: <strong>Cash on Delivery</strong>.
            </p>
            <p style="margin:0 0 28px;font-size:14px;color:#5a4a7a;line-height:1.6;">
              We're currently preparing your order and will notify you once it's shipped.
            </p>

            <!-- Divider -->
            <hr style="border:none;border-top:1px solid #f0ecf8;margin:0 0 28px;">

            <!-- Order Details -->
            <p style="margin:0 0 14px;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#c8a060;">Order Details</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e0f0;border-radius:8px;overflow:hidden;margin-bottom:20px;">
              <thead>
                <tr style="background:#f8f5ff;">
                  <th style="padding:10px 12px;text-align:left;font-size:12px;color:#9080b0;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Product</th>
                  <th style="padding:10px 12px;text-align:center;font-size:12px;color:#9080b0;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Qty</th>
                  <th style="padding:10px 12px;text-align:right;font-size:12px;color:#9080b0;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${buildItemsRows(items)}
              </tbody>
            </table>

            <!-- Totals -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="padding:4px 0;font-size:14px;color:#5a4a7a;">Subtotal</td>
                <td style="padding:4px 0;font-size:14px;color:#2d2040;text-align:right;">PKR ${subtotal.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;font-size:14px;color:#5a4a7a;">Shipping Fee</td>
                <td style="padding:4px 0;font-size:14px;color:#2d2040;text-align:right;">${shippingFee === 0 ? "Free" : `PKR ${shippingFee.toLocaleString()}`}</td>
              </tr>
              <tr>
                <td style="padding:10px 0 4px;font-size:16px;font-weight:700;color:#1a1030;border-top:2px solid #e8e0f0;">Total Amount</td>
                <td style="padding:10px 0 4px;font-size:16px;font-weight:700;color:#6a50a0;text-align:right;border-top:2px solid #e8e0f0;">PKR ${total.toLocaleString()}</td>
              </tr>
            </table>

            <!-- Divider -->
            <hr style="border:none;border-top:1px solid #f0ecf8;margin:0 0 28px;">

            <!-- Delivery Info -->
            <p style="margin:0 0 14px;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#c8a060;">Delivery Information</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
              ${[
                ["Name", customer.name],
                ["Address", fullAddress],
                ["Phone", customer.phone],
                ["Email", customer.email],
                ["Estimated Delivery", `<strong style="color:#6a50a0;">${formatDate(deliveryDate)}</strong>`],
              ]
                .map(
                  ([label, value]) => `
              <tr>
                <td style="padding:6px 0;font-size:13px;color:#9080b0;width:140px;vertical-align:top;">${label}</td>
                <td style="padding:6px 0;font-size:14px;color:#2d2040;">${value}</td>
              </tr>`
                )
                .join("")}
            </table>

            <!-- Note -->
            <div style="background:#fdf8ff;border-left:3px solid #c8a060;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:28px;">
              <p style="margin:0;font-size:13px;color:#5a4a7a;line-height:1.6;">
                <strong style="color:#1a1030;">Important:</strong> Please keep your phone reachable as our delivery team may contact you before delivery.
              </p>
            </div>

            <p style="margin:0;font-size:14px;color:#5a4a7a;line-height:1.6;">
              If you have any questions, feel free to <a href="mailto:${process.env.MAIL_USER}" style="color:#6a50a0;text-decoration:none;">contact us</a>.
            </p>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="background:#f0ecf8;border-radius:0 0 12px 12px;border:1px solid #e8e0f0;border-top:none;padding:24px 40px;">
            <p style="margin:0;font-size:14px;color:#6a50a0;font-weight:600;">Thank you for choosing Celestra Jewelry 💎</p>
            <p style="margin:8px 0 0;font-size:11px;color:#b0a0c8;">&copy; ${new Date().getFullYear()} Celestra Jewelry. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"Celestra Jewelry" <${process.env.MAIL_USER}>`,
    to: customer.email,
    subject: `Order Confirmation – Celestra Jewelry`,
    html,
  });
};

module.exports = sendOrderConfirmation;
