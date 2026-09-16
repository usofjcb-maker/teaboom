import fs from 'fs';

export const fileExists = (filePath) => {
	try {
		return fs.existsSync(filePath);
	} catch (err) {
		return false;
	}
};