import initCssVarsFromDom from '../utils/cssVarsFromDom.js';
import cssVarsConfig from './cssVars.config';

export default async function initLayout() {
	initCssVarsFromDom(cssVarsConfig);
}