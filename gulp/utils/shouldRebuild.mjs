import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { isDev } from '../config.mjs';
import { statCached, existsCached, clearStatCache } from './statCache.mjs';

// Content cache — устраняет повторное чтение shared deps между страницами в PROD
const _contentCache = new Map();

export function clearRebuildCaches() {
	_contentCache.clear();
	clearStatCache();
}

/**
 * Гибридная проверка необходимости пересборки
 * 
 * DEV режим:
 *   - Использует сигнатуру: filePath + mtimeMs + size
 *   - Без чтения содержимого файлов
 *   - Быстрая проверка для watch-режима
 * 
 * PROD режим:
 *   - Полный MD5 по содержимому всех зависимостей
 *   - Надёжная проверка для финального билда
 *
*/
function shouldRebuildHybrid(entryPath, depsGetter, buildCache, options = {}) {
	const { debug = false } = options;

	if (!existsCached(entryPath)) {
		if (debug) console.log(`[SKIP] ${entryPath} не существует`);
		return { needsBuild: false, hash: '' };
	}

	const allFiles = [entryPath, ...depsGetter(entryPath)];
	const hash = crypto.createHash('md5');

	// Гибридная стратегия: DEV vs PROD
	if (isDev) {
		// DEV: mtime + size (быстро, без чтения содержимого)
		for (const file of allFiles) {
			const stat = statCached(file);
			if (stat) {
				hash.update(`${file}:${stat.mtimeMs}:${stat.size}`);
			} else {
				hash.update(`${file}:missing`);
			}
		}
	} else {
		// PROD: полный MD5 по содержимому (надёжно)
		// Content cache устраняет N×M повторных чтений shared deps
		for (const file of allFiles) {
			let content = _contentCache.get(file);
			if (content === undefined) {
				if (existsCached(file)) {
					try {
						content = fs.readFileSync(file, 'utf8');
					} catch {
						content = null;
					}
				} else {
					content = null;
				}
				_contentCache.set(file, content);
			}

			if (content !== null) {
				hash.update(`${file}:${content}`);
			} else {
				hash.update(`${file}:missing`);
			}
		}
	}

	const finalHash = hash.digest('hex');
	const prevHash = buildCache.get(entryPath);

	// Получаем путь до output-файла для проверки
	const ext = path.extname(entryPath);
	const baseName = path.basename(entryPath, ext);

	let distPath = null;
	if (entryPath.includes('/js/')) {
		distPath = path.resolve('assets/dist/js', `${baseName}.min.js`);
	} else if (entryPath.includes('/styles/')) {
		distPath = path.resolve('assets/dist/css', `${baseName}.min.css`);
	}

	// Если output не существует - пересобрать
	if (!distPath || !existsCached(distPath)) {
		if (debug) {
			console.log(`[REBUILD] ${baseName} — output не найден`);
		}
		return { needsBuild: true, hash: finalHash };
	}

	// Если хеш изменился - пересобрать
	if (prevHash !== finalHash) {
		if (debug) {
			const mode = isDev ? '(DEV: mtime+size)' : '(PROD: content MD5)';
			console.log(`[REBUILD] ${baseName} ${mode}`);
		}
		return { needsBuild: true, hash: finalHash };
	}

	if (debug) {
		const mode = isDev ? '(DEV: mtime+size)' : '(PROD: content MD5)';
		console.log(`[SKIP] ${baseName} не изменён ${mode}`);
	}

	return { needsBuild: false, hash: finalHash };
}

function shouldRebuildGeneric(entryPath, depsGetter, buildCache, options = {}) {
	return shouldRebuildHybrid(entryPath, depsGetter, buildCache, options);
}

export { shouldRebuildHybrid, shouldRebuildGeneric };