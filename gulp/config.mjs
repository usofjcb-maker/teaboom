if (!process.env.FTP_HOST) {
	await import('dotenv/config');
}

import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import sync from 'browser-sync';

export const winScp = process.env.WINSCP_PATH;

const browserSync = sync.create();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isBuild = process.argv.some(arg => arg.startsWith('build')) || process.argv.includes('deploy');
const isDev = !isBuild;
const localBuildDir = isBuild ? 'dist' : 'build';

const paths = {
	build: `./assets/${localBuildDir}`,
	src: './assets/src',
	buildHtml: `./assets/${localBuildDir}/`,
	buildJs: `./assets/${localBuildDir}/js/`,
	buildCss: `./assets/${localBuildDir}/css/`,
	buildImg: `./assets/${localBuildDir}/img/`,
	srcImgDir: './assets/src/img',
	buildFonts: `./assets/${localBuildDir}/fonts/`,
	buildVideo: `./assets/${localBuildDir}/video/`,
	buildDocs: `./assets/${localBuildDir}/docs/`,
	srcHtml: './assets/src/*.html',
	srcVideo: './assets/src/video/**/*.*',
	srcDocs: './assets/src/docs/**/*.*',
	srcImg: './assets/src/img/**/*.*',
	srcFonts: './assets/src/fonts/**/*.*',
	srcStyles: './assets/src/styles/**/*.sass',
	srcJs: './assets/src/js/**/*.js',
	pageGlob: './assets/src/*.html',
	partialGlob: './assets/src/template/**/*.{html,njk}',
	watchTemplate: './assets/src/template/**/*.{html,njk}',
	watchJs: './assets/src/js/**/*.js',
	watchCss: './assets/src/styles/**/*.sass',
	watchImg: [
        './assets/src/img/**/*.*',
        '!./assets/src/img/sprite/**/*',
        '!./assets/src/img/icons/**/*'
    ],
    watchSvgIcons: './assets/src/img/icons/**/*.*',
	watchFonts: './assets/src/fonts/**/*.{ttf,woff2}',
	watchVideo: './assets/src/video/**/*.*',
	watchDocs: './assets/src/docs/**/*.*',
	cleanPath: `./assets/${localBuildDir}/*`
};

const getPages = () => {
	const templateDir = path.resolve('./assets/src/template');

	let pages = ['header', 'footer'];

	// Сбор pages из head-*.html
	if (fs.existsSync(templateDir)) {
		fs.readdirSync(templateDir).forEach(file => {
			const match = file.match(/^head-(.+)\.html$/i);
			if (match && !['header', 'footer'].includes(match[1].toLowerCase())) {
				pages.push(match[1].toLowerCase());
			}
		});
	}

	return [...new Set(pages)];
};

const pages = getPages();

const remoteBasePath = process.env.FTP_REMOTE_BASE_PATH || '/public_html/example';
const baseLink = process.env.FTP_BASE_LINK || 'https://example.com';

const ftpConfig = {
	host: process.env.FTP_HOST, 
	user: process.env.FTP_USER, 
	password: process.env.FTP_PASS,
	parallel: 1,
	// log: console.log,
	retry: 3,
	retryDelay: 3000,
	timeout: 120000,
	timeOffset: 0
};

export {
	paths,
	pages,
	browserSync,
	__dirname,
	ftpConfig,
	remoteBasePath,
	baseLink,
	isBuild,
	isDev,
	localBuildDir
};
