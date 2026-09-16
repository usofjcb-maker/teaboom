import gulp from 'gulp';
import { transform } from 'lightningcss';
import gulpSass from 'gulp-sass';
import dartSass from 'sass';
import through2 from 'through2';
import sourcemaps from 'gulp-sourcemaps';
import rename from 'gulp-rename';
import { PassThrough } from 'stream';
import path from 'path';
import fs from 'fs';
import pLimit from 'p-limit';
import { paths, isDev, pages, browserSync } from '../config.mjs';
import { fileExists } from '../utils/fileExists.mjs';
import { logWithTime } from '../utils/logger.mjs';
import { createCache } from '../utils/cache.mjs';
import { shouldRebuildHybrid } from '../utils/shouldRebuild.mjs';
import {
	getSassDependencies,
	getAffectedPages,
	initSassDependenciesMap,
	invalidateSassCache,
	updateSassDeps
} from '../utils/sassDepsCache.mjs';

const rebuildLimit = pLimit(3);

const sass = gulpSass(dartSass);

const sassOptions = {
	includePaths: ['./assets/src/styles']
};

function lightningTransform(isProduction = false) {
	return through2.obj((file, enc, cb) => {
		if (file.isBuffer()) {
			try {
				const result = transform({
					filename: file.path,
					code: file.contents,
					minify: isProduction,
					sourceMap: false,
					targets: {
						chrome: 90,
						firefox: 90,
						safari: 15,
						edge: 90
					},
					drafts: {
						nesting: true
					},
					include: 1 << 0 // TODO временно убрать
				});

				file.contents = Buffer.from(result.code);
			} catch (err) {
				return cb(err);
			}
		}
		cb(null, file);
	});
}

const compileCssDev = (page, options = {}, withReload = true) => {
	const srcPath = `./assets/src/styles/${page}/${page}.sass`;
	if (!fileExists(srcPath)) {
		const empty = new PassThrough({ objectMode: true });
		empty.end();
		return empty;
	}

	let stream = gulp.src(srcPath, { allowEmpty: true })
		.pipe(sourcemaps.init())
		.pipe(
			sass({
				...sassOptions,
				...options,
				quietDeps: true,
				silenceDeprecations: ['legacy-js-api', 'import', 'global-builtin', 'if-function']
			}).on('error', sass.logError)
		)
		.pipe(rename({ basename: page, suffix: '.min' }))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(paths.buildCss));

	if (withReload) {
		stream = stream.pipe(browserSync.stream());
	}

	return stream.pipe(
		through2.obj((file, enc, cb) => {
			if (path.extname(file.path) === '.css') {
				logWithTime(`Сборка файла ${page}.sass завершена!`, 'green');
			}
			cb(null, file);
		})
	);
};

const runCssBuild = (page) => {
	return new Promise((resolve, reject) => {
		const stream = compileCssDev(page);

		// const done = () => resolve();

		// stream.on('end', done);
		stream.on('finish', resolve);
		stream.on('error', reject);
	});
};

const { buildCache: sassCache, saveCache: saveSassCache } = createCache('.sass-build-cache.json');

// Сборка SASS для production
const compileCssBuild = (page, options = {}) => {
	const srcPath = `./assets/src/styles/${page}/${page}.sass`;
	if (!fileExists(srcPath)) {
		const empty = new PassThrough({ objectMode: true });
		empty.end();
		return empty;
	}

	const { needsBuild, hash } = shouldRebuildHybrid(
		srcPath,
		getSassDependencies,
		sassCache,
		{ debug: true }
	);

	if (!needsBuild) {
		logWithTime(`[SKIP] ${page}.sass не изменён`, 'yellow');
		const empty = new PassThrough({ objectMode: true });
		empty.end();
		return empty;
	}

	let hasSassError = false;

	return gulp.src(srcPath, { allowEmpty: true })
		.pipe(
			sass({
				...sassOptions,
				...options,
				quietDeps: true,
				silenceDeprecations: ['legacy-js-api', 'import', 'global-builtin', 'if-function']
			}).on('error', function (err) {
				hasSassError = true;
				logWithTime(`SASS error in ${page}.sass: ${err.messageFormatted || err.message}`, 'red');
				this.emit('end');
			})
		)
		.pipe(lightningTransform(true))
		.pipe(rename({ basename: page, suffix: '.min' }))
		.pipe(gulp.dest(paths.buildCss))
		.pipe(through2.obj((file, enc, cb) => {
			// Обновляем кеш только после успешной сборки (предотвращает cache poisoning)
			sassCache.set(srcPath, hash);
			logWithTime(`Build ${page}.sass завершён (LightningCSS)`, 'green');
			cb(null, file);
		}))
		.on('finish', function () {
			if (hasSassError) {
				this.destroy(new Error(`SASS compilation failed for ${page}`));
			}
		});
};

