import { __dirname, browserSync, isBuild, pages, paths } from './gulp/config.mjs';
import { compileHtml } from './gulp/tasks/html.mjs';
import { deleteAsync } from 'del';
import fs from "fs";
import gulp from 'gulp';
import path from "path";
import replace from 'gulp-replace';
import os from 'os';
import pLimit from 'p-limit';
let bundleModules, fontsTask, compileCss, sassWatcher, saveSassCache, runIcons;

async function loadEsbuild() {
	if (!bundleModules) {
		const mod = await import('./gulp/tasks/esbuild.mjs');
		bundleModules = mod.bundleModules;
	}
}

async function loadSass() {
	if (!compileCss) {
		const mod = await import('./gulp/tasks/sass.mjs');
		compileCss = mod.compileCss;
		sassWatcher = mod.sassWatcher;
		saveSassCache = mod.saveSassCache;
	}
}

async function loadFonts() {
	if (!fontsTask) {
		const mod = await import('./gulp/tasks/fonts.mjs');
		fontsTask = mod.fonts;
	}
}

async function loadSvg() {
    if (!runIcons) {
        const mod = await import('./gulp/tasks/svg.mjs');
        runIcons = mod.runIcons;
    }
}

let isRunning = false;

function iconsTask(done) {
    if (isRunning) return done();

    isRunning = true;

    loadSvg().then(() => {
        runIcons().then(() => {
            isRunning = false;
            done();
        }).catch(done);
    });
}

// Server
gulp.task('browser-sync', (done) => {
	browserSync.init({
		server: {
			baseDir: paths.build
		},
		notify: false,
		logLevel: 'silent',
		ghostMode: false
	});
	done();
});

// Cписок задач
const getTasks = (type) => {
	const tasks = [];
	pages.forEach((page) => {
		tasks.push(`${type}${page}`);
	});
	return tasks;
};

gulp.task("html", () => compileHtml());

// Задачи sass для всех страниц
pages.forEach((page) => {
	gulp.task(`css${page}`, async () => {
		await loadSass();
		return compileCss(page);
	});
});

async function buildCssControlled() {
	await loadSass();

	const { clearRebuildCaches } = await import('./gulp/utils/shouldRebuild.mjs');
	const limit = pLimit(3);

	const runCssPromise = (page) => new Promise((resolve, reject) => {
		const stream = compileCss(page);
		stream.on('finish', resolve);
		stream.on('error', reject);
	});

	await Promise.all(
		pages.map(page => limit(() => runCssPromise(page)))
	);

	// Один раз после всех страниц (5B)
	saveSassCache();

	// Очистка content + stat кешей после batch SASS build
	clearRebuildCaches();
}

gulp.task('css', buildCssControlled);

gulp.task('sassWatcher', async (done) => {
	await loadSass();
	return sassWatcher(done);
});

async function jsTask() {
	await loadEsbuild();
	return bundleModules();
}

gulp.task('fonts', async function fontsWrapper(done) {
	await loadFonts();
	return fontsTask(done);
});

// Video
gulp.task('videos', () => {
	return gulp.src(paths.srcVideo, {
		since: gulp.lastRun('videos'),
		encoding: false,
		allowEmpty: true
	})
	.pipe(gulp.dest(paths.buildVideo));
});

// IMAGES
gulp.task('image', () => {
	const src = isBuild ? [
		'assets/src/img/**/*',
		'!assets/src/img/**/*.{jpg,jpeg,png}',
		'!assets/src/img/icons/**/*'
	] : [
		'assets/src/img/**/*',
		'!assets/src/img/icons/**/*'
	];

	return gulp.src(src, {
		since: gulp.lastRun('image'),
		encoding: false
	})
		.pipe(gulp.dest(paths.buildImg));
});

gulp.task('image:build', async () => {
	const {
		loadImageCache,
		saveImageCache
	} = await import('./gulp/utils/imageCache.mjs');

	const { default: fg } = await import('fast-glob');
	let sharp;
	async function getSharp() {
		if (!sharp) {
			sharp = (await import('sharp')).default;
		}
		return sharp;
	}
	const { default: pLimit } = await import('p-limit');

	const cachePath = path.resolve('cache/.images-cache.json');
	const cache = loadImageCache(cachePath);

	const files = await fg('**/*.{jpg,jpeg,png}', {
		cwd: paths.srcImgDir,
		absolute: true,
		onlyFiles: true
	});

	if (!files.length) {
		console.log('no raster images found');
		return;
	}

	const cpuCount = os.cpus().length;

	const concurrency = Math.max(Math.min(cpuCount - 1, 8), 2);

	const limit = pLimit(concurrency);

	let processed = 0;
	let skipped = 0;

	let failed = 0;

	await Promise.all(
		files.map(file =>
			limit(async () => {
				const rel = path.relative(paths.srcImgDir, file);
				const out = path.join(paths.buildImg, rel);

				const stat = fs.statSync(file);
				const signature = `${stat.mtimeMs}:${stat.size}`;

				// SKIP если не изменился
				if (cache[rel] === signature && fs.existsSync(out)) {
					skipped++;
					return;
				}

				try {
					fs.mkdirSync(path.dirname(out), { recursive: true });

					const ext = path.extname(file).toLowerCase();
					const imgSharp = await getSharp();
					let img = imgSharp(file);

					if (ext === '.jpg' || ext === '.jpeg') {
						img = img.jpeg({
							quality: 90,
							progressive: true,
							mozjpeg: true
						});
					}

					if (ext === '.png') {
						img = img.png({
							quality: 90,
							compressionLevel: 9,
							adaptiveFiltering: true
						});
					}

					await img.toFile(out);

					cache[rel] = signature;
					processed++;
				} catch (err) {
					console.warn(`⚠ Failed to process ${rel}: ${err.message}`);
					failed++;
				}
			})
		)
	);

	saveImageCache(cachePath, cache);

	console.log(`images: ${processed} optimized, ${skipped} skipped${failed ? `, ${failed} failed` : ''}`);
});


