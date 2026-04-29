import nodemailer from 'nodemailer';
import AppError from '../utils/AppError.js';

let transporter = null;

function initializeTransporter() {
	if (transporter) {
		console.log('[EMAIL_DEBUG] Returning cached transporter');
		return transporter;
	}

	const emailUser = process.env.EMAIL_USER;
	const emailPassword = process.env.EMAIL_PASSWORD;
	const emailService = process.env.EMAIL_SERVICE || 'gmail';

	console.log(`[EMAIL_DEBUG] Creating new transporter: service=${emailService}, user=${emailUser}`);

	if (!emailUser || !emailPassword) {
		throw new AppError('Email configuration missing. Set EMAIL_USER and EMAIL_PASSWORD', 500);
	}

	transporter = nodemailer.createTransport({
		service: emailService,
		auth: {
			user: emailUser,
			pass: emailPassword,
		},
	});

	console.log('[EMAIL_DEBUG] Transporter created successfully');

	return transporter;
}

function getResetEmailTemplate(fullName, resetLink, expiryMinutes = 30) {
	const currentYear = new Date().getFullYear();
	const resetLinkWithoutBreak = resetLink.replace(/\s/g, '');

	return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
        }
        .container {
            background-color: white;
            max-width: 600px;
            margin: 20px auto;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 32px;
            font-weight: 600;
        }
        .content {
            padding: 40px 30px;
            background-color: #fafafa;
        }
        .greeting {
            font-size: 16px;
            margin-bottom: 20px;
            color: #333;
        }
        .greeting strong {
            color: #333;
        }
        .message {
            font-size: 14px;
            color: #666;
            margin-bottom: 30px;
            line-height: 1.8;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .reset-button {
            display: inline-block;
            background-color: #1e40af;
            color: #c12121;
            padding: 14px 40px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 600;
            font-size: 16px;
            transition: background-color 0.3s ease;
            letter-spacing: 0.5px;
        }
        .reset-button:hover {
            background-color: #1e3a8a;
        }
        .footer {
            background-color: #f5f5f5;
            padding: 20px 30px;
            border-top: 1px solid #e0e0e0;
            font-size: 12px;
            color: #999;
        }
        .footer-links {
            margin-bottom: 15px;
        }
        .footer-links a {
            color: #666;
            text-decoration: none;
            margin-right: 20px;
        }
        .footer-links a:hover {
            color: #1e40af;
            text-decoration: underline;
        }
        .footer-address {
            font-size: 11px;
            color: #bbb;
            margin-top: 10px;
        }
        .unsubscribe {
            font-size: 11px;
            color: #bbb;
            margin-top: 15px;
        }
        .unsubscribe a {
            color: #999;
            text-decoration: none;
        }
        .timestamp {
            font-size: 11px;
            color: #bbb;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>Reset Your Password</h1>
        </div>

        <!-- Content -->
        <div class="content">
            <div class="greeting">
                Hi <strong>${escapeHtml(fullName)}</strong>,
            </div>

            <div class="message">
                We received a request to reset your LMS account password. Click the button below to create a new password.
            </div>

            <!-- Reset Button -->
            <div class="button-container">
                <a href="${resetLinkWithoutBreak}" class="reset-button">Reset Your Password</a>
            </div>

            <!-- Security Disclaimers -->
            <div style="margin-top: 40px; color: #666; font-size: 14px; line-height: 1.8;">
                <p style="margin: 15px 0;">
                    If you did not request a password reset, please contact our support team at <a href="mailto:support@lms.com" style="color: #1e40af; text-decoration: none;">support@lms.com</a>.
                </p>

                <p style="margin: 15px 0;">
                    This email was sent to you because a password reset was requested for your account. If you did not request this, you can safely ignore this email.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

function escapeHtml(text) {
	const map = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;',
	};
	return String(text || '').replace(/[&<>"']/g, (m) => map[m]);
}

export async function sendPasswordResetEmail(fullName, email, resetLink, expiryMinutes = 30) {
	try {
		console.log(`[EMAIL_DEBUG] Starting password reset email send to: ${email}`);
		console.log(`[EMAIL_DEBUG] Full name: ${fullName}`);
		console.log(`[EMAIL_DEBUG] Reset link: ${resetLink}`);

		const transporter = initializeTransporter();
		console.log(`[EMAIL_DEBUG] Transporter initialized`);

		const htmlBody = getResetEmailTemplate(fullName, resetLink, expiryMinutes);
		console.log(`[EMAIL_DEBUG] Email template generated, length: ${htmlBody.length}`);

		const mailOptions = {
			from: `"LMS Platform" <${process.env.EMAIL_USER}>`,
			to: email,
			subject: 'Reset Your LMS Account Password',
			html: htmlBody,
			text: `Hi ${fullName},\n\nWe received a request to reset your LMS password. Click the link below to create a new password:\n\n${resetLink}\n\nThis link expires in ${expiryMinutes} minutes.\n\nIf you didn't request this, please ignore this email.\n\nLMS Platform`,
		};

		console.log(`[EMAIL_DEBUG] Mail options prepared:`, {
			from: mailOptions.from,
			to: mailOptions.to,
			subject: mailOptions.subject,
		});

		console.log(`[EMAIL_DEBUG] Sending email with transporter.sendMail()...`);
		const info = await transporter.sendMail(mailOptions);
		
		console.log(`[EMAIL_DEBUG] Email sent successfully!`);
		console.log(`[EMAIL_DEBUG] Message ID: ${info.messageId}`);
		console.log(`[EMAIL_DEBUG] Response: ${info.response}`);

		return {
			success: true,
			messageId: info.messageId,
			response: info.response,
		};
	} catch (error) {
		console.error(`[EMAIL_ERROR] Failed to send email to ${email}:`, error);
		console.error(`[EMAIL_ERROR] Error code: ${error.code}`);
		console.error(`[EMAIL_ERROR] Error response: ${error.response}`);
		throw new AppError(`Failed to send email: ${error.message}`, 500);
	}
}

export async function testEmailConnection() {
	try {
		const transporter = initializeTransporter();
		await transporter.verify();
		return { success: true, message: 'Email service is configured correctly' };
	} catch (error) {
		throw new AppError(`Email service error: ${error.message}`, 500);
	}
}