let depsInitialized = false;
let watcherInstance = null;

// Debounced компиляция для массовых изменений
const pendingRebuilds = new Set();
let rebuildTimer = null;

const scheduleRebuild = (page, isBatch = false) => {
	pendingRebuilds.add(page);

	if (rebuildTimer) clearTimeout(rebuildTimer);

	rebuildTimer = setTimeout(async () => {
		const pagesToRebuild = [...pendingRebuilds];
		pendingRebuilds.clear();

		if (pagesToRebuild.length > 1) {
			logWithTime(`Batch rebuild (${pagesToRebuild.length}): ${pagesToRebuild.join(', ')}`, 'yellow');
		}

		try {
			await Promise.all(
				pagesToRebuild.map(page =>
					rebuildLimit(runCssBuild.bind(null, page))
				)
			);
		} catch (err) {
			logWithTime(`Rebuild error: ${err.message}`, 'red');
		}
	}, 150);
};

const sassWatcher = async (done) => {
	if (watcherInstance) return done();

	// Первичная компиляция для страниц без CSS (до инициализации зависимостей)
	const initialBuilds = pages
	.filter(page => {
		const filePath = path.resolve(paths.buildCss, `${page}.min.css`);
		return !fs.existsSync(filePath);
	})
	.map(page => runCssBuild(page));

	if (initialBuilds.length) {
		try {
			await Promise.all(initialBuilds);
		} catch (err) {
			logWithTime(`Initial SASS build error: ${err.message}`, 'red');
		}
	}

	// Инициализация карты зависимостей ПОСЛЕ первичной компиляции
	if (!depsInitialized) {
		initSassDependenciesMap(pages);
		depsInitialized = true;
	}

	watcherInstance = gulp.watch('assets/src/styles/**/*.{sass,scss}', {
		ignored: '**/node_modules/**',
		ignoreInitial: true
	});

	const handleChange = (changedFile) => {
		const normalized = path.resolve(changedFile).replace(/\\/g, '/');
		const fileName = path.basename(normalized);
		const folderName = path.basename(path.dirname(normalized));

		// Инвалидация кеша
		invalidateSassCache(normalized);

		// Главный файл страницы
		if (fileName === `${folderName}.sass` || fileName === `${folderName}.scss`) {
			scheduleRebuild(folderName);
			updateSassDeps(normalized);
			return;
		}

		// Глобальный styles.sass — пересборка всех страниц
		if (fileName === 'styles.sass') {
			logWithTime('Изменения в styles.sass, пересобираем все страницы...', 'yellow');
			pages.forEach(page => scheduleRebuild(page));
			return;
		}

		// Обновление зависимостей и пересборка затронутых страниц
		updateSassDeps(normalized);
		const affectedPages = getAffectedPages(normalized);

		if (affectedPages.length > 0) {
			logWithTime(`Изменения в ${fileName}, пересобираем: ${affectedPages.join(', ')}`, 'yellow');
			affectedPages.forEach(page => scheduleRebuild(page));
		} else {
			logWithTime(`Изменения в ${fileName}, зависимые страницы не найдены`, 'gray');
		}
	};

	const handleAdd = (addedFile) => {
		const normalized = path.resolve(addedFile).replace(/\\/g, '/');
		invalidateSassCache(normalized, true);
		updateSassDeps(normalized);

		const affectedPages = getAffectedPages(normalized);
		if (affectedPages.length > 0) {
			logWithTime(`Новый файл ${path.basename(normalized)}, пересобираем: ${affectedPages.join(', ')}`, 'yellow');
			affectedPages.forEach(page => scheduleRebuild(page));
		}
	};

	const handleUnlink = (removedFile) => {
		const normalized = path.resolve(removedFile).replace(/\\/g, '/');
		invalidateSassCache(normalized, true);

		const affectedPages = pages.filter(page => {
			const pageFile = `assets/src/styles/${page}/${page}.sass`;
			if (!fs.existsSync(pageFile)) return false;
			const deps = getSassDependencies(pageFile);
			return deps.includes(normalized);
		});

		if (affectedPages.length > 0) {
			logWithTime(`Удалён файл ${path.basename(normalized)}, пересобираем: ${affectedPages.join(', ')}`, 'yellow');
			affectedPages.forEach(page => scheduleRebuild(page));
		}
	};

	watcherInstance.on('change', handleChange);
	watcherInstance.on('add', handleAdd);
	watcherInstance.on('unlink', handleUnlink);

	done();
};

export const compileCss = (page) => {
	return isDev ? compileCssDev(page) : compileCssBuild(page);
};

export { sassWatcher, saveSassCache };