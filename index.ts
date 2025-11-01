#!/usr/bin/env bun

import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigManager } from './src/config/config';
import { classify } from './src/utils/classifier';
import { processRequests } from './src/utils/handler';
import { showAllPreviews } from './src/utils/preview';
import { generateEpub } from './src/utils/epub-generator';
import { sendMailWithAttachments } from './src/utils/mailer';
import {
	parseUrlsFromFile,
	getUnprocessedUrls,
	markUrlInFile,
	showSyncStatus
} from './src/utils/sync';
import { existsSync } from 'node:fs';

const program = new Command();

program
	.name('easy-kindle')
	.description('CLI tool to send web articles and documents to your e-reader')
	.version('1.0.0');

program
	.command('send')
	.description('Send files or URLs to your e-reader')
	.argument('[items...]', 'files, URLs, or link files to send')
	.option(
		'-t, --title <title>',
		'Custom title for combined EPUB (implies --combine)'
	)
	.option(
		'-o, --output <dir>',
		'Temp/output directory for generated EPUB',
		process.cwd()
	)
	.option('-c, --combine', 'Combine all articles into a single EPUB')
	.action(async (items: string[], options) => {
		try {
			const config = await ConfigManager.getInstance().loadConfig();

			const requests = await classify(items);

			if (requests.length === 0) {
				console.log(chalk.yellow('No valid inputs found.'));
				return;
			}
			const processedRequests = await processRequests(requests);

			processedRequests.forEach((req, index) => {
				if (req.extractedContent) {
					console.log(
						`${index + 1}. ✅ ${req.originalRequest.input}: ${
							req.extractedContent.length
						} article(s) extracted`
					);
				}
			});

			const allContent: any[] = [];
			processedRequests.forEach((req) => {
				if (req.extractedContent) {
					allContent.push(...req.extractedContent);
				}
			});

			const attachments: { filename: string; path: string }[] = [];

			if (allContent.length > 0) {
				const shouldCombine = options.combine || options.title;

				if (shouldCombine) {
					const epubPath = await generateEpub(
						allContent,
						{ outputDir: options.output },
						options.title
					);
					attachments.push({
						filename: epubPath.split('/').pop()!,
						path: epubPath
					});
				} else {
					for (const content of allContent) {
						const epubPath = await generateEpub(
							[content],
							{ outputDir: options.output },
							undefined
						);
						attachments.push({
							filename: epubPath.split('/').pop()!,
							path: epubPath
						});
					}
				}
			}

			processedRequests
				.filter((r) => r.originalRequest.type === 'file')
				.forEach((r) => {
					const p = r.originalRequest.input;
					if (existsSync(p)) {
						attachments.push({ filename: p.split('/').pop()!, path: p });
					}
				});

			if (attachments.length === 0) {
				console.log(chalk.yellow('\nNo EPUB or files to send. Aborting.'));
				return;
			}

			await sendMailWithAttachments(
				config,
				attachments.length === 1
					? attachments[0]?.filename || 'Document'
					: `${attachments.length} documents`,
				'Sent via Easy-Kindle',
				attachments
			);
			console.log(
				chalk.green(`\n📬 Sent ${attachments.length} file(s) to your Kindle!`)
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
			const requests = await classify(items);

			if (requests.length === 0) {
				console.log(chalk.yellow('No valid inputs found.'));
				return;
			}

			requests.forEach((req, index) => {
				console.log(`${index + 1}. ${req.input} (${chalk.blue(req.type)})`);
			});

			const processedRequests = await processRequests(requests);
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
				}
			});
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
	.option(
		'-t, --title <title>',
		'Custom title for combined EPUB (implies --combine)'
	)
	.option('-o, --output <dir>', 'Output directory', process.cwd())
	.option('-c, --combine', 'Combine all articles into a single EPUB')
	.action(async (items: string[], options) => {
		try {
			const requests = await classify(items);

			if (requests.length === 0) {
				console.log(chalk.yellow('No valid inputs found.'));
				return;
			}

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

			const shouldCombine = options.combine || options.title;

			if (shouldCombine) {
				const epubPath = await generateEpub(
					allContent,
					{ outputDir: options.output },
					options.title
				);
				console.log(chalk.green(`\n🎉 Success! EPUB saved to: ${epubPath}`));
			} else {
				console.log(
					chalk.cyan(
						`\n📚 Generating ${allContent.length} separate EPUB file(s)...`
					)
				);
				const paths: string[] = [];
				for (const content of allContent) {
					const epubPath = await generateEpub(
						[content],
						{ outputDir: options.output },
						undefined
					);
					paths.push(epubPath);
				}
				console.log(
					chalk.green(
						`\n🎉 Success! Generated ${paths.length} EPUB file(s) in: ${options.output}`
					)
				);
			}
		} catch (error) {
			console.error(chalk.red('Error:'), error);
		}
	});

program
	.command('sync')
	.description('Process and send new URLs from configured reading list')
	.option('-c, --combine', 'Combine all new articles into single EPUB')
	.action(async (options) => {
		try {
			const config = await ConfigManager.getInstance().loadConfig();
			const syncFilePath = config.syncFilePath;

			if (!syncFilePath) {
				console.log(
					chalk.red(
						'❌ No sync file configured. Run `bun index.ts init` first.'
					)
				);
				return;
			}

			if (!existsSync(syncFilePath)) {
				console.log(chalk.red(`❌ Sync file not found: ${syncFilePath}`));
				return;
			}

			console.log(chalk.cyan(`\n📂 Reading sync file: ${syncFilePath}`));

			const parsed = await parseUrlsFromFile(syncFilePath);
			showSyncStatus(parsed);

			const unprocessed = getUnprocessedUrls(parsed);

			if (unprocessed.length === 0) {
				console.log(chalk.green('\n✅ All URLs have been processed!'));
				return;
			}

			console.log(
				chalk.cyan(`\n🚀 Processing ${unprocessed.length} new URL(s)...`)
			);

			const urlsToProcess = unprocessed.map((p) => p.url);
			const requests = await classify(urlsToProcess);
			const processedRequests = await processRequests(requests);

			const allContent: any[] = [];
			processedRequests.forEach((req) => {
				if (req.extractedContent) {
					allContent.push(...req.extractedContent);
				}
			});

			if (allContent.length === 0) {
				console.log(chalk.yellow('\n⚠️  No content could be extracted.'));
				for (const item of unprocessed) {
					await markUrlInFile(
						syncFilePath,
						item.lineNumber,
						item.url,
						'FAILED'
					);
				}
				return;
			}

			const attachments: { filename: string; path: string; url: string }[] = [];

			if (options.combine) {
				const epubPath = await generateEpub(
					allContent,
					{ outputDir: config.storePath },
					`Reading List ${new Date().toLocaleDateString()}`
				);
				unprocessed.forEach((item) => {
					attachments.push({
						filename: epubPath.split('/').pop()!,
						path: epubPath,
						url: item.url
					});
				});
			} else {
				for (let i = 0; i < allContent.length; i++) {
					const content = allContent[i];
					const item = unprocessed[i];
					if (!item) continue;

					try {
						const epubPath = await generateEpub(
							[content],
							{ outputDir: config.storePath },
							undefined
						);
						attachments.push({
							filename: epubPath.split('/').pop()!,
							path: epubPath,
							url: item.url
						});
					} catch (error) {
						console.error(
							chalk.red(`❌ Failed to generate EPUB for: ${item.url}`)
						);
						await markUrlInFile(
							syncFilePath,
							item.lineNumber,
							item.url,
							'FAILED'
						);
					}
				}
			}

			if (attachments.length === 0) {
				console.log(chalk.yellow('\n⚠️  No EPUBs generated.'));
				return;
			}

			try {
				await sendMailWithAttachments(
					config,
					attachments.length === 1
						? attachments[0]?.filename || 'Document'
						: `${attachments.length} documents`,
					'Sent via Easy-Kindle Sync',
					attachments.map((a) => ({ filename: a.filename, path: a.path }))
				);

				console.log(
					chalk.green(`\n✅ Sent ${attachments.length} file(s) to your Kindle!`)
				);

				for (const attachment of attachments) {
					const item = unprocessed.find((u) => u.url === attachment.url);
					if (item) {
						await markUrlInFile(
							syncFilePath,
							item.lineNumber,
							item.url,
							'SENT'
						);
					}
				}

				console.log(
					chalk.green(`\n📝 Marked ${attachments.length} URL(s) as SENT`)
				);
			} catch (error) {
				console.error(chalk.red('❌ Failed to send email:'), error);
				for (const attachment of attachments) {
					const item = unprocessed.find((u) => u.url === attachment.url);
					if (item) {
						await markUrlInFile(
							syncFilePath,
							item.lineNumber,
							item.url,
							'FAILED'
						);
					}
				}
			}
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
