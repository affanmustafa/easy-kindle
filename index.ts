#!/usr/bin/env bun

import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigManager } from './src/config/config';

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
			console.log(chalk.green('Send command called with:'), items);
			console.log(chalk.yellow('Loaded config:'), {
				sender: config.sender,
				receiver: config.receiver,
				storePath: config.storePath
			});
			// TODO: Implement send logic
		} catch (error) {
			console.error(chalk.red('Error loading config:'), error);
		}
	});

program
	.command('download')
	.description('Download files or URLs locally without sending')
	.argument('[items...]', 'files, URLs, or link files to download')
	.action(async (items: string[]) => {
		try {
			const config = await ConfigManager.getInstance().loadConfig();
			console.log(chalk.blue('Download command called with:'), items);
			console.log(
				chalk.yellow('Config loaded - will save to:'),
				config.storePath
			);
			// TODO: Implement download logic
		} catch (error) {
			console.error(chalk.red('Error loading config:'), error);
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
