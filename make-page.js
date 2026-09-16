import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

function toCamelCase(str) {
	return str
		.split('-')
		.map((part, i) =>
			i === 0 ? part : part[0].toUpperCase() + part.slice(1)
		)
		.join('');
}

function toPascalCase(str) {
	const camel = toCamelCase(str);
	return camel.charAt(0).toUpperCase() + camel.slice(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pageNames = process.argv.slice(2);

if (pageNames.length === 0) {
	console.error('Specify a page name: npm run make-page my-page [another-page]');
	process.exit(1);
}

const base = path.join(__dirname, 'assets/src');
const tplDir = path.join(__dirname, 'make-page-templates');

function createPage(pageName) {
	if (!/^[a-z][a-z0-9-]*$/.test(pageName)) {
		console.error('Page name must be kebab-case, for example: catalog-detail');
		process.exit(1);
	}

	const pageKey = toCamelCase(pageName);
	const PageKey = toPascalCase(pageName);

	const files = {
		[`js/pages/${pageName}.js`]: 'page.js.tpl',
		[`js/lib/animations/pages-anim/${pageName}-anim.js`]: 'page-anim.js.tpl',
		[`js/events/${pageName}-events.js`]: 'page-events.js.tpl',
		[`styles/${pageName}/${pageName}.sass`]: 'page.sass.tpl',
		[`styles/${pageName}/${pageName}-styles.sass`]: 'page-styles.sass.tpl',
		[`template/head-${pageName}.html`]: 'head.html.tpl',
		[`${pageName}.html`]: 'page.html.tpl'
	};

	for (const [relPath, tplFile] of Object.entries(files)) {
		const fullPath = path.join(base, relPath);
		const dir = path.dirname(fullPath);

		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}

		if (!fs.existsSync(fullPath)) {
			const tplPath = path.join(tplDir, tplFile);

			if (!fs.existsSync(tplPath)) {
				console.error(`Template not found: ${tplPath}`);
				continue;
			}

			const content = fs
				.readFileSync(tplPath, 'utf8')
				.replace(/\$\{pageName\}/g, pageName)
				.replace(/\$\{pageKey\}/g, pageKey)
				.replace(/\$\{PageKey\}/g, PageKey);

			fs.writeFileSync(fullPath, content, 'utf8');
			console.log(`Created: ${relPath}`);
		} else {
			console.log(`Already exists: ${relPath}`);
		}
	}
}

for (const name of pageNames) {
	createPage(name);
}
