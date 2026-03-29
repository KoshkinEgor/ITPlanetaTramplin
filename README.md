# ITPlaneta Tramplin

Учебный и продуктовый проект платформы карьерных возможностей с единым SPA-фронтендом и backend API.

Локальная разработка построена как связка:

- `React 18 + Vite 5`
- `ASP.NET Core 9 + EF Core 9`
- `PostgreSQL 16`
- `Mailpit` для локальной проверки писем
- `Docker Desktop + Docker Compose` только для инфраструктуры

## Стек проекта

- Frontend: `React`, `Vite`, `react-router-dom`
- Backend: `ASP.NET Core`, `Entity Framework Core`, `Npgsql`
- Database: `PostgreSQL`
- Local infra: `Docker Compose`, `Mailpit`
- Карты и геокодинг: `Yandex Maps JS API v3`, `Yandex Geocoder`
- Дополнительные интеграции: `Dadata` для отдельных backend-сценариев

## Что нужно установить

- `Node.js 20 LTS` рекомендуется, минимум `18+`
- `npm`
- `.NET SDK 9`
- `Docker Desktop`
- `PowerShell`

## Локальный запуск

### 1. Установить зависимости

```powershell
npm install
dotnet restore backend/ITPlanetaTramplin.Api.sln
```

### 2. Подготовить локальный env для фронтенда

`.env.local` нужен в первую очередь для фронтенда и ключа Яндекса. Файл не коммитится.

```powershell
Copy-Item .env.example .env.local
```

Минимум, что имеет смысл проверить в `.env.local`:

```dotenv
DEV_SERVER_PORT=3000
DEV_SERVER_HOST=127.0.0.1
DEV_API_PROXY_TARGET=http://127.0.0.1:5234
VITE_API_BASE_URL=/api
VITE_YANDEX_MAPS_API_KEY=
```

Если `VITE_YANDEX_MAPS_API_KEY` пустой, приложение запустится, но карты и адресные подсказки Яндекса работать не будут.

### 3. Поднять локальную инфраструктуру

```powershell
npm run db:up
```

Поднимаются:

- PostgreSQL: `localhost:5432`
- Mailpit UI: `http://localhost:8025`
- Mailpit SMTP: `localhost:1025`

### 4. Запустить backend

```powershell
dotnet run --project backend/ITPlanetaTramplin.Api/ITPlanetaTramplin.Api.csproj
```

По умолчанию `Development`-конфиг backend уже настроен на локальный PostgreSQL из `docker-compose.yml`.

Backend будет доступен по адресам:

- `http://localhost:5234`
- `https://localhost:7274`

### 5. Запустить frontend

```powershell
npm run dev
```

Frontend будет доступен по адресу:

- `http://localhost:3000`

## Что где работает

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5234`
- PostgreSQL: `localhost:5432`
- Mailpit: `http://localhost:8025`

## Демо-аккаунты

Ниже только сидовые локальные записи из `DevelopmentDataSeeder`. Личные аккаунты в README не перечисляются.

Важно: для компаний логин в форме входа это `ИНН`, а не email.

### Модераторы

- `demo-curator@tramplin.local` / `Curator1234`
- `olga.curator@tramplin.local` / `Moderator1234`
- `administrator@tramplin.local` / `Administrator1234`

### Компании

- `7707083893` / `Demo1234` (`Sber`)
- `7743001840` / `VkTeam1234` (`VK`)
- `7736207543` / `Yandex1234` (`Yandex`)
- `7707049388` / `Rostelecom1234` (`Rostelecom`)

### Кандидаты

- `anna.petrova@tramplin.local` / `Candidate1234`
- `ivan.smirnov@tramplin.local` / `Analyst1234`
- `polina.sokolova@tramplin.local` / `Designer1234`

Сид idempotent: при повторном запуске backend недостающие демо-записи будут восстановлены, а пароли для сидовых аккаунтов синхронизированы.

## Как устроен локальный поток

1. Браузер открывает `http://localhost:3000`.
2. Frontend отправляет запросы на `/api/*`.
3. Vite proxy перенаправляет их в backend на `http://127.0.0.1:5234`.
4. Backend работает с PostgreSQL.
5. Письма в локальной разработке уходят в Mailpit, если не настроен внешний SMTP.

## Yandex API

### Что использует ключ

Один и тот же `VITE_YANDEX_MAPS_API_KEY` используется для двух сценариев:

- frontend загружает `Yandex Maps JS API v3`
- backend в `Development` автоматически подхватывает тот же ключ для:
  - `/api/location/address-suggestions`
  - `/api/location/reverse-geocode`

То есть локально разработчику достаточно настроить один ключ, а не два разных.

### Как настроить локально

1. Создать или получить dev-ключ для Яндекс Карт.
2. Записать его в `.env.local`:

```dotenv
VITE_YANDEX_MAPS_API_KEY=your-shared-dev-key
```

