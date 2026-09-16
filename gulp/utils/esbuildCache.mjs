import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { statCached, existsCached } from './statCache.mjs';

const CACHE_DIR = path.resolve('cache');
const CACHE_FILE = path.join(CACHE_DIR, '.esbuild-cache.json');
const LOCKFILE_PATH = path.resolve('package-lock.json');

/**
* Кеш для esbuild с сохранением на диск
* 
* Хранит:
*   - signature: хеш всех entry-файлов и их зависимостей
*   - outputs: список сгенерированных файлов
*   - timestamp: время последней сборки
*/
class EsbuildCache {
	constructor() {
		this.cache = this.loadCache();
	}

	// Загрузка кеша с диска
	loadCache() {
		if (!fs.existsSync(CACHE_FILE)) {
			return { entries: {}, meta: {} };
		}

		try {
			const data = fs.readFileSync(CACHE_FILE, 'utf8');
			return JSON.parse(data);
		} catch (err) {
			console.warn('[esbuild-cache] Ошибка чтения кеша, создаём новый');
			return { entries: {}, meta: {} };
		}
	}

	// Сохранение кеша на диск
	saveCache() {
		if (!fs.existsSync(CACHE_DIR)) {
			fs.mkdirSync(CACHE_DIR, { recursive: true });
		}

		fs.writeFileSync(CACHE_FILE, JSON.stringify(this.cache, null, 2), 'utf8');
	}

	// Вычисление хеша файла
	hashFile(filePath) {
		const stat = statCached(filePath);
		if (!stat) return 'missing';

		return crypto
			.createHash('md5')
			.update(`${filePath}:${stat.mtimeMs}:${stat.size}`)
			.digest('hex');
	}

	// Вычисление сигнатуры для entry-файла с учётом зависимостей
	computeEntrySignature(entryPath, dependencies = []) {
		const allFiles = [entryPath, ...dependencies];
		const hash = crypto.createHash('md5');

		for (const file of allFiles) {
			const fileHash = this.hashFile(file);
			hash.update(`${file}:${fileHash}`);
		}

		// Включаем lockfile для детекции npm install/update
		hash.update(`lockfile:${this.hashFile(LOCKFILE_PATH)}`);

		return hash.digest('hex');
	}

	// Проверка необходимости пересборки
	// Возвращает { needsBuild, signature } — signature переиспользуется в setBuildResult
	needsRebuild(entryName, entryPath, dependencies = []) {
		const signature = this.computeEntrySignature(entryPath, dependencies);
		const cached = this.cache.entries[entryName];

		if (!cached) {
			return { needsBuild: true, signature };
		}

		if (cached.signature !== signature) {
			return { needsBuild: true, signature };
		}

		// Проверка существования output-файлов
		if (cached.outputs && Array.isArray(cached.outputs)) {
			for (const outputFile of cached.outputs) {
				if (!existsCached(outputFile)) {
					return { needsBuild: true, signature };
				}
			}
		}

		return { needsBuild: false, signature };
	}

	// Сохранение результата сборки (signature уже вычислена в needsRebuild)
	setBuildResult(entryName, entryPath, signature, metafile) {
		const outputs = [];

		if (metafile && metafile.outputs) {
			for (const outputPath of Object.keys(metafile.outputs)) {
				outputs.push(path.resolve(outputPath));
			}
		}

		this.cache.entries[entryName] = {
			signature,
			outputs,
			timestamp: Date.now(),
			entryPath: path.resolve(entryPath)
		};

		this.saveCache();
	}

	// Удаление entry из кеша
	invalidateEntry(entryName) {
		if (this.cache.entries[entryName]) {
			delete this.cache.entries[entryName];
			this.saveCache();
		}
	}

	// Полная очистка кеша
	clear() {
		if (fs.existsSync(CACHE_FILE)) {
			fs.unlinkSync(CACHE_FILE);
		}
	}

	// Получить статистику кеша
	getStats() {
		const entries = Object.keys(this.cache.entries);
		const totalSize = entries.length;

		return {
			totalEntries: totalSize,
			entries: entries,
			lastUpdated: this.cache.meta.lastUpdated
		};
	}

	// Инвалидация устаревших записей (старше maxAge мс)/
	prune(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 дней по умолчанию
		const now = Date.now();
		let pruned = 0;

		for (const [name, data] of Object.entries(this.cache.entries)) {
			if (now - data.timestamp > maxAge) {
				delete this.cache.entries[name];
				pruned++;
			}
		}

		if (pruned > 0) {
			this.saveCache();
		}

		return pruned;
	}
}

// Singleton instance
let instance = null;

export function getEsbuildCache() {
	if (!instance) {
		instance = new EsbuildCache();
	}
	return instance;
}

export { EsbuildCache };