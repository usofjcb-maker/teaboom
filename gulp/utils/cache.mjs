import path from 'path';
import fs from 'fs';
import { logWithTime } from './logger.mjs';

function createCache(cacheFileName) {
    const cacheDir = path.resolve('cache');
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const cacheFile = path.resolve(cacheDir, cacheFileName);
    let buildCache = new Map();

    if (fs.existsSync(cacheFile)) {
        try {
            const data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
            buildCache = new Map(Object.entries(data));
        } catch (e) {
            logWithTime(`Ошибка чтения ${cacheFileName}, создаём новый`, 'yellow');
            buildCache = new Map();
        }
    }

    const saveCache = () => {
        fs.writeFileSync(cacheFile, JSON.stringify(Object.fromEntries(buildCache)), 'utf8');
    };

    return { buildCache, saveCache };
}

export { createCache }; 