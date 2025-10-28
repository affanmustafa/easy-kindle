#!/usr/bin/env bun

import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigManager } from './src/config/config';
import { classify } from './src/utils/classifier';

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

			// Classify inputs
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

			// TODO: Implement actual send logic
			console.log(chalk.yellow('\n⏳ Send logic not implemented yet.'));

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

			// Classify inputs
			const requests = await classify(items);

			console.log(chalk.blue('📥 Download command processing:'));
			console.log(chalk.yellow('Config loaded - will save to:'), config.storePath);

			if (requests.length === 0) {
				console.log(chalk.yellow('No valid inputs found.'));
				return;
			}

			console.log(chalk.cyan('\n📋 Classified inputs:'));
			requests.forEach((req, index) => {
				console.log(`${index + 1}. ${req.input} (${chalk.blue(req.type)})`);
			});

			// TODO: Implement actual download logic
			console.log(chalk.yellow('\n⏳ Download logic not implemented yet.'));

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
