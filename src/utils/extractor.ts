import { Readability, isProbablyReaderable } from '@mozilla/readability';
import JSDOM from 'jsdom';
import chalk from 'chalk';

export interface ExtractedContent {
	url: string;
	title: string;
	content: string;
	textContent: string;
	length: number;
	excerpt: string;
	byline: string;
	publishedTime?: string;
	images: string[];
}

export async function extractWebpage(
	url: string
): Promise<ExtractedContent | null> {
	try {
		console.log(chalk.cyan(`📥 Fetching: ${url}`));

		const response = await fetch(url, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
			},
			signal: AbortSignal.timeout(30000)
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const html = await response.text();
		const dom = new JSDOM.JSDOM(html, { url });
		const document = dom.window.document;

		const reader = new Readability(document);
		const result = reader.parse();
		if (!result) {
			console.log(chalk.yellow(`⚠️ Readability failed on ${url}.`));
			return null;
		}

		const normalizedHtml = normalizeHtml(result.content || '', url);
		const images = extractImageUrls(normalizedHtml, url);


		return {
			url,
			title: result.title || 'Untitled',
			content: normalizedHtml,
			textContent: result.textContent || '',
			length: result.length || 0,
			excerpt: result.excerpt || '',
			byline: result.byline || '',
			publishedTime: result.publishedTime || undefined,
			images
		};
	} catch (error) {
		console.error(
			chalk.red(`❌ Error extracting ${url}:`),
			error instanceof Error ? error.message : error
		);
		return null;
	}
}

export async function extractWebpages(
	urls: string[]
): Promise<ExtractedContent[]> {
	const batchSize = 3;
	const results: ExtractedContent[] = [];

	for (let i = 0; i < urls.length; i += batchSize) {
		const batch = urls.slice(i, i + batchSize);
		const batchResults = await Promise.allSettled(
			batch.map((url) => extractWebpage(url))
		);

		for (const result of batchResults) {
			if (result.status === 'fulfilled' && result.value) {
				results.push(result.value);
			}
		}
	}
	return results;
}

function normalizeHtml(html: string, baseUrl: string): string {
	if (!html) return html;

	const dom = new JSDOM.JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
		url: baseUrl
	});
	const doc = dom.window.document;
	const container = doc.createElement('div');
	container.innerHTML = html;

	const imgs = container.querySelectorAll('img');
	for (const img of Array.from(imgs)) {
		const src = img.getAttribute('src');
		if (src) {
			try {
				img.setAttribute('src', new URL(src, baseUrl).href);
			} catch {}
		}

		const srcset = img.getAttribute('srcset');
		if (srcset) {
			const parts = srcset.split(',').map((part) => {
				const [url, descriptor] = part.trim().split(/\s+/);
				if (!url) return part;
				try {
					const absolute = new URL(url, baseUrl).href;
					return descriptor ? `${absolute} ${descriptor}` : absolute;
				} catch {
					return part;
				}
			});
			img.setAttribute('srcset', parts.join(', '));
		}

		const dataSrcAttrs = [
			'data-src',
			'data-original',
			'data-lazy-src',
			'data-image'
		];
		for (const attr of dataSrcAttrs) {
			const dataSrc = img.getAttribute(attr);
			if (dataSrc) {
				try {
					const absolute = new URL(dataSrc, baseUrl).href;
					img.setAttribute(attr, absolute);
					if (!img.getAttribute('src')) {
						img.setAttribute('src', absolute);
					}
				} catch {}
			}
		}
	}

	const links = container.querySelectorAll('a');
	for (const link of Array.from(links)) {
		const href = link.getAttribute('href');
		if (href) {
			try {
				link.setAttribute('href', new URL(href, baseUrl).href);
			} catch {}
		}
	}

	return container.innerHTML;
}

function extractImageUrls(html: string, baseUrl: string): string[] {
	const dom = new JSDOM.JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
		url: baseUrl
	});
	const doc = dom.window.document;
	const container = doc.createElement('div');
	container.innerHTML = html;

	const imageUrls = new Set<string>();
	const imgs = container.querySelectorAll('img');

	for (const img of Array.from(imgs)) {
		const src = img.getAttribute('src');
		if (src && isValidImageUrl(src)) {
			imageUrls.add(src);
		}

		const srcset = img.getAttribute('srcset');
		if (srcset) {
			const urls = srcset.split(',').map((part) => part.trim().split(/\s+/)[0]);
			for (const url of urls) {
				if (url && isValidImageUrl(url)) {
					imageUrls.add(url);
				}
			}
		}

		const dataSrcAttrs = [
			'data-src',
			'data-original',
			'data-lazy-src',
			'data-image'
		];
		for (const attr of dataSrcAttrs) {
			const dataSrc = img.getAttribute(attr);
			if (dataSrc && isValidImageUrl(dataSrc)) {
				imageUrls.add(dataSrc);
			}
		}
	}

	return Array.from(imageUrls);
}

function isValidImageUrl(url: string): boolean {
	if (!url || url.startsWith('data:')) return false;
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
}
