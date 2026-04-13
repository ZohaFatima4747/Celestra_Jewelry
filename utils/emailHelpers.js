const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
});

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const formatDateTime = (date) =>
  new Date(date).toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

const emailWrapper = (headerTitle, headerSub, bodyHtml) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${headerTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f4f1f8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1f8;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td align="center" style="background:#1a1030;border-radius:12px 12px 0 0;padding:36px 40px;">
            <p style="margin:0 0 6px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c8a060;">Celestra Jewelry</p>
            <h1 style="margin:0;font-size:22px;font-weight:600;color:#ffffff;letter-spacing:0.5px;">${headerTitle}</h1>
            <p style="margin:10px 0 0;font-size:13px;color:#a090c0;">${headerSub}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:40px;border-left:1px solid #e8e0f0;border-right:1px solid #e8e0f0;">
            ${bodyHtml}
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

module.exports = { transporter, formatDate, formatDateTime, emailWrapper };
