import { createTransport, type Transporter } from "nodemailer";

export interface MailService {
    sendMail: (to: string, subject: string, html: string) => Promise<void>;
}

export function createMailService(): MailService {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER || "";
    const pass = process.env.SMTP_PASS || "";

    let transporter: Transporter | null = null;

    if (host && user && pass) {
        transporter = createTransport({
            host,
            port,
            secure: port === 465,
            auth: { user, pass },
        });
    }

    async function sendMail(to: string, subject: string, html: string): Promise<void> {
        if (!transporter) {
            console.log(`[Mail] Would send to ${to}: ${subject}`);
            return;
        }
        await transporter.sendMail({
            from: process.env.SMTP_FROM || user,
            to,
            subject,
            html,
        });
    }

    return { sendMail };
}
