import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { withRateLimit, createApiError } from '@/lib/auth'

async function verifyRecaptcha(token: string) {
  const secret = process.env.RECAPTCHA_SECRET_KEY
  if (!secret) {
    throw new Error('RECAPTCHA_SECRET_KEY is not set')
  }

  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `secret=${secret}&response=${token}`,
  })

  const data = await response.json()
  return data.success && data.score >= 0.5 // Require a minimum score of 0.5
}

// Apply strict rate limiting to contact form (5 requests per hour)
export const POST = withRateLimit(
  async (request: NextRequest) => {
    try {
      // Get request data
      const { name, email, subject, message, token } = await request.json()

      // Validate required fields
      if (!name || !email || !subject || !message || !token) {
        return createApiError('All fields are required', 400)
      }

      // Verify reCAPTCHA
      const isValidRecaptcha = await verifyRecaptcha(token)
      if (!isValidRecaptcha) {
        return createApiError('Invalid reCAPTCHA', 400)
      }

      // Create email transporter
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      })

      // Email content
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'emmanuelfabiani23@gmail.com',
        replyTo: email,
        subject: `[Contact Form] ${subject}`,
        text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        html: `
          <h3>New Contact Form Submission</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        `,
      }

      // Send email
      await transporter.sendMail(mailOptions)

      return NextResponse.json({ message: 'Message sent successfully' })
    } catch (error) {
      console.error('Error sending email:', error)
      return createApiError('Failed to send message', 500)
    }
  },
  {
    limit: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many contact form submissions. Please try again later.'
  }
)
