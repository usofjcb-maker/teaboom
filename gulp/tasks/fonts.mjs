import gulp from 'gulp';
import ttf2woff2 from 'gulp-ttf2woff2';
import fs from 'fs';
import path from 'path';
import newer from 'gulp-newer';

import { paths } from '../config.mjs';
import { logWithTime } from '../utils/logger.mjs';

const SRC_FONTS_DIR = './assets/src/fonts';

function hasTTF() {
	return fs.existsSync(SRC_FONTS_DIR) &&
		fs.readdirSync(SRC_FONTS_DIR, { recursive: true })
			.some(f => f.endsWith('.ttf'));
}

// TTF → WOFF2
export function fontsConvert(done) {
	if (!hasTTF()) {
		logWithTime('TTF не найдены — пропускаем конвертацию', 'yellow');
		done();
		return;
	}

	return gulp
		.src(`${SRC_FONTS_DIR}/**/*.ttf`, {
			base: SRC_FONTS_DIR,
			encoding: false
		})
		.pipe(newer({ dest: paths.buildFonts, ext: '.woff2' }))
		.pipe(ttf2woff2())
		.pipe(gulp.dest(paths.buildFonts));
}

// COPY WOFF2
export function fontsCopy() {
	return gulp
		.src(`${SRC_FONTS_DIR}/**/*.woff2`, {
			base: SRC_FONTS_DIR,
			encoding: false
		})
		.pipe(newer({ dest: paths.buildFonts, ext: '.woff2' }))
		.pipe(gulp.dest(paths.buildFonts));
}

// GENERATE SASS
export function fontsStyle(done) {
	const fontsRoot = paths.buildFonts;

	if (!fontsRoot || !fs.existsSync(fontsRoot)) {
		logWithTime(`Папка fonts не найдена`, 'yellow');
		done();
		return;
	}

	const outFile = path.resolve('assets/src/styles/fonts.sass');

	const families = fs.readdirSync(fontsRoot, { withFileTypes: true })
		.filter(d => d.isDirectory())
		.filter(d => d.name !== 'teaboom-icons')
		.map(d => d.name);

	if (!families.length) {
		done();
		return;
	}

	const weights = {
		thin: 100,
		extralight: 200,
		light: 300,
		regular: 400,
		medium: 500,
		semibold: 600,
		bold: 700,
		extrabold: 800,
		black: 900
	};

	let content = '';

	families.forEach(family => {
		const familyDir = path.join(fontsRoot, family);

		fs.readdirSync(familyDir)
			.filter(f => f.endsWith('.woff2'))
			.forEach(file => {

				const fileLower = file.toLowerCase();

				// VARIABLE FONT DETECT
				const isVariable = fileLower.includes('variablefont') || fileLower.includes('[wdth') || fileLower.includes('[wght') || fileLower.includes('flex');

				if (isVariable) {
	content += `
@font-face
  font-family: '${family}'
  font-weight: 100 1000
  font-stretch: 25% 151%
  font-display: swap
  font-style: normal
  src: url('../fonts/${family}/${file}') format('woff2')
`;
	return;
				}
				// STATIC FONT
				const weightKey = file.split('-')[1]?.replace('.woff2', '').toLowerCase() || 'regular';
				const fontWeight = weights[weightKey] || 400;
				content += `
@font-face
  font-family: '${family}'
  font-style: normal
  font-weight: ${fontWeight}
  font-display: swap
  src: url('../fonts/${family}/${file}') format('woff2')
`;
			});
	});

	fs.writeFileSync(outFile, content.trim());
	logWithTime(`fonts.sass сгенерирован`, 'green');

	done();
}

// MAIN TASK
export const fonts = gulp.series(
	fontsConvert,
	fontsCopy,
	fontsStyle
);
