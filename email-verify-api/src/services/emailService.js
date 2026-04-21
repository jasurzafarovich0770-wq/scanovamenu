const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Verification email yuborish
 * @param {string} toEmail - Foydalanuvchi email manzili (dinamik)
 * @param {string} rawToken - Xom token (URL ga qo'shiladi)
 */
const sendVerificationEmail = async (toEmail, rawToken) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${rawToken}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Email Verification</title>
    </head>
    <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="520" cellpadding="0" cellspacing="0"
              style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
              <!-- Header -->
              <tr>
                <td style="background:#4f46e5;padding:32px 40px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;letter-spacing:-0.5px;">
                    Email Verification
                  </h1>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:40px;">
                  <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
                    Hello,
                  </p>
                  <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 28px;">
                    Thank you for registering. Please verify your email address by clicking the button below.
                    This link will expire in <strong>1 hour</strong>.
                  </p>
                  <!-- Button -->
                  <table cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td align="center">
                        <a href="${verifyUrl}"
                          style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;
                                 padding:14px 36px;border-radius:8px;font-size:15px;font-weight:600;
                                 letter-spacing:0.3px;">
                          Verify Email Address
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="color:#6b7280;font-size:13px;margin:28px 0 0;line-height:1.6;">
                    If you didn't create an account, you can safely ignore this email.
                  </p>
                  <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;" />
                  <p style="color:#9ca3af;font-size:12px;margin:0;word-break:break-all;">
                    Or copy this link: <a href="${verifyUrl}" style="color:#4f46e5;">${verifyUrl}</a>
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background:#f9fafb;padding:20px 40px;text-align:center;">
                  <p style="color:#9ca3af;font-size:12px;margin:0;">
                    &copy; ${new Date().getFullYear()} Your App. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: 'onboarding@resend.dev', // Resend test domain (o'z domeningizga almashtiring)
    to: toEmail,                   // Har doim dinamik — user.email
    subject: 'Verify your email address',
    html,
  });
};

module.exports = { sendVerificationEmail };
