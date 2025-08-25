# 🎮 Game License Server for Unity

**Game License Server** — это готовое решение для защиты Unity-игр через JWT-аутентификацию и систему лицензий.  
Сервер написан на **Node.js + Express + SQLite**, поддерживает **админ-панель** и имеет готовые скрипты для интеграции в Unity.  

---

## ✨ Features

- 🔑 **JWT Authentication** (логин / регистрация)
- 📅 **License system** (срок окончания, дни/секунды до конца)
- 🛡 **Secure API** — без валидного токена игра не запускается
- 👨‍💻 **Admin panel** — управление пользователями через веб-интерфейс
- 🎮 **Unity SDK** — готовые C#-скрипты для проверки лицензии
- 🗄 **SQLite database** — лёгкая база без лишних зависимостей

---

## 📂 Project Structure

game-license-server/
├── server.js
├── package.json
├── .gitignore
├── README.md
├── .env
├── game.db
├── db/
│   └── db.js          # подключение к SQLite
├── middleware/
│   ├── auth.js        # проверка токена JWT
│   └── requireAdmin.js # проверка роли админа
├── models/
│   └── User.js        # модель пользователя (связь с БД)
├── routes/
│   ├── auth.js        # регистрация, вход, обновление токенов
│   ├── users.js       # управление пользователями (админка)
│   └── licenses.js    # работа с лицензиями (активация, проверка)
├── utils/
│   ├── generateTokens.js  # генерация JWT токенов
│   └── addUser.js         # утилита для добавления пользователей
├── frontend/          # админ-панель (например, Vite + React)
│   ├── index.html
│   ├── src/
│   └── vite.config.js
└── unity-sdk/         # скрипты для Unity (C#)
    ├── LicenseChecker.cs
    └── NetworkManager.cs



---

## ⚙️ Installation

Установи зависимости:

```bash
npm install

JWT_SECRET=your_secret_key
PORT=3000

npm start

По умолчанию сервер доступен на http://localhost:3000


🔌 API Endpoints
1. Auth

POST /auth/login — вход в систему

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
  "username": "testLuna",
  "isAdmin": false,
  "licenseEndDate": 1756224974529,
  "licenseLeftSeconds": 84307,
  "licenseLeftDays": 1
}

🎮 Unity Integration

В unity-sdk/ есть примеры готовых скриптов.

🔑 Авторизация (Login)
StartCoroutine(API.Login("testUser", "123456"));

📅 Проверка лицензии
StartCoroutine(API.GetUserData(token));


👉 Если licenseLeftDays <= 0 — доступ к игре закрыт.

🛡 Security

Пароли хранятся в виде bcrypt-хэшей

.env и game.db находятся в .gitignore (не попадают в git)

API доступен только с валидным JWT-токеном

Unity клиент хранит токен в PlayerPrefs, повторный ввод не нужен

📌 Notes for Developers

Добавить нового пользователя → через админку или SQL-запрос

Для прода используйте только хэши паролей

Unity игрок не вводит логин/пароль каждый раз — токен сохраняется

📋 .gitignore (рекомендуется)
node_modules/
.env
game.db
