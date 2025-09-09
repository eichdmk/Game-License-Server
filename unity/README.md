📖 Интеграция Unity + Node.js Backend (SQLite)
🔧 Общая логика

Unity-клиент взаимодействует с сервером через HTTP-API:

/login — вход по логину и паролю, возвращает токен (JWT).

/users/me — проверка лицензии и получение информации о пользователе.

Токен хранится в ApiClient и автоматически добавляется во все запросы.
После успешного входа — переход в арену, если лицензия активна.

📂 Структура файлов в Unity
Assets/
 └── Scripts/
      └── Backend/
           ├── ApiClient.cs       // общий клиент API
           ├── LoginManager.cs    // логика входа
           ├── GameManager.cs     // проверка лицензии

📌 Скрипты
1. ApiClient.cs

Синглтон, живёт между сценами (DontDestroyOnLoad).

Содержит базовый URL (http://ip-сервера:3000).

Методы:

Post(endpoint, json, callback) — POST-запрос.

Get(endpoint, callback) — GET-запрос.

Автоматически подставляет Authorization: Bearer <token>.

Что нужно настроить: заменить http://localhost:3000 на реальный IP/домен сервера.

2. LoginManager.cs

Скрипт висит на LoginScene.

UI:

TMP_InputField usernameField

TMP_InputField passwordField

TMP_Text resultText

При нажатии кнопки Войти вызывает /login.

Если успешный вход:

сохраняет токен в ApiClient.

загружает сцену ArenaLoaderScene.

Если ошибка — пишет сообщение пользователю.

3. GameManager.cs

Скрипт висит на ArenaLoaderScene.

Сразу после старта вызывает /users/me.

Проверяет licenseLeftSeconds:

0 → лицензия активна → грузим ArenaScene.

0 или меньше → лицензия кончилась → возвращаем в LoginScene.

🎮 Сцены

LoginScene

UI для авторизации.

Поля логина/пароля + кнопка "Войти".

Скрипт LoginManager.

ArenaLoaderScene

Сцена-посредник.

Скрипт GameManager проверяет лицензию.

ArenaScene

Твоя VR-арена.

Загружается только если лицензия активна.

🔄 Поток работы

Пользователь открывает игру → LoginScene.

Вводит логин/пароль → /login.

Сервер возвращает:

{
  "token": "JWT...",
  "user": { "username": "testLuna", "isAdmin": 0 }
}


→ Unity сохраняет токен.

Переход в ArenaLoaderScene.

Unity вызывает /users/me.

Сервер возвращает:

{
  "id": 9,
  "username": "testLuna",
  "isAdmin": false,
  "licenseEndDate": 1756224974529,
  "licenseLeftSeconds": 84307,
  "licenseLeftDays": 1
}


→ Если licenseLeftSeconds > 0 → грузим арену.
→ Если нет → возвращаем в LoginScene.

Важно для разработчика

Все сетевые запросы идут через UnityWebRequest.

Нужно подключить TextMeshPro для UI (usernameField, passwordField, resultText).

Сервер должен быть доступен из локальной сети или через интернет (порты не должны быть закрыты).

В билде для Oculus/VRChat нужно убедиться, что разрешены сетевые запросы к твоему IP/домену.


🔄 Сценарий работы

LoginScene — UI с полями ввода (TMP_InputField usernameField, passwordField) и кнопкой "Войти" → скрипт LoginManager.

После успешного входа → загрузка ArenaLoaderScene.

В ArenaLoaderScene висит GameManager, он обращается к /users/me.

Если лицензия ещё активна → грузим ArenaScene (твоя VR-арена).

Если истекла → возвращаем в LoginScene.



🔑 Как работает сохранение входа

При первом входе пользователь вводит логин и пароль → сервер возвращает JWT-токен.

Unity сохраняет этот токен локально (например, через PlayerPrefs.SetString("token", ...)).

При следующих запусках:

Unity проверяет, есть ли сохранённый токен.

Если он есть → сразу вызывает /users/me с этим токеном.

Если сервер подтверждает, что токен валидный и лицензия активна → сразу грузится арена.

Если токен просрочен/невалиден → игрока кидает обратно в LoginScene, где он заново вводит логин и пароль.