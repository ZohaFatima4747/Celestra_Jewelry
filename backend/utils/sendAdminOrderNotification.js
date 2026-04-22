const { transporter, formatDateTime } = require("./emailHelpers");

const ADMIN_EMAIL = "celestrajew@gmail.com";
const DASHBOARD_URL = "https://celestra-admin-dashboard.vercel.app";

const buildItemsRows = (items) =>
  items
    .map(
      (item) => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #f0ecf8;color:#2d2040;font-size:14px;">
        ${item.name}
        ${item.selectedSize ? `<span style="color:#9080b0;font-size:12px;"> (${item.selectedSize})</span>` : ""}
        ${item.selectedColor ? `<span style="color:#9080b0;font-size:12px;"> / ${item.selectedColor}</span>` : ""}
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid #f0ecf8;color:#6a50a0;font-size:14px;text-align:center;">${item.qty}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f0ecf8;color:#2d2040;font-size:14px;text-align:right;">PKR ${(item.price * item.qty).toLocaleString()}</td>
    </tr>`
    )
    .join("");

const sendAdminOrderNotification = async (order) => {
  const { customer, items, total, _id, createdAt } = order;

  const shortId = `#${String(_id).slice(-8).toUpperCase()}`;
  const orderDate = formatDateTime(createdAt || new Date());
  const fullAddress = `${customer.address}, ${customer.city}, ${customer.province}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>New Order Received</title>
</head>
<body style="margin:0;padding:0;background:#f4f1f8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1f8;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td align="center" style="background:#1a1030;border-radius:12px 12px 0 0;padding:36px 40px;">
            <p style="margin:0 0 6px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c8a060;">Celestra Jewelry — Admin</p>
            <h1 style="margin:0;font-size:22px;font-weight:600;color:#ffffff;letter-spacing:0.5px;">🛒 New Order Received</h1>
            <p style="margin:10px 0 0;font-size:13px;color:#a090c0;">A customer just placed an order</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:40px;border-left:1px solid #e8e0f0;border-right:1px solid #e8e0f0;">

            <!-- Order Meta -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#f8f5ff;border:1px solid #e8e0f0;border-radius:8px;padding:18px 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-size:12px;color:#9080b0;text-transform:uppercase;letter-spacing:1px;padding-bottom:4px;">Order ID</td>
                      <td style="font-size:12px;color:#9080b0;text-transform:uppercase;letter-spacing:1px;padding-bottom:4px;text-align:right;">Date &amp; Time</td>
                    </tr>
                    <tr>
                      <td style="font-size:18px;font-weight:700;color:#1a1030;">${shortId}</td>
                      <td style="font-size:14px;color:#5a4a7a;text-align:right;">${orderDate}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Customer Info -->
            <p style="margin:0 0 12px;font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#c8a060;">Customer Details</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;border:1px solid #e8e0f0;border-radius:8px;overflow:hidden;">
              <tr style="background:#faf8ff;">
                <td style="padding:10px 14px;font-size:13px;color:#9080b0;width:35%;border-bottom:1px solid #f0ecf8;">Name</td>
                <td style="padding:10px 14px;font-size:14px;color:#2d2040;border-bottom:1px solid #f0ecf8;">${customer.name}</td>
              </tr>
              <tr>
                <td style="padding:10px 14px;font-size:13px;color:#9080b0;border-bottom:1px solid #f0ecf8;">Email</td>
                <td style="padding:10px 14px;font-size:14px;color:#2d2040;border-bottom:1px solid #f0ecf8;">
                  <a href="mailto:${customer.email}" style="color:#6a50a0;text-decoration:none;">${customer.email || "—"}</a>
                </td>
              </tr>
              <tr style="background:#faf8ff;">
                <td style="padding:10px 14px;font-size:13px;color:#9080b0;border-bottom:1px solid #f0ecf8;">Phone</td>
                <td style="padding:10px 14px;font-size:14px;color:#2d2040;border-bottom:1px solid #f0ecf8;">${customer.phone || "—"}</td>
              </tr>
              <tr>
                <td style="padding:10px 14px;font-size:13px;color:#9080b0;">Shipping Address</td>
                <td style="padding:10px 14px;font-size:14px;color:#2d2040;">${fullAddress}</td>
              </tr>
            </table>

            <!-- Items Table -->
            <p style="margin:0 0 12px;font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#c8a060;">Order Items</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;border:1px solid #e8e0f0;border-radius:8px;overflow:hidden;">
              <thead>
                <tr style="background:#1a1030;">
                  <th style="padding:10px 14px;font-size:12px;font-weight:600;color:#c8a060;text-align:left;letter-spacing:0.5px;">Product</th>
                  <th style="padding:10px 14px;font-size:12px;font-weight:600;color:#c8a060;text-align:center;letter-spacing:0.5px;">Qty</th>
                  <th style="padding:10px 14px;font-size:12px;font-weight:600;color:#c8a060;text-align:right;letter-spacing:0.5px;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${buildItemsRows(items)}
              </tbody>
            </table>

            <!-- Total -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td style="background:#1a1030;border-radius:8px;padding:16px 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-size:15px;color:#a090c0;">Total Amount</td>
                      <td style="font-size:20px;font-weight:700;color:#c8a060;text-align:right;">PKR ${total.toLocaleString()}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${DASHBOARD_URL}" style="display:inline-block;background:#6a50a0;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:14px 32px;border-radius:8px;letter-spacing:0.5px;">
                    View in Admin Dashboard →
                  </a>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="background:#f8f5ff;border:1px solid #e8e0f0;border-radius:0 0 12px 12px;padding:24px 40px;">
            <p style="margin:0;font-size:12px;color:#9080b0;">This is an automated notification from Celestra Jewelry.</p>
            <p style="margin:6px 0 0;font-size:12px;color:#9080b0;">
              <a href="${DASHBOARD_URL}" style="color:#6a50a0;text-decoration:none;">Admin Dashboard</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"Celestra Jewelry" <${process.env.MAIL_USER}>`,
    to: ADMIN_EMAIL,
    subject: "🛒 New Order Received - Celestra Jewelry",
    html,
  });
};

module.exports = sendAdminOrderNotification;
