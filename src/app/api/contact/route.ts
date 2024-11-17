import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Rate limiting setup
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour in milliseconds
const MAX_REQUESTS_PER_IP = 5

// Store IP addresses and their request timestamps
const ipRequestMap = new Map<
  string,
  { count: number; timestamps: number[] }
>()

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [ip, data] of ipRequestMap.entries()) {
    data.timestamps = data.timestamps.filter(
      timestamp => now - timestamp < RATE_LIMIT_WINDOW
    )
    data.count = data.timestamps.length
    if (data.count === 0) {
      ipRequestMap.delete(ip)
    }
  }
}, RATE_LIMIT_WINDOW)

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

export async function POST(request: Request) {
  try {
    // Get client IP
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown'

    // Check rate limit
    const now = Date.now()
    const ipData = ipRequestMap.get(ip) || { count: 0, timestamps: [] }
    ipData.timestamps = ipData.timestamps.filter(
      timestamp => now - timestamp < RATE_LIMIT_WINDOW
    )

    if (ipData.timestamps.length >= MAX_REQUESTS_PER_IP) {
      return NextResponse.json(
        { message: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Update rate limit data
    ipData.timestamps.push(now)
    ipData.count = ipData.timestamps.length
    ipRequestMap.set(ip, ipData)

    // Get request data
    const { name, email, subject, message, token } = await request.json()

    // Validate required fields
    if (!name || !email || !subject || !message || !token) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      )
    }

    // Verify reCAPTCHA
    const isValidRecaptcha = await verifyRecaptcha(token)
    if (!isValidRecaptcha) {
      return NextResponse.json(
        { message: 'Invalid reCAPTCHA' },
        { status: 400 }
      )
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
    return NextResponse.json(
      { message: 'Failed to send message' },
      { status: 500 }
    )
  }
}
