# Easy-Kindle

A command-line tool that converts web articles into EPUB files and sends them directly to your Kindle or e-reader via email.

## Features

- **Web Content Extraction**: Automatically extracts clean, readable content from web pages using Mozilla Readability
- **EPUB Generation**: Creates properly formatted EPUB files with metadata, table of contents, and embedded images
- **Email Delivery**: Sends EPUBs directly to your Kindle/e-reader via SMTP
- **Batch Processing**: Process multiple URLs at once from a text file
- **Sync System**: Track and automatically process new URLs from a reading list file
- **Author Extraction**: Preserves article authors in EPUB metadata
- **Flexible Output**: Generate individual EPUBs or combine multiple articles into one book

## Global Installation

```bash
brew tap affanmustafa/easy-kindle
brew install easy-kindle
```

## Usage

```bash
easy-kindle send https://example.com/article
```

```bash
easy-kindle sync
```

## Development

```bash
# Clone the repository
git clone git@github.com:affanmustafa/easy-kindle.git
cd easy-kindle

# Install dependencies
bun install

# Configure Easy-Kindle
bun index.ts init
```

## Quick Start

### Initial Setup

Run the setup wizard to configure your email and reading list:

```bash
bun index.ts init
```

You'll be asked for:

- Your email address (sender)
- Your Kindle/e-reader email address (receiver)
- Path to store generated EPUBs
- Email password (use App Password for Gmail)
- SMTP server settings (auto-configured for Gmail)
- Path to your reading list file (for sync feature)

### Basic Usage

**Preview an article:**

```bash
bun index.ts preview https://example.com/article
```

**Generate EPUB locally:**

```bash
bun index.ts generate https://example.com/article
```

**Send to Kindle:**

```bash
bun index.ts send https://example.com/article
```

## Commands

### `preview`

Preview extracted content without generating EPUB:

```bash
bun index.ts preview <url|file>
```

### `generate`

Generate EPUB files locally:

```bash
# Single URL
bun index.ts generate https://example.com/article

# Multiple URLs from file
bun index.ts generate links.txt

# Combine into single EPUB
bun index.ts generate links.txt --combine --title "My Collection"

# Specify output directory
bun index.ts generate links.txt -o ~/Downloads
```

**Options:**

- `-t, --title <title>` - Custom title for combined EPUB (implies --combine)
- `-o, --output <dir>` - Output directory (default: current directory)
- `-c, --combine` - Combine all articles into a single EPUB

### `send`

Generate EPUBs and send to your Kindle:

If you have installed this via Brew, all these commands can be run with `easy-kindle` instead of `bun index.ts`.

```bash
# Send single article
bun index.ts send https://example.com/article

# Send multiple articles (as separate EPUBs)
bun index.ts send https://url1.com https://url2.com

# Combine multiple articles into one EPUB
bun index.ts send links.txt --combine --title "Weekend Reading"
```

**Options:**

- `-t, --title <title>` - Custom title for combined EPUB (implies --combine)
- `-o, --output <dir>` - Directory to store generated EPUBs
- `-c, --combine` - Combine all articles into a single EPUB

### `sync`

Process new URLs from your configured reading list:

```bash
# Process unmarked URLs
bun index.ts sync

# Combine new URLs into one EPUB
bun index.ts sync --combine
```

**How it works:**

1. Reads your configured reading list file
2. Finds URLs without ` - SENT` or ` - FAILED` markers
3. Processes and sends them to your Kindle
4. Marks successful URLs as ` - SENT`
5. Marks failed URLs as ` - FAILED` (will retry next time)

**Example reading list file:**

```
https://example.com/article1 - SENT
https://example.com/article2
https://example.com/article3 - FAILED
https://example.com/article4
```

Running `bun index.ts sync` will process articles 2, 3, and 4.

### `init`

Run the configuration wizard:

```bash
bun index.ts init
```

## Configuration

Configuration is stored in `~/.easy-kindle/config.json` with encrypted email password.

**Config structure:**

```json
{
	"sender": "your-email@gmail.com",
	"receiver": "your-kindle@kindle.com",
	"storePath": "/path/to/store/epubs",
	"password": "encrypted-password",
	"server": "smtp.gmail.com",
	"port": 465,
	"syncFilePath": "/path/to/reading-list.txt"
}
```

## Email Provider Setup

### Gmail

1. Enable 2-factor authentication
2. Generate an [App Password](https://myaccount.google.com/apppasswords)
3. Use the App Password during `init`

### Other Providers

During `init`, you'll be prompted for:

- SMTP server address (e.g., `smtp.office365.com`)
- SMTP port (usually `465` for SSL or `587` for TLS)

## File Format Support

### Input

- **URLs**: Direct web page links
- **URL Files**: `.txt` or `.md` files with one URL per line
- **E-books**: `.epub`, `.pdf`, `.mobi`, `.azw3`, `.txt`

### Output

- **EPUB**: Standards-compliant EPUB3 format with metadata and embedded images

## Tips

**For Gmail users:**

- Use an App Password instead of your regular password
- Add your Kindle email to approved senders in Amazon settings

**For multiple articles:**

- Default behavior: individual EPUBs per URL
- Use `--combine` to merge into one book
- Use `--title` to set a custom title (automatically combines)

**For syncing:**

- Manually mark URLs as ` - SENT` to skip them
- Failed URLs are automatically retried on next sync
- Both `.txt` and `.md` files work identically

## Technical Details

**Built with:**

- **Bun**: JavaScript runtime and package manager
- **Mozilla Readability**: Content extraction
- **JSDOM**: DOM manipulation
- **epub-gen**: EPUB generation
- **Nodemailer**: Email delivery
- **Commander**: CLI framework
- **Chalk**: Terminal styling

**Content Extraction:**

- Uses Mozilla Readability for primary extraction
- Fallback heuristics for non-standard pages
- Handles lazy-loaded images (`srcset`, `data-src`)
- Converts relative URLs to absolute
- Preserves article structure and formatting

**EPUB Features:**

- Metadata (title, author, publisher)
- Table of contents
- Embedded images
- Source URL and extraction date in each chapter
- Clean, e-reader-optimized styling

## Limitations

- JavaScript-rendered pages may not extract well
- Paywalled content requires manual login
- Email attachment size limits apply (typically 25MB for most providers)
- Some sites may block automated access
