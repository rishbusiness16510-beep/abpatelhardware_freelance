import { Router } from 'express';
import nodemailer from 'nodemailer';
import { logger } from '../lib/logger.js';

const router = Router();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// POST /api/contact — Receive contact form submission
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !message) {
      res.status(400).json({ message: 'Name and message are required' });
      return;
    }

    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;

    // Send to admin
    await transporter.sendMail({
      from: `"ABPATEL Website" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `New Contact Form — ${name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #1A2E40; border-bottom: 2px solid #B8860B; padding-bottom: 8px;">New Contact Message</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email || 'Not provided'}</p>
          <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;">
          <p><strong>Message:</strong></p>
          <p style="background: #f8f9fa; padding: 12px; border-radius: 6px;">${message.replace(/\n/g, '<br>')}</p>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">Sent from ABPATEL Hardware website contact form.</p>
        </div>
      `,
    });

    // Send acknowledgment to customer (if email provided)
    if (email) {
      await transporter.sendMail({
        from: `"ABPATEL Hardware" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'We received your message — ABPATEL Hardware',
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #1A2E40;">Thank you, ${name}!</h2>
            <p>We've received your message and will get back to you within 24 hours.</p>
            <p>If your matter is urgent, you can reach us directly on WhatsApp.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;">
            <p style="color: #999; font-size: 12px;">© ${new Date().getFullYear()} ABPATEL Hardware Shop</p>
          </div>
        `,
      });
    }

    logger.info('Contact', `Contact form submitted by ${name}`, { email, phone });
    res.json({ message: 'Message sent successfully' });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Contact', 'Error sending contact form', { error: err.message });
    res.status(500).json({ message: 'Failed to send message. Please try again.' });
  }
});

export default router;
