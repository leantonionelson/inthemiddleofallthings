// Note: Resend is a server-side library and is called via Netlify Function
// The Netlify function at /.netlify/functions/send-email handles the Resend API call

export interface SendEmailLinkParams {
  email: string;
  url?: string;
}

export interface SendEmailLinkResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Send a magic link email via Resend
 */
export const sendEmailLink = async ({
  email,
  url = 'https://middleofallthings.com'
}: SendEmailLinkParams): Promise<SendEmailLinkResponse> => {
  try {
    // Call Netlify function that handles Resend on the server side
    const apiUrl = '/.netlify/functions/send-email';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        url,
        subject: 'Open In the Middle of All Things on your phone',
        html: `
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
        text: `
In the Middle of All Things

Open this link on your phone to experience the app:

${url}

If the app doesn't open automatically, choose "Add to Home Screen" to keep it close.

Find the middle. Live from it.
        `
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to send email' }));
      return {
        success: false,
        error: errorData.error || 'Failed to send email'
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message || 'Email sent successfully'
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
};

