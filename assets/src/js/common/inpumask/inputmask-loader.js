let promise = null;

export function loadInputmask() {
	if (!promise) {
		promise = import('./inputmask.js');
	}
	return promise;
}
