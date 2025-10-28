import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname } from 'node:path';

export type InputType = 'url' | 'urlFile' | 'file';

export interface Request {
	input: string;
	type: InputType;
	metadata?: any;
}

export function isUrl(url: string): boolean {
	return url.startsWith('http://') || url.startsWith('https://');
}

export async function isUrlFile(filePath: string): Promise<boolean> {
	try {
		if (!existsSync(filePath)) return false;

		const content = await readFile(filePath, 'utf-8');
		const lines = content
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => line.length > 0);

		return lines.every((line) => line.startsWith('http'));
	} catch (error) {
		return false;
	}
}

export function isBook(filePath: string): boolean {
	if (!existsSync(filePath)) return false;

	const extension = extname(filePath).toLowerCase();
	const supportedExtensions = ['.mobi', '.pdf', '.epub', '.azw3', '.txt'];
	return supportedExtensions.includes(extension);
}

export async function classify(args: string[]): Promise<Request[]> {
	const requests: Request[] = [];

	for (const arg of args) {
		if (isUrl(arg)) {
			requests.push({ input: arg, type: 'url' });
		} else if (await isUrlFile(arg)) {
			requests.push({ input: arg, type: 'urlFile' });
		} else if (isBook(arg)) {
			requests.push({ input: arg, type: 'file' });
		} else {
			console.warn(`Warning: Could not classify input "${arg}", skipping...`);
		}
	}

	return requests;
}
