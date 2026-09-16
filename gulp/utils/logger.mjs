import chalk from 'chalk';

// Функция для логирования с временем и цветом
const logWithTime = (message, color = 'green') => {
	const time = new Date().toLocaleTimeString('ru-RU', { hour12: false });
	const formattedMessage = `[${time}] ${message}`;

	if (chalk[color]) {
		console.log(chalk[color](formattedMessage)); // переданный цвет, если он есть
	} else {
		console.log(formattedMessage); // Если цвет не найден - вывод без раскраски
	}
};

// Пример вызова логов
// logWithTime('Процесс сборки начат', 'green');

export { logWithTime };