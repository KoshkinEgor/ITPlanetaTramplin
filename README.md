# ITPlaneta Tramplin

Учебный и продуктовый проект с единым SPA-фронтендом и backend API для платформы карьерных возможностей.  
Локально проект запускается как связка `React + Vite`, `ASP.NET Core + EF Core`, `PostgreSQL` и `Mailpit`.  
Для разработки Docker используется только как инфраструктурный слой: база данных и почтовая песочница.

## Стек

- Frontend: `Vite + React`
- Backend: `ASP.NET Core + EF Core`
- Database: `PostgreSQL`
- Local infra: `Docker Desktop + Docker Compose`
- Local email testing: `Mailpit`

## Что делает Docker в этом проекте

Docker не "встраивается" в React или .NET-код. Он поднимает только локальные сервисы, от которых зависит приложение:

- `db` - контейнер с PostgreSQL
- `mailpit` - локальный SMTP и веб-интерфейс для просмотра писем

Во время локальной разработки:

- frontend запускается напрямую в Windows через `npm run dev`
- backend запускается напрямую в Windows через `dotnet run`
- Docker нужен только для `PostgreSQL` и `Mailpit`

Схема локального запуска:

```text
Windows
├─ Docker Desktop
│  ├─ db (PostgreSQL)
│  └─ mailpit
├─ ASP.NET Core backend
└─ Vite frontend
```

## Требования

- `Windows 10/11`
- `Node.js 18+`
- `npm`
- `.NET SDK 9`
- `WSL 2`
- `Docker Desktop`

## Установка Docker Desktop на Windows

### 1. Установить или включить WSL 2

Открой `PowerShell` от имени администратора и выполни:

```powershell
wsl --install
wsl --update
wsl --set-default-version 2
wsl --version
```

Если система попросит перезагрузку, перезагрузи компьютер.

Официальная документация:

- WSL install: https://learn.microsoft.com/en-us/windows/wsl/install

### 2. Установить Docker Desktop

1. Скачай Docker Desktop по официальной инструкции:
   https://docs.docker.com/desktop/setup/install/windows-install/
2. Запусти установщик.
3. На этапе конфигурации оставь включенным `Use WSL 2 instead of Hyper-V`.
4. Дождись окончания установки.
5. Запусти `Docker Desktop`.
6. Прими лицензионные условия при первом старте.

Дополнительно про работу Docker Desktop с WSL:

- Docker Desktop + WSL 2: https://docs.docker.com/desktop/features/wsl/

### 3. Проверить установку Docker

После запуска Docker Desktop выполни:

```powershell
docker --version
docker compose version
docker run hello-world
```

Если эти команды работают, Docker готов к использованию в проекте.

## Установка проекта

### 1. Склонировать репозиторий и установить frontend-зависимости

```powershell
npm install
```

### 2. Восстановить backend-зависимости

```powershell
dotnet restore backend/ITPlanetaTramplin.Api.sln
```

### 3. Настроить переменные окружения при необходимости

По умолчанию локальный сценарий должен работать без дополнительных изменений.  
Если нужно изменить порты или адрес backend proxy, создай `.env.local` на основе `.env.example`.

Базовый пример:

```powershell
Copy-Item .env.example .env.local
```

Обычно менять ничего не нужно, если тебя устраивают стандартные значения:

- frontend: `http://127.0.0.1:3000`
- backend: `http://localhost:5234`
- postgres: `localhost:5432`
- mailpit: `http://localhost:8025`

### 4. Настроить внешний SMTP при необходимости

По умолчанию в локальной разработке backend использует `Mailpit` из `backend/ITPlanetaTramplin.Api/appsettings.Development.json`.

Если нужно отправлять письма в реальный почтовый ящик, удобнее не менять `appsettings.Development.json`, а сохранить SMTP-настройки в `user-secrets`:

```powershell
dotnet user-secrets set "Smtp:Host" "smtp.yandex.ru" --project backend/ITPlanetaTramplin.Api/ITPlanetaTramplin.Api.csproj
dotnet user-secrets set "Smtp:Port" "587" --project backend/ITPlanetaTramplin.Api/ITPlanetaTramplin.Api.csproj
dotnet user-secrets set "Smtp:EnableSsl" "true" --project backend/ITPlanetaTramplin.Api/ITPlanetaTramplin.Api.csproj
dotnet user-secrets set "Smtp:Username" "your-mail@yandex.ru" --project backend/ITPlanetaTramplin.Api/ITPlanetaTramplin.Api.csproj
dotnet user-secrets set "Smtp:Password" "your-app-password" --project backend/ITPlanetaTramplin.Api/ITPlanetaTramplin.Api.csproj
dotnet user-secrets set "Smtp:FromEmail" "your-mail@yandex.ru" --project backend/ITPlanetaTramplin.Api/ITPlanetaTramplin.Api.csproj
dotnet user-secrets set "Smtp:FromName" "Tramplin" --project backend/ITPlanetaTramplin.Api/ITPlanetaTramplin.Api.csproj
```

Важно:

- после изменения `dotnet user-secrets` нужно перезапустить backend
- для Яндекса в текущей реализации работает `Port=587` и `EnableSsl=true`
- порт `465` для `System.Net.Mail.SmtpClient` в этом проекте не подошёл
- для входа в SMTP нужен пароль приложения, а не обычный пароль от почты

## Локальный запуск проекта

### Шаг 1. Поднять базу данных и Mailpit

```powershell
npm run db:up
```

Эта команда запускает:

- PostgreSQL на `localhost:5432`
- Mailpit на `http://localhost:8025`

### Шаг 2. Запустить backend

В отдельном окне `PowerShell`:

