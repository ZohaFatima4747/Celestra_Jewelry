const router = require("express").Router();
const nodemailer = require("nodemailer");

// POST /api/contact-us
router.post("/", async (req, res) => {
  const { name, email, subject, message } = req.body;

  // Validation
  if (!name || !name.trim()) return res.status(400).json({ error: "Name is required." });
  if (!email || !email.trim()) return res.status(400).json({ error: "Email is required." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Invalid email address." });
  if (!message || !message.trim()) return res.status(400).json({ error: "Message is required." });

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Celestra Jewelry Contact" <${process.env.MAIL_USER}>`,
      to: process.env.MAIL_USER,
      subject: subject?.trim() ? `[Contact Us] ${subject.trim()}` : `[Contact Us] New message from ${name.trim()}`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;color:#1a1030;">
          <h2 style="color:#c8a060;font-family:Georgia,serif;">New Contact Form Submission</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;font-weight:600;width:100px;">Name:</td><td>${name.trim()}</td></tr>
            <tr><td style="padding:8px 0;font-weight:600;">Email:</td><td><a href="mailto:${email.trim()}" style="color:#c8a060;">${email.trim()}</a></td></tr>
            ${subject?.trim() ? `<tr><td style="padding:8px 0;font-weight:600;">Subject:</td><td>${subject.trim()}</td></tr>` : ""}
            <tr><td style="padding:8px 0;font-weight:600;vertical-align:top;">Message:</td><td style="white-space:pre-wrap;">${message.trim()}</td></tr>
          </table>
          <hr style="border:none;border-top:1px solid #ede8f8;margin:24px 0;" />
          <p style="font-size:12px;color:#9080b0;">Sent via Celestra Jewelry contact form</p>
        </div>
      `,
    });

    res.json({ success: true, message: "Your message has been sent successfully." });
  } catch (err) {
    console.error("[contact-us] mail error:", err);
    res.status(500).json({ error: "Failed to send message. Please try again later." });
  }
});

module.exports = router;
