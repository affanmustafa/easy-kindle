import { createCanvas } from 'canvas';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

/**
 * Wrap text to fit within a specified width
 */
function wrapText(
    ctx: any,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
): void {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > maxWidth && i > 0) {
            ctx.fillText(line, x, currentY);
            line = words[i] + ' ';
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, currentY);
}

/**
 * Generate a text-based cover image
 */
export async function generateTextCover(
    title: string,
    author: string
): Promise<string> {
    const canvas = createCanvas(600, 800);
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 800);
    gradient.addColorStop(0, '#2c3e50');
    gradient.addColorStop(1, '#34495e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 800);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    wrapText(ctx, title, 300, 250, 500, 60);

    // Divider line
    ctx.strokeStyle = '#ecf0f1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, 500);
    ctx.lineTo(500, 500);
    ctx.stroke();

    // Author
    ctx.font = '24px Arial';
    ctx.fillStyle = '#bdc3c7';
    ctx.fillText(author || 'Unknown Author', 300, 600);

    // Footer
    ctx.font = '16px Arial';
    ctx.fillStyle = '#95a5a6';
    ctx.fillText('Easy-Kindle', 300, 750);

    // Save to temp file
    const buffer = canvas.toBuffer('image/png');
    const tempPath = join(tmpdir(), `cover-${Date.now()}.png`);
    await writeFile(tempPath, buffer);

    return tempPath;
}