```powershell
dotnet run --project backend/ITPlanetaTramplin.Api/ITPlanetaTramplin.Api.csproj
```

Ожидаемые локальные адреса backend:

- `http://localhost:5234`
- `https://localhost:7274`

### Шаг 3. Запустить frontend

В еще одном окне `PowerShell`:

```powershell
npm run dev
```

Frontend будет доступен по адресу:

- `http://127.0.0.1:3000`

### Перезапустить backend и frontend

Если backend или frontend уже запущены и нужно применить изменения в конфиге или окружении, перезапуск выполняется вручную в тех же окнах `PowerShell`.

Перезапуск backend:

1. Перейти в окно терминала, где запущен backend
2. Остановить процесс сочетанием `Ctrl+C`
3. Запустить снова:

```powershell
dotnet run --project backend/ITPlanetaTramplin.Api/ITPlanetaTramplin.Api.csproj
```

Перезапуск frontend:

1. Перейти в окно терминала, где запущен frontend
2. Остановить процесс сочетанием `Ctrl+C`
3. Запустить снова:

```powershell
npm run dev
```

Когда нужен именно перезапуск backend:

- после изменений в `backend/ITPlanetaTramplin.Api/appsettings*.json`
- после изменений в `dotnet user-secrets`
- после изменений в `launchSettings.json`
- после изменений в server-side коде, если приложение не перезапустилось автоматически

Когда нужен именно перезапуск frontend:

- после изменений в `.env.local`
- после изменений в `vite.config.js`
- после установки новых npm-зависимостей

Если менялись только React-компоненты, стили или клиентский код, обычно достаточно hot reload в браузере. Если hot reload не сработал, просто перезапустите frontend командой выше.

## Как сервисы соединяются между собой

- Vite проксирует запросы `/api` на адрес из `DEV_API_PROXY_TARGET`
- По умолчанию `DEV_API_PROXY_TARGET` указывает на `http://127.0.0.1:5234`
- Backend подключается к PostgreSQL через `ConnectionStrings:DefaultConnection`
- По умолчанию в локальной разработке письма подтверждения email и сброса пароля уходят в `Mailpit`
- Если настроен внешний SMTP через `dotnet user-secrets`, письма будут уходить во внешний почтовый сервис

Практически это выглядит так:

1. Браузер открывает frontend на `http://127.0.0.1:3000`
2. Frontend делает запросы на `/api/*`
3. Vite proxy перенаправляет эти запросы в backend
4. Backend работает с PostgreSQL
5. Почтовые сообщения попадают либо в Mailpit, либо во внешний SMTP, если он настроен отдельно

## Полезные команды

### Frontend

```powershell
npm run dev
npm run build
npm test
npm run lint
```

### Инфраструктура

```powershell
npm run db:up
npm run db:down
npm run db:reset
```

### Backend

```powershell
dotnet run --project backend/ITPlanetaTramplin.Api/ITPlanetaTramplin.Api.csproj
dotnet test backend/ITPlanetaTramplin.Api.sln
```

## Быстрая smoke-проверка

После запуска всех сервисов можно пройти базовый сценарий:

1. Открыть `http://127.0.0.1:3000`
2. Зарегистрировать нового пользователя
3. Проверить, куда настроена отправка писем:
   Mailpit: `http://localhost:8025`
   внешний SMTP: реальный почтовый ящик получателя
4. Найти письмо подтверждения email
5. Подтвердить email
6. Войти в систему
7. Открыть каталог возможностей
8. Перейти в кабинет кандидата, компании или модератора в зависимости от роли

## Troubleshooting

### `docker` not recognized

Причина:

- Docker Desktop не установлен
- Docker Desktop не запущен
- терминал был открыт до установки Docker и не увидел обновленный `PATH`

Что делать:

1. Установить Docker Desktop
2. Запустить Docker Desktop
3. Закрыть и заново открыть PowerShell
4. Снова проверить:

```powershell
docker --version
docker compose version
```

### Порт `5432` уже занят

Измени `POSTGRES_PORT` в `.env.local`, например:

```dotenv
POSTGRES_PORT=5433
```

После этого перезапусти:

```powershell
npm run db:down
npm run db:up
```

### Порт `3000` уже занят

Измени `DEV_SERVER_PORT` в `.env.local`, например:

```dotenv
DEV_SERVER_PORT=3001
```

### Backend не подключается к базе

Проверь:

1. Запущен ли Docker Desktop
2. Выполнилась ли команда `npm run db:up`
3. Доступен ли PostgreSQL на нужном порту
4. Совпадает ли строка подключения backend с реальным портом базы

### Не приходят письма подтверждения или сброса пароля

Проверь:

1. Запущен ли backend
2. Если используется `Mailpit`, открывается ли `http://localhost:8025`
3. Если используется внешний SMTP, были ли применены `dotnet user-secrets`
4. Если используется внешний SMTP, перезапущен ли backend после изменения секретов
5. Для Яндекса используется ли `smtp.yandex.ru`, `Port=587`, `EnableSsl=true`
6. Используется ли пароль приложения, а не обычный пароль почты

## Примечание для Linux

На Linux можно использовать обычный `Docker Engine` и `docker compose` вместо Docker Desktop.  
Сами команды приложения остаются теми же:

- `dotnet run --project backend/ITPlanetaTramplin.Api/ITPlanetaTramplin.Api.csproj`
- `npm run dev`

## Текущее состояние

- Локальный сценарий разработки поддерживается и задокументирован
- Сборка frontend и backend проходит
- Автотесты frontend и backend проходят
- Production deploy через `VPS + Docker + Caddy` еще не считается финализированным, поэтому в этот README намеренно не включен
