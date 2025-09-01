# 🎮 Game License Server for Unity

> Простое, безопасное и готовое решение для защиты Unity-игр через **JWT-аутентификацию** и систему лицензий.  
> Поддерживает **админ-панель**, **Unity SDK**, работу с **SQLite** и возможность масштабирования на **PostgreSQL / MySQL**.

![License](https://img.shields.io/badge/License-MIT-blue)
![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green)
![SQLite](https://img.shields.io/badge/Database-SQLite-lightblue)
![Unity](https://img.shields.io/badge/Unity-SDK-ready-orange)
![Status](https://img.shields.io/badge/Status-Active-success)

---

## ✨ Возможности

- 🔑 **JWT Authentication** — регистрация, авторизация, выдача токенов.
- 📅 **Система лицензий** — срок действия в днях и секундах.
- 🛡 **Secure API** — игра не запустится без валидного токена.
- 👨‍💻 **Админ-панель** — управление пользователями и лицензиями.
- 🎮 **Unity SDK** — готовые C#-скрипты для интеграции.
- 🔌 **Офлайн-проверка лицензий** — игра может работать без интернета.
- 🗄 **SQLite** по умолчанию, поддержка **PostgreSQL** и **MySQL**.
- 🚀 Готово к продакшену и масштабированию.

---

## 📂 Структура проекта
```py
game-license-server/
├── server.js # Основной Express-сервер
├── package.json # Зависимости и скрипты
├── routes/ # API роуты (auth.js, users.js, licenses.js)
├── frontend/ # Админ-панель
├── unity-sdk/ # Unity C# SDK для интеграции
├── models/ # Модели пользователей и лицензий
├── config/ # Конфигурация базы данных и .env
├── .gitignore
└── README.md
```

---

## ⚙️ Установка и запуск

### 1. Клонируем репозиторий
```bash
git clone https://github.com/eichdmk/Game-License-Server.git
cd Game-License-Server

2. Устанавливаем зависимости
npm install

3. Создаём файл .env
JWT_SECRET=your_secret_key
PORT=5000


4. Запускаем сервер
node server.js


По умолчанию сервер будет доступен по адресу:
http://localhost:5000


```
## 🔌 API Endpoints

### 1. Аутентификация

POST /login — вход в систему.

📥 Пример запроса:
```json
{
  "username": "testUser",
  "password": "123456"
}
```
📤 Ответ:
```json
{
    "token": "jwt.token.here",
    "user": {
        "firstName": "testUser",
        "lastName": "TestUSer",
        "email": "test1@test.ru",
        "phone": "test",
        "isAdmin": false,
        "licenseLeftDays": 10
    },
    "offlineLicense": {
        "userId": 3,
        "email": "test1@test.ru",
        "licenseEndDate": 1757529873334,
        "issuedAt": 1756748121035
    },
    "licenseSignature": ""

}
```
### 2. Получение данных пользователя

GET /users/me

🔑 Заголовок:
```makefile
Authorization: Bearer <TOKEN>
```

## 📴 Офлайн-проверка лицензий

Game License Server поддерживает офлайн-режим.
Когда клиент впервые логинится, сервер возвращает:

offlineLicense → зашифрованные данные лицензии.

licenseSignature → криптографическая подпись, подтверждающая подлинность лицензии.

Unity-игра может:

Сохранять offlineLicense и licenseSignature в локальном хранилище.

Проверять лицензию даже без подключения к интернету.

Блокировать доступ к игре, если срок действия истёк.

## 🛡 Безопасность

Пароли хранятся в виде bcrypt-хэшей.

Файлы .env и game.db находятся в .gitignore.

API защищено через JWT.

Поддерживается офлайн-подпись лицензий с криптографической проверкой.

Unity SDK хранит токен в PlayerPrefs.

## 🚀 Масштабирование (PostgreSQL / MySQL)

SQLite отлично подходит для локальной разработки и небольших игр,
но при увеличении нагрузки рекомендуется перейти на PostgreSQL или MySQL.

### 1.Установите драйверы:
```bash
# PostgreSQL
npm install sequelize pg pg-hstore

# MySQL
npm install sequelize mysql2
```
# 2.Укажите в .env:
```bash
# PostgreSQL
npm install sequelize pg pg-hstore

# MySQL
npm install sequelize mysql2

DB_DIALECT=postgres
DB_HOST=localhost
DB_NAME=game_license
DB_USER=admin
DB_PASS=123456
```

### 3.Миграция выполняется автоматически через sequelize.sync().