import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { existsSync, mkdirSync } from 'node:fs';
import chalk from 'chalk';
import { createInterface } from 'node:readline';
import { encrypt, decrypt } from '../utils/helpers';

export interface AppConfig {
	sender: string;
	receiver: string;
	storePath: string;
	password: string;
	server: string;
	port: number;
	syncFilePath: string;
}

const CONFIG_FILE = join(homedir(), '.easy-kindle', 'config.json');

export class ConfigManager {
	private static instance: ConfigManager;
	private config: AppConfig | null = null;

	private constructor() {}

	static getInstance(): ConfigManager {
		if (!ConfigManager.instance) {
			ConfigManager.instance = new ConfigManager();
		}
		return ConfigManager.instance;
	}

	private async askQuestion(question: string): Promise<string> {
		const rl = createInterface({
			input: process.stdin,
			output: process.stdout
		});
		return new Promise((resolve) => {
			rl.question(question, (answer) => {
				rl.close();
				resolve(answer);
			});
		});
	}

	private ensureConfigDir(): void {
		const configDir = join(homedir(), '.easy-kindle');
		if (!existsSync(configDir)) {
			mkdirSync(configDir, { recursive: true });
		}
	}

	private async saveConfig(): Promise<void> {
		if (!this.config) return;
		await writeFile(CONFIG_FILE, JSON.stringify(this.config, null, 2));
	}

	async createConfig(): Promise<void> {
		console.log(chalk.cyan('\nFIRST TIME SETUP. CONFIGURING EASY-KINDLE'));
		console.log(chalk.cyan('---------------------------------------------'));
		this.ensureConfigDir();
		const sender = await this.askQuestion('Enter your email address: ');
		const receiver = await this.askQuestion(
			'Enter your e-reader email address: '
		);
		const storePath = await this.askQuestion(
			'Enter the path to store your e-books: '
		);
		const password = await this.askQuestion('Enter your email password: ');
		const syncFilePath = await this.askQuestion(
			'Enter path to your reading list file (txt/md): '
		);

		let server = 'smtp.gmail.com';
		let port = 465;

		if (!sender.includes('@gmail.com')) {
			server = await this.askQuestion(
				'SMTP server address (e.g: smtp.gmail.com): '
			);
			const portString = await this.askQuestion(
				'SMTP port (e.g: 465 or 587): '
			);
			port = parseInt(portString) || 465;
		}
		const encryptedPass = encrypt(sender, password);
		this.config = {
			sender,
			receiver,
			storePath,
			password: encryptedPass,
			server,
			port,
			syncFilePath
		};
		await this.saveConfig();
		console.log(chalk.green(`\nCONFIG CREATED AND SAVED TO ${CONFIG_FILE}`));
	}

	async loadConfig(): Promise<AppConfig> {
		if (this.config) return this.config;

		if (!existsSync(CONFIG_FILE)) {
			console.log(chalk.red('\n❌ NO CONFIG FILE FOUND. CREATING ONE NOW.'));
			await this.createConfig();
		}

		try {
			const data = await readFile(CONFIG_FILE, 'utf-8');
			const loadedConfig = JSON.parse(data) as AppConfig;
			loadedConfig.password = decrypt(
				loadedConfig.sender,
				loadedConfig.password
			);

			this.config = loadedConfig;
			console.log(chalk.green(`\n✅ CONFIG LOADED FROM ${CONFIG_FILE}\n`));
			return this.config;
		} catch (error) {
			console.error(chalk.red('\n❌ ERROR LOADING CONFIG:'), error);
			throw error;
		}
	}

	getConfig(): AppConfig | null {
		return this.config;
	}
}
