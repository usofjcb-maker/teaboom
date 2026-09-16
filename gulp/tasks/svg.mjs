import fs from 'fs';
import gulp from 'gulp';
import { optimize } from 'svgo';
import pLimit from 'p-limit';
import path from 'path';

// --- OPTIMIZE ---
gulp.task('icons:optimize', async () => {
	const fg = (await import('fast-glob')).default;
	const files = await fg('assets/src/img/icons/**/*.svg');

	const limit = pLimit(4);

	await Promise.all(files.map(file =>
		limit(async () => {
			const content = fs.readFileSync(file, 'utf8');

			const result = optimize(content, {
				path: file,
				multipass: true,
				plugins: [
					'removeDimensions',
					'removeComments',
					'cleanupAttrs'
				]
			});

			if (result.data !== content) {
                fs.writeFileSync(file, result.data);
            }
		})
	));

	console.log(`icons optimized: ${files.length}`);
});

// --- SPRITE ---
gulp.task('icons:sprite', async () => {
	const fg = (await import('fast-glob')).default;

	const icons = await fg('assets/src/img/icons/**/*.svg');

	const spritePath = 'assets/src/img/sprite/sprite.svg';

	const header = `<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" style="opacity: 0; position: absolute; width: 0; height: 0;">
    <style>
        .svg_icon_path, .svg_icon_rect{
            transition: .35s all cubic-bezier(0.25, 0.1, 0.25, 1);
        }
    </style>`;

	let symbols = '';

	for (const file of icons) {
		const name = path.basename(file, '.svg');

		const svg = fs.readFileSync(file, 'utf8');

		// --- viewBox ---
		const viewBoxMatch = svg.match(/viewBox="([^"]+)"/i);
		const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 16 16';

		// --- безопасно вытаскиваем inner ---
		const innerMatch = svg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);

		if (!innerMatch) {
			console.warn('⚠ SVG parse error:', file);
			continue;
		}

		let inner = innerMatch[1].trim();

		// --- чистка мусора ---
		inner = inner
			.replace(/<\?xml[\s\S]*?\?>/gi, '')
			.replace(/<!DOCTYPE[\s\S]*?>/gi, '')
			.replace(/style="[^"]*"/gi, '');

		// --- нормализация fill ---
		inner = inner.replace(/fill="(?!none)[^"]*"/gi, 'fill="var(--icon-fill)"');

		// --- нормализация stroke ---
		inner = inner.replace(/stroke="[^"]*"/gi, 'stroke="var(--icon-stroke)"');

		// --- добавление классов ---
		inner = inner
			.replace(/<path\b([^>]*)>/gi, (match, attrs) => {
				if (/class=/.test(attrs)) {
					return `<path${attrs.replace(/class="([^"]*)"/, (m, cls) => `class="${cls} svg_icon_path"`)}>`;
				}
				return `<path class="svg_icon_path"${attrs}>`;
			})
			.replace(/<rect\b([^>]*)>/gi, (match, attrs) => {
				if (/class=/.test(attrs)) {
					return `<rect${attrs.replace(/class="([^"]*)"/, (m, cls) => `class="${cls} svg_icon_rect"`)}>`;
				}
				return `<rect class="svg_icon_rect"${attrs}>`;
			});


		// --- сбор symbol ---
		symbols += `
<symbol id="${name}" viewBox="${viewBox}">
${inner}
</symbol>`;
	}

	const sprite = `${header}
${symbols}
</svg>`;

	fs.mkdirSync(path.dirname(spritePath), { recursive: true });
	fs.writeFileSync(spritePath, sprite);
});

// --- RUNNER ---
export async function runIcons() {
	return new Promise((resolve, reject) => {
		gulp.series(
			'icons:optimize',
			'icons:sprite'
		)((err) => {
			if (err) reject(err);
			else resolve();
		});
	});
}
