import Inputmask from 'inputmask';

export async function initInputmask() {
	if (!window.Inputmask && typeof Inputmask === 'function') {
		window.Inputmask = Inputmask;
	}

	const IM = window.Inputmask;

	if (!IM) {
		console.error('Inputmask не найден');
		return;
	}

	// console.log('initInputmask called');
	// console.log('phone:', document.querySelectorAll('input.phone').length);
	// console.log('email:', document.querySelectorAll('input.email').length);
	
	// phone
	document.querySelectorAll('input.phone').forEach((el) => {
		new IM({
			mask: '+7 (999) 999-99-99',
			showMaskOnHover: false,
			showMaskOnFocus: false
		}).mask(el);
	});

	// email
	document.querySelectorAll('input.email').forEach((el) => {
		new IM({
			showMaskOnHover: false,
			showMaskOnFocus: false,
			mask: '*{1,64}[.*{1,64}][.*{1,64}][.*{1,63}]@-{1,63}.-{1,63}[.-{1,63}][.-{1,63}]',
			greedy: false,
			onBeforePaste: (pastedValue) => pastedValue.toLowerCase().replace('mailto:', ''),
			definitions: {
				'*': { validator: "[0-9A-Za-z!#$%&'*+/=?^_`{|}~\\-]", cardinality: 1, casing: 'lower' },
				'-': { validator: '[0-9A-Za-z-]', cardinality: 1, casing: 'lower' }
			}
		}).mask(el);
	});
}
