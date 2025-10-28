#!/usr/bin/env bun

import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigManager } from './src/config/config';
import { classify } from './src/utils/classifier';
import { processRequests } from './src/utils/handler';
import { showAllPreviews } from './src/utils/preview';
import { generateEpub } from './src/utils/epub-generator';

const program = new Command();

program
	.name('easy-kindle')
	.description('CLI tool to send web articles and documents to your e-reader')
	.version('1.0.0');

program
	.command('send')
	.description('Send files or URLs to your e-reader')
	.argument('[items...]', 'files, URLs, or link files to send')
	.action(async (items: string[]) => {
		try {
			const config = await ConfigManager.getInstance().loadConfig();

			const requests = await classify(items);

			console.log(chalk.green('📤 Send command processing:'));
			console.log(chalk.yellow('Config loaded:'), {
				sender: config.sender,
				receiver: config.receiver,
				storePath: config.storePath
			});

			if (requests.length === 0) {
				console.log(chalk.yellow('No valid inputs found.'));
				return;
			}

			console.log(chalk.cyan('\n📋 Classified inputs:'));
			requests.forEach((req, index) => {
				console.log(`${index + 1}. ${req.input} (${chalk.blue(req.type)})`);
			});

			console.log(chalk.cyan('\n🔄 Processing content...'));
			const processedRequests = await processRequests(requests);

			console.log(chalk.green('\n📊 Processing Results:'));
			processedRequests.forEach((req, index) => {
				if (req.error) {
					console.log(
						`${index + 1}. ❌ ${req.originalRequest.input}: ${req.error}`
					);
				} else if (req.extractedContent) {
					console.log(
						`${index + 1}. ✅ ${req.originalRequest.input}: ${
							req.extractedContent.length
						} article(s) extracted`
					);
					req.extractedContent.forEach((content, i) => {
						console.log(
							`   ${i + 1}. "${content.title}" (${content.length} chars)`
						);
					});
				} else {
					console.log(
						`${index + 1}. ✅ ${
							req.originalRequest.input
						}: File ready for processing`
					);
				}
			});

			console.log(
				chalk.yellow(
					'\n⏳ EPUB generation and email sending not implemented yet.'
				)
			);
		} catch (error) {
			console.error(chalk.red('Error:'), error);
		}
	});

program
	.command('download')
	.description('Download files or URLs locally without sending')
	.argument('[items...]', 'files, URLs, or link files to download')
	.action(async (items: string[]) => {
		try {
			const config = await ConfigManager.getInstance().loadConfig();

			const requests = await classify(items);

			console.log(chalk.blue('📥 Download command processing:'));
			console.log(
				chalk.yellow('Config loaded - will save to:'),
				config.storePath
			);

			if (requests.length === 0) {
				console.log(chalk.yellow('No valid inputs found.'));
				return;
			}

			console.log(chalk.cyan('\n📋 Classified inputs:'));
			requests.forEach((req, index) => {
				console.log(`${index + 1}. ${req.input} (${chalk.blue(req.type)})`);
			});

			console.log(chalk.cyan('\n🔄 Processing content...'));
			const processedRequests = await processRequests(requests);

			console.log(chalk.green('\n📊 Processing Results:'));
			processedRequests.forEach((req, index) => {
				if (req.error) {
					console.log(
						`${index + 1}. ❌ ${req.originalRequest.input}: ${req.error}`
					);
				} else if (req.extractedContent) {
					console.log(
						`${index + 1}. ✅ ${req.originalRequest.input}: ${
							req.extractedContent.length
						} article(s) extracted`
					);
					req.extractedContent.forEach((content, i) => {
						console.log(
							`   ${i + 1}. "${content.title}" (${content.length} chars)`
						);
					});
				} else {
					console.log(
						`${index + 1}. ✅ ${
							req.originalRequest.input
						}: File ready for processing`
					);
				}
			});

			console.log(chalk.yellow('\n⏳ EPUB generation not implemented yet.'));
		} catch (error) {
			console.error(chalk.red('Error:'), error);
		}
	});

program
	.command('preview')
	.description('Preview extracted content from URLs or files')
	.argument('[items...]', 'files, URLs, or link files to preview')
	.action(async (items: string[]) => {
		try {
			const requests = await classify(items);

			if (requests.length === 0) {
				console.log(chalk.yellow('No valid inputs found.'));
				return;
			}

			console.log(chalk.cyan('🔍 Preview mode - extracting content...'));

			const processedRequests = await processRequests(requests);

			const allContent: any[] = [];
			processedRequests.forEach((req) => {
				if (req.extractedContent) {
					allContent.push(...req.extractedContent);
				}
			});

			if (allContent.length > 0) {
				showAllPreviews(allContent);
			} else {
				console.log(chalk.yellow('No content could be extracted.'));
			}
		} catch (error) {
			console.error(chalk.red('Error:'), error);
		}
	});

program
	.command('generate')
	.description('Generate EPUB from URLs or files (save locally)')
	.argument('[items...]', 'files, URLs, or link files to convert to EPUB')
	.option('-t, --title <title>', 'Custom title for the EPUB')
	.option('-o, --output <dir>', 'Output directory', process.cwd())
	.action(async (items: string[], options) => {
		try {
			const requests = await classify(items);

			if (requests.length === 0) {
				console.log(chalk.yellow('No valid inputs found.'));
				return;
			}
			console.log(chalk.cyan('📚 EPUB Generation Mode'));
			console.log(chalk.cyan('🔄 Extracting content...'));

			const processedRequests = await processRequests(requests);

			const allContent: any[] = [];
			processedRequests.forEach((req) => {
				if (req.extractedContent) {
					allContent.push(...req.extractedContent);
				}
			});

			if (allContent.length === 0) {
				console.log(chalk.yellow('No content could be extracted.'));
				return;
			}

			console.log(
				chalk.green(`\n✅ Extracted ${allContent.length} article(s)`)
			);

			const epubPath = await generateEpub(
				allContent,
				{
					outputDir: options.output
				},
				options.title
			);

			console.log(chalk.green(`\n🎉 Success! EPUB saved to: ${epubPath}`));
		} catch (error) {
			console.error(chalk.red('Error:'), error);
		}
	});

program
	.command('init')
	.description('Initialize configuration for easy-kindle')
	.action(async () => {
		await ConfigManager.getInstance().createConfig();
	});

if (process.argv.length <= 2) {
	program.help();
}

program.parse();
