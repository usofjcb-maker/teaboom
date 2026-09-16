import fs from 'fs';
import path from 'path';

/**
 * Shared stat cache — устраняет дублирование statSync/lstatSync
 * вызовов для одних и тех же файлов в рамках одного билд-прохода.
 * 
 * Все ключи нормализуются через normalizePath (абсолютный путь, forward slash)
 * для единообразия на Windows.
 * 
 * Очищать через clearStatCache() после завершения batch-операции.
 */

export function normalizePath(filePath) {
	return path.resolve(filePath).replace(/\\/g, '/');
}

const _statCache = new Map();
const _lstatCache = new Map();

export function statCached(filePath) {
	const key = normalizePath(filePath);
	const cached = _statCache.get(key);
	if (cached !== undefined) return cached;

	try {
		const stat = fs.statSync(key);
		_statCache.set(key, stat);
		return stat;
	} catch {
		_statCache.set(key, null);
		return null;
	}
}

export function lstatCached(filePath) {
	const key = normalizePath(filePath);
	const cached = _lstatCache.get(key);
	if (cached !== undefined) return cached;

	try {
		const stat = fs.lstatSync(key);
		_lstatCache.set(key, stat);
		return stat;
	} catch {
		_lstatCache.set(key, null);
		return null;
	}
}

export function existsCached(filePath) {
	const stat = statCached(filePath);
	return stat !== null;
}

export function clearStatCache() {
	_statCache.clear();
	_lstatCache.clear();
}
