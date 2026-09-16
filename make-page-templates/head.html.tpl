<!DOCTYPE html>
<html lang="ru">
<head>
	<meta charset="UTF-8" />
	<title>${PageKey} | Static Site Starter</title>

	<link rel="preload" as="font" crossorigin type="font/woff2" href="fonts/Forum/Forum-Regular.woff2">

	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
	<meta name="description" content="${PageKey} page" />
	<meta name="format-detection" content="telephone=no" />
	<meta name="theme-color" content="#ffffff" />

	<link rel="icon" type="image/png" href="img/favicon/favicon-96x96.png" sizes="96x96" />
	<link rel="icon" type="image/svg+xml" href="img/favicon/favicon.svg" />
	<link rel="shortcut icon" href="img/favicon/favicon.ico" />
	<link rel="apple-touch-icon" sizes="180x180" href="img/favicon/apple-touch-icon.png" />
	<link rel="manifest" href="img/favicon/site.webmanifest" />

	<meta property="og:locale" content="ru" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content="${PageKey} | Static Site Starter" />
	<meta property="og:description" content="${PageKey} page" />

	<link rel="stylesheet" href="css/header.min.css?v=163426"/>
	<link rel="stylesheet" href="css/${pageName}.min.css?v=163426"/>
	<link rel="stylesheet" href="css/footer.min.css?v=163426"/>

	{% if isBuild %}
	<script type="module" src="{{ 'js/${pageName}-bundle.js' | asset }}"></script>
	{% else %}
	<script type="module" src="js/${pageName}-bundle.js"></script>
	{% endif %}
</head>
