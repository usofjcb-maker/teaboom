import fs from 'fs';
import path from 'path';
import { lstatCached, statCached, existsCached, clearStatCache } from './statCache.mjs';

/**
* Кеш зависимостей SASS файлов
* 
* Хранит:
*   - sassDepsCache: filePath - [dependencies]
*   - sassMtimeCache: filePath - mtimeMs (для валидации кеша)
*   - reverseDepsMap: depFile - [entryFiles] (для быстрого поиска затронутых страниц)
*/

const sassDepsCache = new Map();
const sassMtimeCache = new Map();
const reverseDepsMap = new Map();
const resolveCache = new Map();

// Разрешение импорта SASS с учётом всех возможных вариантов
function resolveImport(dir, importPath) {
    const cacheKey = `${dir}:${importPath}`;
    if (resolveCache.has(cacheKey)) return resolveCache.get(cacheKey);

    const candidates = [
        path.resolve(dir, `${importPath}.sass`),
        path.resolve(dir, `${importPath}.scss`),
        path.resolve(dir, `_${importPath}.sass`),
        path.resolve(dir, `_${importPath}.scss`),
        path.resolve(dir, importPath),
        path.resolve(dir, `_${importPath}`)
    ];

    for (const candidate of candidates) {
        const stat = lstatCached(candidate);
        if (stat && stat.isFile()) {
            resolveCache.set(cacheKey, candidate.replace(/\\/g, '/'));
            return candidate.replace(/\\/g, '/');
        }
    }
    resolveCache.set(cacheKey, '');
    return '';
}

// Shallow парсинг — извлекает только прямые зависимости (без рекурсии)
function parseDepsShallow(normalized) {
    const stat = lstatCached(normalized);
    if (!stat || stat.isDirectory()) return [];

    let content;
    try {
        content = fs.readFileSync(normalized, 'utf8');
    } catch {
        return [];
    }

    const directDeps = [];
    const importRegex = /@(?:import|use|forward)\s+(.+);?/gi;
    const matches = content.matchAll(importRegex);

    for (const match of matches) {
        const importLine = match[1]
            .replace(/\/\/.*$/gm, '')
            .split(',')
            .map(s => s.trim().replace(/^['"]|['"]$/g, ''))
            .filter(Boolean);

		for (const imported of importLine) {
			const dir = path.dirname(normalized);
			const resolved = resolveImport(dir, imported);
			if (resolved) {
				directDeps.push(resolved);
			}
		}
	}

	return directDeps;
}

// Защита от циклов при рекурсии через кеш
const _resolving = new Set();

// Получить зависимости SASS файла с кешированием
// Рекурсия идёт ЧЕРЕЗ кеш — shared deps не перечитываются
export function getSassDependencies(filePath) {
	const normalized = path.resolve(filePath).replace(/\\/g, '/');

	// Защита от циклических зависимостей
	if (_resolving.has(normalized)) return [];

	// Проверка кеша по mtime
	try {
		const stat = statCached(normalized);
		if (!stat) return [];

		const mtime = stat.mtimeMs;

		if (sassDepsCache.has(normalized) && sassMtimeCache.get(normalized) === mtime) {
			return sassDepsCache.get(normalized);
		}

		_resolving.add(normalized);
		try {
			// Shallow parse: только прямые deps (без рекурсии, 1 readFileSync)
			const directDeps = parseDepsShallow(normalized);

			// Рекурсия через кеш — shared файлы берутся из Map
			const allDeps = new Set(directDeps);
			for (const dep of directDeps) {
				for (const transitive of getSassDependencies(dep)) {
					allDeps.add(transitive);
				}
			}

			const deps = [...allDeps];

			// Сохранение в кеш
			sassDepsCache.set(normalized, deps);
			sassMtimeCache.set(normalized, mtime);

			// Обновление reverse map
			updateReverseDepsMap(normalized, deps);

			return deps;
		} finally {
			_resolving.delete(normalized);
		}
	} catch (err) {
		_resolving.delete(normalized);
		return [];
	}
}

// Обновление reverse dependency map
function updateReverseDepsMap(entryPath, deps) {
	// Удаляем старые связи для этого entry
	for (const [dep, entries] of reverseDepsMap.entries()) {
		const idx = entries.indexOf(entryPath);
		if (idx !== -1) {
			entries.splice(idx, 1);

			if (entries.length === 0) {
				reverseDepsMap.delete(dep);
			}
		}
	}

	// Добавляем новые связи
	for (const dep of deps) {
		if (!reverseDepsMap.has(dep)) {
			reverseDepsMap.set(dep, []);
		}
		if (!reverseDepsMap.get(dep).includes(entryPath)) {
			reverseDepsMap.get(dep).push(entryPath);
		}
	}
}

// Получить страницы, зависящие от изменённого файла
export function getAffectedPages(changedFilePath) {
    const normalized = path.resolve(changedFilePath).replace(/\\/g, '/');
    const affected = new Set();
    const visited = new Set();
    const queue = [normalized];

    while (queue.length > 0) {
        const current = queue.shift();
        if (visited.has(current)) continue;
        visited.add(current);

        const match = current.match(/assets\/src\/styles\/([a-z0-9_-]+)\//);
        if (match) {
            affected.add(match[1]);
        }

        const entries = reverseDepsMap.get(current) || [];
        queue.push(...entries);
    }

    return [...affected];
}

// Инициализация графа зависимостей для всех страниц
export function initSassDependenciesMap(pages) {
	sassDepsCache.clear();
	sassMtimeCache.clear();
	reverseDepsMap.clear();

	for (const page of pages) {
		const file = `assets/src/styles/${page}/${page}.sass`;
		if (existsCached(file)) {
			getSassDependencies(file);
		}
	}
}

// Инвалидация кеша для конкретного файла
export function invalidateSassCache(filePath, clearResolve = false) {
	const normalized = path.resolve(filePath).replace(/\\/g, '/');
	sassDepsCache.delete(normalized);
	sassMtimeCache.delete(normalized);
	// Очищаем stat cache чтобы DEV watch не использовал stale mtime
	clearStatCache();
	if (clearResolve) resolveCache.clear();
}

// Полная очистка всех кешей
export function clearAllSassCaches() {
	sassDepsCache.clear();
	sassMtimeCache.clear();
	reverseDepsMap.clear();
}

// Обновление зависимостей при изменении файла
export function updateSassDeps(filePath) {
	const normalized = path.resolve(filePath).replace(/\\/g, '/');
	getSassDependencies(normalized);
}

// Получить зависимости страницы (для отладки)
export function getPageDependencies(page) {
	const file = `assets/src/styles/${page}/${page}.sass`;
	if (existsCached(file)) {
		return getSassDependencies(file);
	}
	return [];
}

// Дамп графа зависимостей (для отладки)
export function dumpDepsGraph() {
	return {
		depsCache: Object.fromEntries(sassDepsCache),
		mtimeCache: Object.fromEntries(sassMtimeCache),
		reverseMap: Object.fromEntries(reverseDepsMap)
	};
}