import { Handler } from '@netlify/functions';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailRequest {
  email: string;
  url?: string;
  subject?: string;
  html?: string;
  text?: string;
}

export const handler: Handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse request body
    const body: EmailRequest = JSON.parse(event.body || '{}');
    const { email, url = 'https://middleofallthings.com', subject, html, text } = body;

    // Validate email
    if (!email || !email.includes('@')) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Valid email address is required' }),
      };
    }

    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Email service not configured' }),
      };
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'In the Middle of All Things <noreply@middleofallthings.com>',
      to: email,
      subject: subject || 'Open In the Middle of All Things on your phone',
      html: html || `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #0F0F0F; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 10px;">In the Middle of All Things</h1>
              <p style="color: #4A5568; font-size: 14px;">A philosophical companion for the living axis</p>
            </div>
            
            <div style="background: #FAFAFA; border-radius: 12px; padding: 30px; margin-bottom: 30px;">
              <p style="font-size: 16px; margin-bottom: 20px;">
                Open this link on your phone to experience the app:
              </p>
              <a href="${url}" style="display: inline-block; background: #0F0F0F; color: #FAFAFA; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; margin: 10px 0;">
                Open on Mobile
              </a>
            </div>
            
            <p style="font-size: 14px; color: #4A5568; margin-top: 30px;">
              If the app doesn't open automatically, choose "Add to Home Screen" to keep it close.
            </p>
            
            <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #A0AEC0; text-align: center;">
              Find the middle. Live from it.
            </p>
          </body>
        </html>
      `,
      text: text || `
In the Middle of All Things

Open this link on your phone to experience the app:

${url}

If the app doesn't open automatically, choose "Add to Home Screen" to keep it close.

Find the middle. Live from it.
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message || 'Failed to send email' }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        data,
      }),
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }),
    };
  }
};

