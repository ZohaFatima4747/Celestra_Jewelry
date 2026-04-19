const router = require("express").Router();
const nodemailer = require("nodemailer");
const ContactMessage = require("../models/ContactMessage");
const { adminAuth } = require("../middleware/auth");
const logger = require("../utils/logger");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
});

const year = () => new Date().getFullYear();

// ── Shared wrapper (header + footer) ─────────────────────────────────────────
const emailWrapper = (headerTitle, headerSub, bodyHtml) => `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
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
            <p style="margin:0;font-size:12px;color:#9080b0;">This message was sent via the <strong style="color:#6a50a0;">Celestra Jewelry</strong> Contact Form</p>
            <p style="margin:6px 0 0;font-size:11px;color:#b0a0c8;">&copy; ${year()} Celestra Jewelry. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ── Template 1: Admin inbox email ─────────────────────────────────────────────
const adminEmailHtml = ({ name, email, subject, message }) => {
  const subjectRow = subject?.trim() ? `
    <tr>
      <td style="padding-bottom:24px;">
        <p style="margin:0 0 4px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#9080b0;">Subject</p>
        <p style="margin:0;font-size:15px;color:#1a1030;">${subject.trim()}</p>
      </td>
    </tr>` : "";

  const body = `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-bottom:24px;">
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#9080b0;">From</p>
          <p style="margin:0;font-size:16px;font-weight:600;color:#1a1030;">${name.trim()}</p>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom:24px;">
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#9080b0;">Email</p>
          <a href="mailto:${email.trim()}" style="font-size:15px;color:#c8a060;text-decoration:none;">${email.trim()}</a>
        </td>
      </tr>
      ${subjectRow}
      <tr>
        <td>
          <p style="margin:0 0 8px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#9080b0;">Message</p>
          <div style="background:#f9f7fd;border-left:3px solid #c8a060;border-radius:0 8px 8px 0;padding:20px 24px;">
            <p style="margin:0;font-size:15px;line-height:1.7;color:#2d2040;white-space:pre-wrap;">${message.trim()}</p>
          </div>
        </td>
      </tr>
    </table>`;

  return emailWrapper("New Contact Message", "You have received a new inquiry from your website", body);
};

// ── Template 2: Admin reply to user (Zendesk-style threaded) ─────────────────
const userReplyHtml = ({ name, email, subject, originalMessage, replyMessage }) => {
  const safeName = (name || "Valued Customer").trim();

  // Original inquiry quoted block — only shown when original data is provided
  const quotedBlock = originalMessage?.trim() ? `
    <!-- Original message -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
      <tr>
        <td style="padding-bottom:12px;">
          <p style="margin:0;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#9080b0;">Your Original Inquiry</p>
        </td>
      </tr>
      <tr>
        <td style="background:#f5f3fa;border:1px solid #e8e0f0;border-radius:8px;padding:20px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom:10px;">
                <span style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9080b0;">From&nbsp;&nbsp;</span>
                <span style="font-size:13px;color:#1a1030;font-weight:600;">${safeName}</span>
                ${email?.trim() ? `<span style="font-size:13px;color:#9080b0;"> &lt;${email.trim()}&gt;</span>` : ""}
              </td>
            </tr>
            ${subject?.trim() ? `<tr>
              <td style="padding-bottom:10px;">
                <span style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9080b0;">Subject&nbsp;&nbsp;</span>
                <span style="font-size:13px;color:#1a1030;">${subject.trim()}</span>
              </td>
            </tr>` : ""}
            <tr>
              <td style="border-top:1px solid #e8e0f0;padding-top:12px;">
                <p style="margin:0;font-size:14px;line-height:1.7;color:#4a3860;white-space:pre-wrap;">${originalMessage.trim()}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>` : "";

  const body = `
    <!-- Greeting -->
    <p style="margin:0 0 6px;font-size:15px;color:#1a1030;font-weight:600;">Hi ${safeName},</p>
    <p style="margin:0 0 28px;font-size:14px;color:#6a50a0;line-height:1.6;">Thank you for reaching out to us. Here is our response to your inquiry:</p>

    <!-- Admin reply -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
      <tr>
        <td style="padding-bottom:12px;">
          <p style="margin:0;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#9080b0;">Our Response</p>
        </td>
      </tr>
      <tr>
        <td style="background:#f9f7fd;border-left:3px solid #c8a060;border-radius:0 8px 8px 0;padding:22px 26px;">
          <p style="margin:0;font-size:15px;line-height:1.8;color:#2d2040;white-space:pre-wrap;">${replyMessage.trim()}</p>
        </td>
      </tr>
    </table>

    ${quotedBlock}

    <!-- Closing -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="border-top:1px solid #ede8f8;padding-top:28px;">
          <p style="margin:0 0 6px;font-size:14px;color:#1a1030;line-height:1.7;">Thank you for contacting <strong>Celestra Jewelry</strong>.</p>
          <p style="margin:0 0 24px;font-size:14px;color:#1a1030;line-height:1.7;">We appreciate your patience and are always here to help you.</p>
          <p style="margin:0 0 2px;font-size:14px;color:#6a50a0;font-weight:600;">Warm regards,</p>
          <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#1a1030;">Celestra Jewelry Support Team</p>
          <p style="margin:6px 0 0;font-size:12px;color:#c8a060;letter-spacing:1px;text-transform:uppercase;">celestra jewelry</p>
        </td>
      </tr>
    </table>`;

  return emailWrapper("Celestra Jewelry Support", "A response to your inquiry", body);
};

// ── POST /api/contact-us — incoming contact form ──────────────────────────────
router.post("/", async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name?.trim())    return res.status(400).json({ error: "Name is required." });
  if (!email?.trim())   return res.status(400).json({ error: "Email is required." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Invalid email address." });
  if (!message?.trim()) return res.status(400).json({ error: "Message is required." });

  try {
    // Save to DB
    await ContactMessage.create({ name: name.trim(), email: email.trim(), subject: subject?.trim() || '', message: message.trim() });

    // 1. Notify admin
    await transporter.sendMail({
      from: `"Celestra Jewelry Contact" <${process.env.MAIL_USER}>`,
      to: process.env.MAIL_USER,
      replyTo: `"${name.trim()}" <${email.trim()}>`,
      subject: subject?.trim() ? `[Contact Us] ${subject.trim()}` : `[Contact Us] New message from ${name.trim()}`,
      html: adminEmailHtml({ name, email, subject, message }),
    });

    // 2. Send confirmation to user
    await transporter.sendMail({
      from: `"Celestra Jewelry Support" <${process.env.MAIL_USER}>`,
      to: `"${name.trim()}" <${email.trim()}>`,
      subject: "We received your message – Celestra Jewelry",
      html: userReplyHtml({
        name,
        email,
        subject,
        originalMessage: message,
        replyMessage: "Thank you for getting in touch! We have received your message and our team will review it shortly. We typically respond within 24–48 hours.",
      }),
    });

    res.json({ success: true, message: "Your message has been sent successfully." });
  } catch (err) {
    logger.error({ err }, "[contact-us] mail error");
    res.status(500).json({ error: "Failed to send message. Please try again later." });
  }
});

// ── GET /api/contact-us — fetch all messages (admin only) ─────────────────────
router.get("/", adminAuth, async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages." });
  }
});

// ── GET /api/contact-us/unread-count — unread badge count (admin only) ────────
router.get("/unread-count", adminAuth, async (req, res) => {
  try {
    const count = await ContactMessage.countDocuments({ isRead: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch unread count." });
  }
});

// ── PATCH /api/contact-us/:id/mark-read — mark single message as read (admin only) ──
router.patch("/:id/mark-read", adminAuth, async (req, res) => {
  try {
    const msg = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!msg) return res.status(404).json({ error: "Message not found." });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark message as read." });
  }
});

// ── POST /api/contact-us/mark-read — mark all messages as read (admin only) ───
router.post("/mark-read", adminAuth, async (req, res) => {
  try {
    await ContactMessage.updateMany({ isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark messages as read." });
  }
});

// ── POST /api/contact-us/reply — admin sends a reply to a user ────────────────
router.post("/reply", adminAuth, async (req, res) => {
  const { id, name, email, subject, originalMessage, replyMessage } = req.body;

  if (!email?.trim())        return res.status(400).json({ error: "Recipient email is required." });
  if (!replyMessage?.trim()) return res.status(400).json({ error: "Reply message is required." });

  const htmlBody = userReplyHtml({ name, email, subject, originalMessage, replyMessage });
  logger.debug({ email, htmlLength: htmlBody.length }, "[contact-us/reply] sending reply");

  try {
    await transporter.sendMail({
      from: `"Celestra Jewelry Support" <${process.env.MAIL_USER}>`,
      to: `"${(name || "Valued Customer").trim()}" <${email.trim()}>`,
      subject: subject?.trim() ? `Re: ${subject.trim()} – Celestra Jewelry` : "Reply from Celestra Jewelry Support",
      html: htmlBody,
      // NOTE: no `text` fallback — html-only forces styled rendering
    });

    // Mark as replied in DB
    if (id) await ContactMessage.findByIdAndUpdate(id, { replied: true, repliedAt: new Date() });

    res.json({ success: true, message: "Reply sent successfully." });
  } catch (err) {
    logger.error({ err }, "[contact-us/reply] mail error");
    res.status(500).json({ error: "Failed to send reply. Please try again later." });
  }
});

// ── DELETE /api/contact-us/:id — delete a message (admin only) ────────────────
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    await ContactMessage.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete message." });
  }
});

module.exports = router;
