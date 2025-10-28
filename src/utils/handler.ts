import { readFile } from 'node:fs/promises';
import chalk from 'chalk';
import type { Request } from './classifier.js';
import { extractWebpages, type ExtractedContent } from './extractor.js';

export interface ProcessedRequest {
	originalRequest: Request;
	extractedContent?: ExtractedContent[];
	filePath?: string;
	error?: string;
}

export async function processRequests(
	requests: Request[]
): Promise<ProcessedRequest[]> {
	const results: ProcessedRequest[] = [];

	for (const request of requests) {
		try {

			switch (request.type) {
				case 'url':
					const content = await extractWebpages([request.input]);
					results.push({
						originalRequest: request,
						extractedContent: content.length > 0 ? content : undefined
					});
					break;

				case 'urlFile':
					const fileContent = await readFile(request.input, 'utf-8');
					const urls = fileContent
						.split('\n')
						.map((line) => line.trim())
						.filter((line) => line.length > 0);

					const extractedContents = await extractWebpages(urls);
					results.push({
						originalRequest: request,
						extractedContent: extractedContents
					});
					break;

				case 'file':
					results.push({
						originalRequest: request
					});
					break;
			}
		} catch (error) {
			console.error(chalk.red(`❌ Error processing ${request.input}:`), error);
			results.push({
				originalRequest: request,
				error: error instanceof Error ? error.message : 'Unknown error'
			});
		}
	}

	return results;
}
