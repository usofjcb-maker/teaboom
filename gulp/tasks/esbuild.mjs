import { browserSync, isBuild, isDev, paths } from "../config.mjs";

import esbuild from "esbuild";
import fs from "fs";
import { getEsbuildCache } from "../utils/esbuildCache.mjs";
import { statCached } from "../utils/statCache.mjs";
import { logWithTime } from "../utils/logger.mjs";
import path from "path";
import { performance } from "perf_hooks";
import { sassPlugin } from "esbuild-sass-plugin";

const modulesDir = path.resolve("./assets/src/js/pages");
const esbuildCache = getEsbuildCache();
const depsCache = new Map();

let contexts = new Map();
let lastEntrySignature = "";

// utils

// Быстрая проверка зависимостей без полного парсинга
function getJsDependenciesFast(entryPath) {
	const dependencies = [entryPath];
	const visited = new Set();
	const queue = [entryPath];

	while (queue.length > 0) {
		const current = queue.shift();
		if (visited.has(current)) continue;
		visited.add(current);

		try {
			const content = fs.readFileSync(current, 'utf8');
			const dir = path.dirname(current);

			// Поиск импортов: import ... from '...'
			const importRegex = /import\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g;
			let match;

			while ((match = importRegex.exec(content)) !== null) {
				const importPath = match[1];

				// Пропускаем node_modules и внешние зависимости
				if (importPath.startsWith('.') || importPath.startsWith('/')) {
					let resolved = path.resolve(dir, importPath);

					// Добавляем расширение если нет
					if (!resolved.endsWith('.js')) {
						if (fs.existsSync(`${resolved}.js`)) {
							resolved = `${resolved}.js`;
						} else if (fs.existsSync(path.join(resolved, 'index.js'))) {
							resolved = path.join(resolved, 'index.js');
						}
					}

					if (fs.existsSync(resolved) && !visited.has(resolved)) {
						dependencies.push(resolved);
						queue.push(resolved);
					}
				}
			}
		} catch {
			// Игнорируем ошибки чтения
		}
	}

	return dependencies;
}

function getJsDependenciesCached(entryPath) {
	const cached = depsCache.get(entryPath);

	if (cached) {
		// Проверяем все файлы в дереве зависимостей, не только entry
		let valid = true;
		for (const dep of cached.deps) {
			const stat = statCached(dep);
			if (!stat) {
				valid = false;
				break;
			}
			const sig = `${stat.mtimeMs}:${stat.size}`;
			if (cached.signatures.get(dep) !== sig) {
				valid = false;
				break;
			}
		}
		if (valid) return cached.deps;
	}

	const deps = getJsDependenciesFast(entryPath);

	// Сохраняем сигнатуры ВСЕХ зависимостей для валидации
	const signatures = new Map();
	for (const dep of deps) {
		const stat = statCached(dep);
		if (stat) {
			signatures.set(dep, `${stat.mtimeMs}:${stat.size}`);
		} else {
			signatures.set(dep, 'missing');
		}
	}

	depsCache.set(entryPath, { deps, signatures });

	return deps;
}

function rebuildTimer(entryName) {
	let t0 = 0;

	return {
		name: "rebuild-timer",
		setup(build) {
			build.onStart(() => {
				if (!isDev) return;
				t0 = performance.now();
			});

			build.onEnd(() => {
				if (!isDev) return;
				const t1 = performance.now();
				console.log(`⏱ ${entryName} rebuild ${(t1 - t0).toFixed(1)} ms`);
			});
		}
	};
}

function getEntryPoints() {
	if (!fs.existsSync(modulesDir)) return {};

	const files = fs.readdirSync(modulesDir)
		.filter(f => f.endsWith(".js"))
		.sort();

	const entries = {};
	for (const file of files) {
		const name = path.basename(file, ".js");
		entries[name] = path.join(modulesDir, file);
	}
	return entries;
}

// сигнатура entry-файлов (чтобы понять, что они изменились)
function getEntrySignature(entries) {
	return Object.keys(entries).sort().join("|");
}

// manifest
function updateManifest(metafile, entryPoints) {
	const manifestPath = path.join(paths.buildJs, "manifest.json");
	let prev = {};
	if (fs.existsSync(manifestPath)) {
		try {
			prev = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
		} catch (err) {
			logWithTime(`manifest.json повреждён, создаём новый: ${err.message}`, 'yellow');
		}
	}

	const next = { ...prev };

	const entryPaths = new Set(Object.values(entryPoints));

	for (const [outPath, info] of Object.entries(metafile.outputs)) {
		if (!info.entryPoint) continue;

		if (!entryPaths.has(path.resolve(info.entryPoint))) continue;

		const base = path.basename(info.entryPoint, ".js");
		next[`js/${base}-bundle.js`] = "js/" + path.basename(outPath);
	}

	const json = JSON.stringify(next, null, 2);
	if (!fs.existsSync(manifestPath) || fs.readFileSync(manifestPath, "utf8") !== json) {
		fs.writeFileSync(manifestPath, json);
	}
}

