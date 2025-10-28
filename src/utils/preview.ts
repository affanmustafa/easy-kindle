import chalk from 'chalk';
import type { ExtractedContent } from './extractor.js';

export function showContentPreview(
	content: ExtractedContent,
	maxChars: number = 500
): void {
	console.log(chalk.cyan(`\n📖 Preview: "${content.title}"`));
	console.log(chalk.gray('─'.repeat(50)));

	console.log(chalk.yellow(`📅 Author: ${content.byline || 'Unknown'}`));
	console.log(chalk.yellow(`🔗 URL: ${content.url}`));
	console.log(chalk.yellow(`📏 Length: ${content.length} characters`));
	console.log(chalk.yellow(`🖼️  Images: ${content.images.length}`));

	if (content.excerpt) {
		console.log(chalk.yellow(`📝 Excerpt: ${content.excerpt}`));
	}

	const preview =
		content.textContent.length > maxChars
			? content.textContent.substring(0, maxChars) + '...'
			: content.textContent;

	console.log(chalk.gray('\n📄 Content Preview:'));
	console.log(chalk.white(preview));

	if (content.images.length > 0) {
		console.log(chalk.gray('\n🖼️  Images found:'));
		content.images.slice(0, 3).forEach((img, index) => {
			console.log(chalk.gray(`   ${index + 1}. ${img}`));
		});
		if (content.images.length > 3) {
			console.log(chalk.gray(`   ... and ${content.images.length - 3} more`));
		}
	}

	console.log(chalk.gray('─'.repeat(50)));
}

export function showAllPreviews(contents: ExtractedContent[]): void {
	console.log(
		chalk.green(`\n📚 Content Preview (${contents.length} article(s))`)
	);
	console.log(chalk.green('='.repeat(60)));

	contents.forEach((content, index) => {
		console.log(chalk.blue(`\nArticle ${index + 1}:`));
		showContentPreview(content);
	});
}