3. Перезапустить frontend.
4. Если backend уже запущен, тоже перезапустить backend.

### Как передавать ключ другому разработчику

Лучший практический вариант для этого проекта:

1. Использовать отдельный `shared dev key`, а не личный production-ключ.
2. Ограничить его по реферерам и доменам:
   `http://localhost:3000`, `http://127.0.0.1:3000` и, при необходимости, staging-домен.
3. Передавать ключ вне репозитория:
   через менеджер паролей, защищенный чат, vault или CI/CD secrets.
4. Не коммитить реальное значение ни в `README`, ни в `.env.example`, ни в git.

Важно: ключ для JS API карт все равно попадает в браузерный клиент. Его нельзя считать приватным секретом в полном смысле. Поэтому для передачи между разработчиками нужен именно отдельный dev/stage-ключ с лимитами и ограничениями, а не основной рабочий ключ.

### Что произойдет, если ключ не задан

- приложение в целом запустится
- карта на главной и в формах публикаций не загрузится
- backend-эндпоинты геокодинга вернут `503`
- остальная функциональность проекта продолжит работать

### Production / Docker

Для docker production-конфига используется та же переменная `VITE_YANDEX_MAPS_API_KEY`: она пробрасывается и во frontend build, и в backend geocoder. Это позволяет держать одну точку настройки и не заводить два отдельных значения без необходимости.

## SMTP Яндекса

По умолчанию в локальной разработке backend использует `Mailpit`, поэтому внешний SMTP не обязателен.

Если нужен реальный SMTP Яндекса, удобнее хранить настройки в `dotnet user-secrets`, а не в репозитории:

```powershell
dotnet user-secrets set "Smtp:Host" "smtp.yandex.ru" --project backend/ITPlanetaTramplin.Api/ITPlanetaTramplin.Api.csproj
dotnet user-secrets set "Smtp:Port" "587" --project backend/ITPlanetaTramplin.Api/ITPlanetaTramplin.Api.csproj
dotnet user-secrets set "Smtp:EnableSsl" "true" --project backend/ITPlanetaTramplin.Api/ITPlanetaTramplin.Api.csproj
dotnet user-secrets set "Smtp:Username" "your-mail@yandex.ru" --project backend/ITPlanetaTramplin.Api/ITPlanetaTramplin.Api.csproj
dotnet user-secrets set "Smtp:Password" "your-app-password" --project backend/ITPlanetaTramplin.Api/ITPlanetaTramplin.Api.csproj
dotnet user-secrets set "Smtp:FromEmail" "your-mail@yandex.ru" --project backend/ITPlanetaTramplin.Api/ITPlanetaTramplin.Api.csproj
dotnet user-secrets set "Smtp:FromName" "Tramplin" --project backend/ITPlanetaTramplin.Api/ITPlanetaTramplin.Api.csproj
```

Для текущей реализации:

- использовать `smtp.yandex.ru`
- использовать `Port=587`
- использовать `EnableSsl=true`
- использовать пароль приложения, а не обычный пароль от почты

## Полезные команды

```powershell
npm run dev
npm run build
npm run lint
npm test
npm run db:up
npm run db:down
npm run db:reset
dotnet run --project backend/ITPlanetaTramplin.Api/ITPlanetaTramplin.Api.csproj
dotnet test backend/ITPlanetaTramplin.Api.sln
```

## Быстрая smoke-проверка

1. Открыть `http://localhost:3000`.
2. Войти под одним из сидовых аккаунтов.
3. Проверить, что каталог возможностей открывается.
4. Проверить переход в кабинет кандидата, компании или модератора.
5. Если тестируешь письма, открыть `http://localhost:8025`.
6. Если тестируешь карты, проверить загрузку карты на главной и в форме локации публикации.

## Troubleshooting

### Backend не подключается к базе

Проверь:

- запущен ли `npm run db:up`
- свободен ли порт `5432`
- не изменены ли локальные параметры PostgreSQL относительно значений из `docker-compose.yml`

Если нужен другой порт или пароль, переопредели строку подключения через `ConnectionStrings__DefaultConnection` или `API_CONNECTION_STRING` перед запуском backend.

### Не грузятся Яндекс.Карты на localhost

Проверь:

- задан ли `VITE_YANDEX_MAPS_API_KEY`
- разрешен ли `localhost` в ограничениях ключа
- перезапущен ли frontend после изменения `.env.local`

### Не работают адресные подсказки

Проверь:

- задан ли `VITE_YANDEX_MAPS_API_KEY`
- перезапущен ли backend после изменения ключа
- отвечает ли backend по `http://localhost:5234`

### Не приходят письма

Проверь:

- работает ли backend
- открыт ли `http://localhost:8025`, если используется Mailpit
- применены ли `dotnet user-secrets`, если используется внешний SMTP
- перезапущен ли backend после изменения SMTP-настроек