// config
function getConfig(entryPoints, entryName = "bundle") {
	return {
		entryPoints,
		bundle: true,
		format: "esm",
		target: "es2020",
		outdir: path.resolve(paths.buildJs),
		splitting: isBuild,
		minify: isBuild,
		sourcemap: !isBuild,
		treeShaking: isBuild,
		entryNames: isBuild ? "[name]-bundle-[hash]" : "[name]-bundle",
		chunkNames: isBuild ? "chunks/[name]-[hash]" : "chunks/[name]",
		assetNames: isBuild ? "assets/[name]-[hash]" : "assets/[name]",
		define: {
			PROJECT_DIST: JSON.stringify(isBuild ? (process.env.PROJECT_DIST || '/') : '/'),
		},
		plugins: [
			sassPlugin({ type: "style", sourceMap: !isBuild }),
			rebuildTimer(entryName),
			{
				name: "dev-logger",
				setup(build) {
					build.onEnd(() => {
						if (!isDev) return;
						browserSync.reload();
					});
				}
			}
		],
		loader: {
			".js": "js",
			".css": "css",
			".png": "file",
			".jpg": "file",
			".svg": "file",
			".gif": "file",
		},
		drop: isBuild ? ["debugger"] : [],
		pure: isBuild ? ["console.log", "console.info", "console.warn"] : [],
		logLevel: "warning",
		metafile: isBuild
	};
}

// main
const bundleModules = async () => {
	const entryPoints = getEntryPoints();
	if (!Object.keys(entryPoints).length) return;

	const signature = getEntrySignature(entryPoints);

	if (isDev) {
		if (signature !== lastEntrySignature) {
			depsCache.clear();
			// Безопасная очистка контекстов с обработкой ошибок
			for (const ctx of contexts.values()) {
				try {
					await ctx.dispose();
				} catch (e) {
					console.warn('Failed to dispose esbuild context:', e.message);
				}
			}
			contexts.clear();

			const entries = Object.entries(entryPoints);

			const ctxList = await Promise.all(
				entries.map(([name, entryPath]) =>
					esbuild.context(
						getConfig({ [name]: entryPath }, name)
					).then(async (ctx) => {
						await ctx.watch();
						return { name, ctx };
					})
				)
			);

			ctxList.forEach(({ name, ctx }) => {
				contexts.set(name, ctx);
			});

			lastEntrySignature = signature;
			logWithTime("esbuild per-entry watch started", "cyan");
		}

		return;
	}

	// PROD: Проверка кеша перед сборкой
	logWithTime("Checking esbuild cache...", "cyan");

	const entriesToBuild = {};
	const entriesCached = [];
	const signatureMap = new Map();

	for (const [name, entryPath] of Object.entries(entryPoints)) {
		// Быстрое получение зависимостей
		const dependencies = getJsDependenciesCached(entryPath);

		const { needsBuild, signature } = esbuildCache.needsRebuild(name, entryPath, dependencies);

		if (needsBuild) {
			entriesToBuild[name] = entryPath;
			signatureMap.set(name, signature);
			logWithTime(`  ${name}: requires rebuild`, "yellow");
		} else {
			entriesCached.push(name);
			logWithTime(`  ${name}: cached ✓`, "green");
		}
	}

	if (entriesCached.length > 0) {
		logWithTime(`Skipped ${entriesCached.length} cached entries: ${entriesCached.join(', ')}`, "green");
	}

	// Если все закешировано - пропускаем сборку
	if (Object.keys(entriesToBuild).length === 0) {
		logWithTime("All entries cached, skipping build", "green");
		return;
	}

	logWithTime(`Building ${Object.keys(entriesToBuild).length} entries...`, "cyan");

	const result = await esbuild.build(getConfig(entriesToBuild));

	if (result.metafile) {
		updateManifest(result.metafile, entriesToBuild);

		// Сохранение результатов в кеш (signature уже вычислена)
		for (const [name, entryPath] of Object.entries(entriesToBuild)) {
			esbuildCache.setBuildResult(name, entryPath, signatureMap.get(name), result.metafile);
		}
	}

	logWithTime("ESM modules built (prod)", "green");
};

// Принудительная пересборка с инвалидацией кеша
const bundleModulesForce = async () => {
	esbuildCache.clear();
	logWithTime("esbuild cache cleared", "green");
	await bundleModules();
};

// Безопасная очистка всех esbuild контекстов (для graceful shutdown)
async function disposeAllContexts() {
	for (const ctx of contexts.values()) {
		try {
			await ctx.dispose();
		} catch (e) {
			console.warn('Failed to dispose esbuild context:', e.message);
		}
	}
	contexts.clear();
}

export { bundleModules, bundleModulesForce, disposeAllContexts };
