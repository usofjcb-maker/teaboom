# Teaboom Product Card

Тестовое задание для HTML-верстальщика / Frontend-верстальщика: карточка товара интернет-магазина Teaboom.ru на примере товара «Ананасовый улун».

## Что сделано

- верхняя часть карточки товара с изображением, названием, категорией, фасовками, артикулом, ценой и коротким описанием;
- переключение фасовки с обновлением цены, старой цены, артикула и активного состояния;
- интерактивный рейтинг со звездами;
- табы «описание», «свойства», «отзывы»;
- блок похожих и сопутствующих товаров на Swiper;
- адаптивная верстка для desktop, tablet и mobile;
- хедер и футер в стилистике Teaboom.ru.

## Стек

- HTML5
- Sass
- JavaScript
- Gulp
- esbuild
- Swiper
- Lenis

## Запуск

Установить зависимости:

```bash
npm install
```

Запустить режим разработки:

```bash
npm run dev
```

Собрать production-версию:

```bash
npm run build
```

Собранная страница появится в `assets/dist/`.

## Просмотр сборки

Сборку можно открыть напрямую в браузере:

```text
file:///J:/openserver21/OpenServer/domains/teaboom/assets/dist/index.html
```

Или через локальный сервер:

```bash
npm run preview
```

После этого открыть:

```text
http://localhost:5050
```

## Структура

```text
assets/src/index.html          Основная страница
assets/src/template/           Общие HTML-фрагменты
assets/src/styles/             Sass-стили
assets/src/js/                 JavaScript
assets/src/img/                Изображения и favicon
assets/src/fonts/              Шрифты
assets/dist/                   Production-сборка
gulp/                          Задачи сборки
```
