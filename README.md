## 🎮 Game License Server for Unity

Game License Server — готовое решение для защиты Unity-игр через JWT-аутентификацию и систему лицензий.
Сервер написан на Node.js + Express + SQLite, имеет админ-панель и готовые скрипты для интеграции в Unity.

✨ Features

🔑 JWT Authentication — регистрация и вход пользователей

📅 License system — срок окончания лицензии (в днях/секундах)

🛡 Secure API — игра не запустится без валидного токена

👨‍💻 Admin panel — управление пользователями через веб-интерфейс

🎮 Unity SDK — готовые C#-скрипты для проверки лицензии

🗄 SQLite database — лёгкая и быстрая база

📂 Project Structure
game-license-server/
│── server.js        # основной сервер (Express + JWT + SQLite)
│── package.json     # зависимости
│── routes/          # роуты API (auth.js, users.js и др.)
│── frontend/        # админ-панель
│── unity-sdk/       # Unity-скрипты для интеграции
│── .gitignore
│── README.md
│── game.db          # база данных (в .gitignore)

## ⚙️ Installation

Установите зависимости:

npm install


Создайте файл .env:

JWT_SECRET=your_secret_key
PORT=5000


Запустите сервер:

npm start


По умолчанию сервер доступен по адресу:
👉 http://localhost:5000

## 🔌 API Endpoints
1. Auth

POST /login — вход в систему

📥 Request:

{
  "username": "testUser",
  "password": "123456"
}


📤 Response:

{
  "token": "jwt.token.here",
  "user": {
    "username": "testUser",
    "isAdmin": false
  }
}

2. Users

GET /users/me — получить информацию о текущем пользователе (по JWT)

🔑 Headers:

Authorization: Bearer <TOKEN>


📤 Response:

{
  "id": 9,
  "username": "testUser",
  "isAdmin": false,
  "licenseEndDate": 1756224974529,
  "licenseLeftSeconds": 84307,
  "licenseLeftDays": 1
}

🎮 Unity Integration

В папке unity-sdk/ есть примеры готовых скриптов.

🔑 Авторизация:

StartCoroutine(API.Login("testUser", "123456"));


## 📅 Проверка лицензии:

StartCoroutine(API.GetUserData(token));


👉 Если licenseLeftDays <= 0 — доступ к игре закрыт.

🛡 Security

Пароли хранятся в виде bcrypt-хэшей

.env и game.db находятся в .gitignore (не попадают в git)

API доступен только с валидным JWT-токеном

Unity клиент хранит токен в PlayerPrefs — повторный ввод не нужен

## 📌 Notes for Developers

Добавить нового пользователя → через админку или SQL-запрос

Для прода используйте только хэши паролей

Unity игрок вводит логин/пароль один раз — токен сохраняется

📋 Recommended .gitignore
node_modules/
.env
game.db
