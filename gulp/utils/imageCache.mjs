import fs from 'fs';
import crypto from 'crypto';
import path from 'path';

export function getFileHash(file) {
	const buffer = fs.readFileSync(file);
	return crypto.createHash('md5').update(buffer).digest('hex');
}

export function loadImageCache(cachePath) {
	if (!fs.existsSync(cachePath)) return {};
	return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
}

export function saveImageCache(cachePath, cache) {
	fs.mkdirSync(path.dirname(cachePath), { recursive: true });
	fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
}