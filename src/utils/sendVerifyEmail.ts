import redisClient from "@/config/redis.config";
import generateNumericOTP from "./generateOTP";
import { Config } from "@/config/config";
import emailTransporter from '@/config/email.config'
import { User } from "@/entities/user.entity";

export default async function sendVerifyEmail(user: User) {
    console.log(`[Email] Generating OTP for user: ${user.email}`);
    const code = generateNumericOTP(6);
    // 5 minutes
    await redisClient.setEx(`verify-${user.id}`, 60 * 5, code);
    console.log(`[Email] OTP saved to Redis for user: ${user.id}`);

    const mailOptions = {
        from: Config.emailUser,
        to: user.email,
        subject: 'Verify your email',
        html: verifyEmailHTML(code)
    }
    
    try {
        console.log(`[Email] Attempting to send email to: ${user.email}`);
        const info = await emailTransporter.sendMail(mailOptions);
        console.log(`[Email] Email sent successfully: ${info.messageId}`);
    } catch (error) {
        console.error(`[Email] Failed to send email to: ${user.email}`);
        console.error(error);
        throw error;
    }
}

function verifyEmailHTML(code: string) {
    return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8" />
        <title>Xác minh email</title>
    </head>
    <body style="margin:0; padding:0; background:#f4f6f8; font-family: Arial, sans-serif;">
    <table width="100%">
        <tr>
        <td align="center" style="padding:40px 0;">
            <table width="500" style="background:#fff; border-radius:6px; padding:24px;">
            <tr>
                <td>
                <h2>Xác minh email của bạn</h2>
                <p>Xin chào,</p>
                <p>Mã xác minh của bạn là:</p>

                <div style="
                    font-size:28px;
                    font-weight:bold;
                    letter-spacing:6px;
                    text-align:center;
                    margin:24px 0;
                    color:#2d6cdf;
                ">
                    ${code}
                </div>

                <p>Mã này sẽ hết hạn sau <strong> 5 phút</strong>.</p>

                <p style="font-size:14px; color:#666;">
                    Nếu bạn không yêu cầu xác minh, hãy bỏ qua email này.
                </p>

                <p>
                    Trân trọng,<br/>
                </p>
                </td>
            </tr>
            </table>
        </td>
        </tr>
    </table>
    </body>
    </html>
    `
}