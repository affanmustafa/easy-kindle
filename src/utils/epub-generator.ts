import { join } from 'node:path';
import chalk from 'chalk';
import Epub from 'epub-gen';
import type { ExtractedContent } from './extractor.js';

export interface EpubOptions {
	title?: string;
	author?: string;
	publisher?: string;
	description?: string;
	language?: string;
	outputDir?: string;
}

export interface Chapter {
	title: string;
	content: string;
	url?: string;
}

export class EpubGenerator {
	private options: EpubOptions;

	constructor(options: EpubOptions = {}) {
		this.options = {
			language: 'en',
			outputDir: process.cwd(),
			...options
		};
	}

	convertToChapters(contents: ExtractedContent[]): Chapter[] {
		return contents.map((content, index) => ({
			title: content.title || `Chapter ${index + 1}`,
			content: this.formatContent(content),
			url: content.url
		}));
	}

	private formatContent(content: ExtractedContent): string {
		let htmlContent = content.content || '';

		const metadata = `
      <div style="margin-bottom: 20px; padding: 10px; border-left: 3px solid #ccc; background-color: #f9f9f9;">
        <p style="margin: 0; font-size: 0.9em; color: #666;">
          <strong>Source:</strong> <a href="${content.url}">${content.url
			}</a><br>
          ${content.byline
				? `<strong>Author:</strong> ${content.byline}<br>`
				: ''
			}
          <strong>Extracted:</strong> ${new Date().toLocaleDateString()}
        </p>
      </div>
    `;

		htmlContent = this.cleanHtml(htmlContent);

		return metadata + htmlContent;
	}

	private cleanHtml(html: string): string {
		return html
			.replace(/style="[^"]*"/gi, '')
			.replace(/class="[^"]*"/gi, '')
			.replace(/id="[^"]*"/gi, '')
			.replace(/<p>/gi, '<p style="margin-top: 1em; margin-bottom: 1em;">')
			.replace(
				/<h([1-6])/gi,
				'<h$1 style="margin-top: 1.5em; margin-bottom: 1em;"'
			)
			.replace(/<br\s*\/?>/gi, '<br />')
			.replace(
				/<img/gi,
				'<img style="max-width: 100%; height: auto; display: block; margin: 1em auto;"'
			);
	}

	async generateFromContents(
		contents: ExtractedContent[],
		customTitle?: string
	): Promise<string> {
		if (contents.length === 0) {
			throw new Error('No content to generate EPUB from');
		}

		const chapters = this.convertToChapters(contents);

		let title =
			customTitle || this.options.title || contents[0]?.title || 'Untitled';
		if (contents.length > 1 && !customTitle) {
			const firstTitle = contents[0]?.title || 'Unknown';
			title = `${firstTitle} and ${contents.length - 1} more`;
		}

		const authors = contents
			.map((c) => c.byline)
			.filter((byline): byline is string => !!byline && byline.trim() !== '');

		const uniqueAuthors = Array.from(new Set(authors));
		const authorString =
			uniqueAuthors.length > 0
				? uniqueAuthors.join(', ')
				: 'Unknown';

		const filename = title + '.epub';
		const filepath = join(this.options.outputDir!, filename);

		try {
			const epubOptions = {
				title,
				author: this.options.author || authorString,
				publisher: this.options.publisher || 'Easy-Kindle',
				description:
					this.options.description ||
					`Collection of ${chapters.length} articles`,
				language: this.options.language,
				cover: undefined, // TODO: Add cover generation later
				content: chapters.map((chapter) => ({
					title: chapter.title,
					data: chapter.content
				})),
				version: 3 as const
			};

			const epubInstance = new Epub(epubOptions, filepath);
			await epubInstance.promise;

			console.log(chalk.green(`✅ EPUB generated successfully: ${filepath}`));
			return filepath;
		} catch (error) {
			console.error(chalk.red('❌ Error generating EPUB:'), error);
			throw error;
		}
	}
}

export async function generateEpub(
	contents: ExtractedContent[],
	options: EpubOptions = {},
	customTitle?: string
): Promise<string> {
	const generator = new EpubGenerator(options);
	return generator.generateFromContents(contents, customTitle);
}
