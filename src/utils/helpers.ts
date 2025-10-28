import chalk from 'chalk';
import {
	createCipheriv,
	createDecipheriv,
	pbkdf2Sync,
	randomBytes
} from 'node:crypto';

export function encrypt(sender: string, password: string): string {
	const salt = 'easy-kindle-salt';
	const key = pbkdf2Sync(sender, salt, 100000, 32, 'sha256');
	const iv = randomBytes(16);
	const cipher = createCipheriv('aes-256-gcm', key, iv);

	let encrypted = cipher.update(password, 'utf8', 'hex');
	encrypted += cipher.final('hex');

	const authTag = cipher.getAuthTag();
	return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

export function decrypt(sender: string, encryptedPassword: string): string {
	try {
		const parts = encryptedPassword.split(':');
		if (parts.length !== 3) throw new Error('Invalid format');

		const iv = Buffer.from(parts[0] as string, 'hex');
		const authTag = Buffer.from(parts[1] as string, 'hex');
		const encrypted = parts[2] as string;

		const salt = 'easy-kindle-salt';
		const key = pbkdf2Sync(sender, salt, 100000, 32, 'sha256');

		const decipher = createDecipheriv('aes-256-gcm', key, iv);
		decipher.setAuthTag(authTag);

		let decrypted = decipher.update(encrypted, 'hex', 'utf8');
		decrypted += decipher.final('utf8');

		return decrypted;
	} catch (error) {
		console.error(chalk.red('Error decrypting password:'), error);
		process.exit(1);
	}
}