// Принудительная пересборка с инвалидацией кеша
gulp.task('clean-cache', async (done) => {
	const cacheDir = path.resolve('cache');
	
	// Инвалидация SASS кеша
	const sassCachePath = path.resolve(cacheDir, '.sass-build-cache.json');
	if (fs.existsSync(sassCachePath)) {
		fs.unlinkSync(sassCachePath);
		console.log('✅ SASS cache invalidated');
	}
	
	// Инвалидация image кеша
	const imageCachePath = path.resolve(cacheDir, '.images-cache.json');
	if (fs.existsSync(imageCachePath)) {
		fs.unlinkSync(imageCachePath);
		console.log('✅ Image cache invalidated');
	}
	
	// Инвалидация fonts кеша
	const fontsCachePath = path.resolve(cacheDir, '.fonts-cache.json');
	if (fs.existsSync(fontsCachePath)) {
		fs.unlinkSync(fontsCachePath);
		console.log('✅ Fonts cache invalidated');
	}
	
	// Инвалидация esbuild кеша
	const esbuildCachePath = path.resolve(cacheDir, '.esbuild-cache.json');
	if (fs.existsSync(esbuildCachePath)) {
		fs.unlinkSync(esbuildCachePath);
		console.log('✅ esbuild cache invalidated');
	}
	
	console.log('✅ All caches cleared');
	done();
});

gulp.task('clean:dev', () => deleteAsync([
	`${paths.build}/**`,
	`!${paths.build}/fonts/**`,
	`!${paths.build}/img/**`,
	`!${paths.build}/video/**`,
	`!${paths.build}/docs/**`,
], { force: true }));

gulp.task('clean:soft', () => deleteAsync([
	`${paths.build}/**/*.html`,
	`${paths.build}/**/*.map`,
	`${paths.buildJs}/**/*`,
	`!${paths.build}/video/**`,
	`!${paths.build}/fonts/**`,
	`!${paths.build}/docs/**`,
], { force: true }));

gulp.task('sprite:copy', () => {
    return gulp.src('assets/src/img/sprite/**/*.svg').pipe(gulp.dest(paths.buildImg + '/sprite'));
});

gulp.task('favicon', () => {
	return gulp.src('assets/src/favicon.ico', {
		encoding: false,
		allowEmpty: true
	})
		.pipe(gulp.dest(paths.build));
});

// Watch
gulp.task('watch', () => {
	gulp.watch(paths.pageGlob).on('change', (file) => {
		const fileName = path.basename(file);
		console.log(`📄 page changed: ${fileName}`);
		return compileHtml(file);
	});

gulp.watch(paths.partialGlob, gulp.series('html'));
	gulp.watch(paths.watchImg, gulp.series('image'));
	gulp.watch(paths.watchSvgIcons, { delay: 200 }, gulp.series(iconsTask, 'sprite:copy'));
	gulp.watch(paths.watchFonts, gulp.series('fonts'));
	gulp.watch(paths.watchVideo, gulp.series('videos'));
	return;
});

gulp.task('version', (done) => {
	const htmlDir = paths.buildHtml;
	const htmlFiles = fs.readdirSync(htmlDir).filter(f => f.endsWith('.html'));

	if (!htmlFiles.length) return done();

	// Проверяем, есть ли вообще ?v= в HTML (если нет — нет смысла)
	let hasVersionedAssets = false;
	for (const file of htmlFiles) {
		const content = fs.readFileSync(path.join(htmlDir, file), 'utf8');
		if (/\.min\.(css|js)\?v=\d+/.test(content)) {
			hasVersionedAssets = true;
			break;
		}
	}

	if (!hasVersionedAssets) {
		console.log('[version] No versioned assets found, skipping');
		return done();
	}

	const timestamp = Date.now();
	return gulp
		.src(htmlDir + '**/*.html')
		.pipe(replace(/(\.min\.(css|js))\?v=\d+/g, `$1?v=${timestamp}`))
		.pipe(gulp.dest(paths.buildHtml));
});

gulp.task(
	'default',
	gulp.series(
		'fonts',
		iconsTask,
		gulp.parallel(
			'html',
			'image',
			'favicon',
			'videos'
		),
		gulp.parallel(
			'sassWatcher',
			'browser-sync',
			'watch',
			jsTask
		)
	)
);

gulp.task(
	'build',
	gulp.series(
		'clean:soft',
		iconsTask,
		gulp.parallel(
			jsTask,
			'image:build',
			'fonts'
		),
		gulp.parallel(
			'html',
			'css',
			'image',
			'favicon',
			'videos'
		),
		'version'
	)
);

// Graceful shutdown — dispose esbuild contexts при завершении процесса
process.on('exit', () => {
	// Синхронная очистка при выходе (dispose уже вызван или не нужен)
});

async function cleanupAndExit() {
	try {
		if (bundleModules) {
			const { disposeAllContexts } = await import('./gulp/tasks/esbuild.mjs');
			await disposeAllContexts();
		}
	} catch { /* ignore */ }
}

// SIGINT: позволяем Gulp завершиться первым, потом чистим esbuild
process.once('SIGINT', () => {
	cleanupAndExit().finally(() => {
		// Не вызываем process.exit — даём Gulp завершиться штатно
	});
});

gulp.task('deploy', gulp.series(
	'build',
	async function deployWrapper(cb) {
		const { deployTask } = await import('./gulp/utils/ftp.mjs');
		return deployTask(cb);
	}
));
