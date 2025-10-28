import { Readability } from '@mozilla/readability';
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
		console.log(chalk.green(`✅ Fetched ${html.length} characters`));

		const dom = new JSDOM.JSDOM(html, { url });
		const document = dom.window.document;

		const reader = new Readability(document);
		const result = reader.parse();

		if (!result) {
			console.log(
				chalk.yellow(`⚠️  Could not extract readable content from ${url}`)
			);
			return null;
		}

		const tempDiv = document.createElement('div');
		tempDiv.innerHTML = result.content || '';
		const images = Array.from(tempDiv.querySelectorAll('img'))
			.map((img: any) => img.src || img.dataset.src)
			.filter((src): src is string => !!src);

		console.log(
			chalk.green(
				`✅ Extracted: "${result.title}" (${result.length} chars, ${images.length} images)`
			)
		);

		return {
			url,
			title: result.title || 'Untitled',
			content: result.content || '',
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
	console.log(chalk.cyan(`\n📚 Extracting ${urls.length} webpage(s)...`));

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

	console.log(
		chalk.green(
			`\n✅ Successfully extracted ${results.length}/${urls.length} webpages`
		)
	);
	return results;
}
