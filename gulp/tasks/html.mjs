import gulp from 'gulp';
import rigger from 'gulp-include';
import nunjucksRender from 'gulp-nunjucks-render';
import fs from 'fs';
import path from 'path';
import { paths, isBuild, isDev, browserSync } from '../config.mjs';

export function loadManifest() {
	if (!isBuild) return {};

	try {
		const manifestPath = path.join(paths.buildJs, "manifest.json");
		if (fs.existsSync(manifestPath)) {
			return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
		}
	} catch (err) {
		console.warn("Ошибка чтения manifest.json:", err);
	}

	return {};
}

export function getNunjucksConfig() {
	const manifest = loadManifest();

	return {
		path: ["./assets/src/template/views"],
		envOptions: { autoescape: false },

		manageEnv: (env) => {
			env.addFilter("split", (str, delimiter) => str.split(delimiter));

			env.addGlobal("manifest", manifest);

			if (isBuild) {
				env.addFilter("asset", (key) => {
					if (!manifest[key]) {
						throw new Error(`❌ Missing asset in manifest: ${key}`);
					}
					return manifest[key];
				});
			}

			env.addGlobal("isDev", isDev);
			env.addGlobal("isBuild", isBuild);
		}
	};
}

export function compileHtml(src = paths.srcHtml) {
	return gulp
		.src(src)
		.pipe(rigger())
		.pipe(nunjucksRender(getNunjucksConfig()))
		.pipe(gulp.dest(paths.buildHtml))
		.pipe(browserSync.reload({ stream: true }));
}