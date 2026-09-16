let fancyboxPromise = null;

export function loadFancybox() {
	if (!fancyboxPromise) {
		fancyboxPromise = import('./fancybox.js');
	}
	return fancyboxPromise;
}