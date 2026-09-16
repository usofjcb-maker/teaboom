import { Client } from 'basic-ftp';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import minimist from 'minimist';
import { __dirname, ftpConfig, localBuildDir, remoteBasePath, baseLink, winScp } from '../config.mjs';

// ARGS
const args = minimist(process.argv.slice(2));
const isNewVersion = args['new-v'];
const specificVersion = args['ver'];

// PATHS
const rootDir = path.resolve(__dirname, '..');
const buildDir = path.join(rootDir, 'assets', localBuildDir);
const winscpPath = winScp;

const winScpScript = ({ ftp, localDir, remoteDir }) => `
option confirm off
option batch abort

open ftp://${ftp.user}:${ftp.password}@${ftp.host}

pwd
ls

option batch continue
mkdir "${remoteDir}"
option batch abort

cd "${remoteDir}"
lcd "${localDir}"

rm *.html
put *.html

synchronize remote "${localDir}" "${remoteDir}" -mirror -criteria=size -transfer=binary -filemask="|*.html"

exit
`;

// HTML LINKS LOGGER
function writeDeployLinks(version) {
	const htmlFiles = [];

	function walk(dir, rel = '') {
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const full = path.join(dir, entry.name);
			const relative = path.join(rel, entry.name);

			if (entry.isDirectory()) walk(full, relative);
			else if (entry.name.endsWith('.html')) {
				htmlFiles.push(relative.replace(/\\/g, '/'));
			}
		}
	}

	walk(buildDir);
	if (!htmlFiles.length) return;

	const links = htmlFiles.map(f => `${baseLink}/${version}/${f}`);
	const logDir = path.resolve(__dirname, 'deploy-logs');
	fs.mkdirSync(logDir, { recursive: true });

	const logFile = path.join(logDir, `deploy-links-${version}.txt`);
	fs.writeFileSync(logFile, links.join('\n'), 'utf8');

	console.log('\n🔗 Published pages:\n' + links.join('\n'));
	console.log(`📄 Saved to: ${logFile}\n`);
}

// VERSION
async function getNextVersionFTP() {
	const client = new Client();
	await client.access(ftpConfig);

	const list = await client.list(remoteBasePath);
	const versions = list
		.map(i => i.name)
		.filter(n => /^v\d+$/.test(n))
		.map(v => parseInt(v.slice(1), 10))
		.sort((a, b) => b - a);

	client.close();
	return `v${versions.length ? versions[0] + 1 : 1}`;
}

// DEPLOY VIA WINSCP
function deployViaWinSCP(version, cb) {
	console.log('🚀 Using WinSCP (fast sync)');

	const remotePath = `${remoteBasePath}/${version}`;

	const script = winScpScript({
		ftp: ftpConfig,
		localDir: buildDir.replace(/\\/g, '/'),
		remoteDir: remotePath
	});

	const tmp = path.resolve(__dirname, '../.winscp-tmp.txt');
	fs.writeFileSync(tmp, script);

	const proc = spawn(
		`"${winscpPath}"`,
		[`/script="${tmp}"`],
		{ stdio: 'inherit', shell: true }
	);

	proc.on('close', code => {
		fs.unlinkSync(tmp);
		if (code !== 0) {
			cb(new Error('❌ WinSCP deploy failed'));
		} else {
			cb();
		}
	});
}

// DEPLOY VIA BASIC-FTP
async function deployViaBasicFTP(version) {
	console.log('📦 Using basic-ftp (fallback)');

	const remotePath = `${remoteBasePath}/${version}`;
	const client = new Client();
	client.ftp.verbose = false;

	try {
		await client.access({ ...ftpConfig, secure: false });
		await client.ensureDir(remotePath);
		await client.clearWorkingDir();
		await client.uploadFromDir(buildDir);
	} finally {
		client.close();
	}
}

// MAIN DEPLOY TASK
export async function deployTask(cb) {
	const version = specificVersion || (
		isNewVersion
			? await getNextVersionFTP()
			: 'v1'
	);

	console.log(`📦 Deploy to: ${remoteBasePath}/${version}`);

	const canUseWinSCP = fs.existsSync(winscpPath);

	if (canUseWinSCP) {
		deployViaWinSCP(version, err => {
			if (err) return cb(err);
			writeDeployLinks(version);
			console.log('✅ Deploy complete');
			cb();
		});
	} else {
		console.log('⚠ WinSCP not found → fallback to basic-ftp');
		try {
			await deployViaBasicFTP(version);
			writeDeployLinks(version);
			console.log('✅ Deploy complete');
			cb();
		} catch (e) {
			cb(e);
		}
	}
}