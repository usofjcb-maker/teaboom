import 'parsleyjs';
import 'parsleyjs/dist/i18n/ru';
import $ from 'jquery';
window.jQuery = $;
window.$ = $;

window.Parsley.setLocale('ru');

export function initValidation() {
    console.log('Parsley validation inited');

    const forms = document.querySelectorAll('.f1');
    if (!forms.length) return;

    forms.forEach(form => {
        form.setAttribute('novalidate', true);
        const btn = form.querySelector('.submit_form_btn');

        const parsley = window.Parsley ? $(form).parsley({
            trigger: 'input blur change',
            errorsContainer(field) {
                return field.$element.closest('.input_field')[0];
            },
            classHandler(field) {
                return field.$element.closest('.input_field')[0];
            }
        }) : null;

        if (!parsley) return;

        // валидируем ТОЛЬКО поле при вводе
        form.querySelectorAll('input, textarea').forEach(el => {
            el.addEventListener('input', () => {
                const field = $(el).parsley();
                field?.validate();
            });
        });

        function toggleButton() {
            const ok = parsley.isValid();
            if (btn) {
                btn.classList.toggle('disabled', !ok);
                btn.disabled = !ok;
            }
        }

        parsley.on('field:validated', fieldInstance => {
            const wrapEl = fieldInstance.$element.closest('.input_field')[0];
            if (wrapEl) {
                wrapEl.classList.toggle('completed', fieldInstance.isValid());
            }
            toggleButton();
        });

        parsley.on('form:validated', toggleButton);

        // старт
        toggleButton();
    });
}

export function initFileUpload(containerClass) {
    const containers = document.querySelectorAll(`.${containerClass}`);
    if (!containers.length) return;

    containers.forEach(container => {
        const ul = container.querySelector('.list_dwn');
        const dropZone = container.querySelector('.drop');
        const fileInput = container.querySelector('.file_upload');
        const downloadBtn = container.querySelector('.dwn');
        const errorMessage = container.querySelector('.error-message');
        const previewContainer = container.querySelector('.images_preview');

        if (!ul || !dropZone || !fileInput || !downloadBtn) return;

        let fileCount = 0;

        const allowedTypes = new RegExp(container.dataset.allowed || '', 'i');
        const maxSize = parseInt(container.dataset.maxsize) || 10 * 1024 * 1024;
        const minSize = parseInt(container.dataset.minsize) || 0;
        const maxFiles = parseInt(container.dataset.maxfiles) || 20;
        const maxFilenameLength = parseInt(container.dataset.maxnamelength) || 50;

        const formatFileSize = (bytes) => {
            if (bytes >= 1e9) return (bytes / 1e9).toFixed(2) + ' GB';
            if (bytes >= 1e6) return (bytes / 1e6).toFixed(2) + ' MB';
            return (bytes / 1e3).toFixed(2) + ' KB';
        };

        const updateDownloadButton = () => {
            if (downloadBtn) downloadBtn.classList.toggle('hd', fileCount >= maxFiles);
        };

        downloadBtn.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            handleFile(file);
            fileInput.value = ''; // сброс input
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            if (e.dataTransfer?.files.length) handleFile(e.dataTransfer.files[0]);
        });
        dropZone.addEventListener('dragover', (e) => e.preventDefault());

        function handleFile(file) {
            if (!file) return;

            if (!allowedTypes.test(file.name)) {
                if (errorMessage) {
                    errorMessage.textContent = 'Неподходящий файл: неверный формат.';
                    errorMessage.style.display = 'block';
                }
                return;
            }

            if (file.size > maxSize) {
                if (errorMessage) {
                    errorMessage.textContent = `Файл слишком большой. Максимальный размер: ${formatFileSize(maxSize)}.`;
                    errorMessage.style.display = 'block';
                }
                return;
            }

            if (file.size < minSize) {
                if (errorMessage) {
                    errorMessage.textContent = `Файл слишком маленький. Минимальный размер: ${formatFileSize(minSize)}.`;
                    errorMessage.style.display = 'block';
                }
                return;
            }

            if (fileCount >= maxFiles) {
                alert('Достигнуто максимальное количество загруженных файлов.');
                return;
            }

            const fullFilename = file.name;
            const filename = fullFilename.length > maxFilenameLength
                ? fullFilename.slice(0, maxFilenameLength) + '...'
                : fullFilename;

            const li = document.createElement('li');
            li.className = 'working';
            li.dataset.name = fullFilename;
            li.innerHTML = `<p>${filename} <i>(${formatFileSize(file.size)})</i></p><span class="delete_item"></span>`;

            ul.appendChild(li);

            /* preview */

            if (previewContainer && file.type.startsWith('image/')) {
                const reader = new FileReader();

                reader.onload = (e) => {
                    const imgDiv = document.createElement('div');
                    imgDiv.className = 'image_item';
                    imgDiv.dataset.name = fullFilename;
                    imgDiv.innerHTML = `<img src="${e.target.result}" alt=""><span class="delete_item"></span>`;

                    previewContainer.appendChild(imgDiv);

                    imgDiv.querySelector('.delete_item').addEventListener('click', () => {
                        li.remove();
                        imgDiv.remove();
                        fileCount--;
                        updateDownloadButton();
                    });
                };

                reader.readAsDataURL(file);
            }

            /* delete */

            li.querySelector('.delete_item').addEventListener('click', () => {
                li.remove();

                if (previewContainer) {
                    const preview = previewContainer.querySelector(`.image_item[data-name="${fullFilename}"]`);
                    if (preview) preview.remove();
                }

                fileCount--;
                updateDownloadButton();
            });

            /* upload */

            const url = fileInput.dataset.url;

            if (url && url !== '#') {
                const formData = new FormData();
                formData.append('files[]', file);

                fetch(url, {
                    method: 'POST',
                    body: formData
                })
                .then(res => res.text())
                .then(res => {
                    li.classList.remove('working');
                    console.log('uploaded:', res);
                })
                .catch(err => {
                    li.classList.add('error');
                    console.error('upload error:', err);
                });
            }

            fileCount++;
            updateDownloadButton();
            if (errorMessage) errorMessage.style.display = 'none';
        }
    });
}