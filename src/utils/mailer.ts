import nodemailer from 'nodemailer';
import type { AppConfig } from '../config/config.js';

export interface MailAttachment {
	filename: string;
	path: string;
	contentType?: string;
}

export async function sendMailWithAttachments(
	config: AppConfig,
	subject: string,
	text: string,
	attachments: MailAttachment[]
): Promise<void> {
	if (attachments.length === 0) {
		throw new Error('No attachments provided to send');
	}

	const transporter = nodemailer.createTransport({
		host: config.server,
		port: config.port,
		secure: config.port === 465,
		auth: {
			user: config.sender,
			pass: config.password
		}
	});

	const mailOptions = {
		from: config.sender,
		to: config.receiver,
		subject,
		text,
		attachments: attachments.map((a) => ({
			filename: a.filename,
			path: a.path,
			contentType: a.contentType
		}))
	} as const;

	await transporter.sendMail(mailOptions);
}
