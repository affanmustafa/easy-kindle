import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import chalk from 'chalk';

export interface ParsedUrl {
    url: string;
    status: 'unmarked' | 'SENT' | 'FAILED';
    lineNumber: number;
    originalLine: string;
}

/**
 * Parse URLs from a file, tracking their status and line numbers
 */
export async function parseUrlsFromFile(filePath: string): Promise<ParsedUrl[]> {
    if (!existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const parsed: ParsedUrl[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]?.trim();
        if (!line || !line.startsWith('http')) {
            continue;
        }

        let url = line;
        let status: 'unmarked' | 'SENT' | 'FAILED' = 'unmarked';

        if (line.includes(' - SENT')) {
            url = line.replace(' - SENT', '').trim();
            status = 'SENT';
        } else if (line.includes(' - FAILED')) {
            url = line.replace(' - FAILED', '').trim();
            status = 'FAILED';
        }

        parsed.push({
            url,
            status,
            lineNumber: i,
            originalLine: lines[i] || ''
        });
    }

    return parsed;
}

/**
 * Get only unprocessed URLs (not marked as SENT)
 */
export function getUnprocessedUrls(parsed: ParsedUrl[]): ParsedUrl[] {
    return parsed.filter((p) => p.status === 'unmarked' || p.status === 'FAILED');
}

/**
 * Mark a URL in the file with a status (SENT or FAILED)
 */
export async function markUrlInFile(
    filePath: string,
    lineNumber: number,
    url: string,
    status: 'SENT' | 'FAILED'
): Promise<void> {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    if (lineNumber >= 0 && lineNumber < lines.length) {
        let cleanUrl = url.replace(' - SENT', '').replace(' - FAILED', '').trim();
        lines[lineNumber] = `${cleanUrl} - ${status}`;
    }

    await writeFile(filePath, lines.join('\n'), 'utf-8');
}

/**
 * Show status of URLs in the sync file
 */
export function showSyncStatus(parsed: ParsedUrl[]): void {
    const unmarked = parsed.filter((p) => p.status === 'unmarked').length;
    const sent = parsed.filter((p) => p.status === 'SENT').length;
    const failed = parsed.filter((p) => p.status === 'FAILED').length;

    console.log(chalk.cyan('\n📊 Sync File Status:'));
    console.log(chalk.gray(`  Total URLs: ${parsed.length}`));
    console.log(chalk.green(`  ✅ Sent: ${sent}`));
    console.log(chalk.red(`  ❌ Failed: ${failed}`));
    console.log(chalk.yellow(`  ⏳ Pending: ${unmarked}`));

    if (unmarked > 0) {
        console.log(chalk.cyan(`\n📋 Pending URLs:`));
        parsed
            .filter((p) => p.status === 'unmarked')
            .forEach((p, i) => {
                console.log(chalk.gray(`  ${i + 1}. ${p.url}`));
            });
    }

    if (failed > 0) {
        console.log(chalk.cyan(`\n⚠️  Failed URLs (will retry):`));
        parsed
            .filter((p) => p.status === 'FAILED')
            .forEach((p, i) => {
                console.log(chalk.gray(`  ${i + 1}. ${p.url}`));
            });
    }
}

