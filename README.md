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

Перед первым запуском настрой локальные секреты. Они сохраняются через .NET
User Secrets вне репозитория:

```powershell
$project = "backend/ITPlanetaTramplin.Api/ITPlanetaTramplin.Api.csproj"

$authBytes = [byte[]]::new(64)
[Security.Cryptography.RandomNumberGenerator]::Fill($authBytes)
$authKey = [Convert]::ToBase64String($authBytes)

$emailHashBytes = [byte[]]::new(64)
[Security.Cryptography.RandomNumberGenerator]::Fill($emailHashBytes)
$emailHashKey = [Convert]::ToBase64String($emailHashBytes)

$resetHashBytes = [byte[]]::new(64)
[Security.Cryptography.RandomNumberGenerator]::Fill($resetHashBytes)
$resetHashKey = [Convert]::ToBase64String($resetHashBytes)

dotnet user-secrets set "Auth:Key" $authKey --project $project
dotnet user-secrets set "EmailVerification:HashKey" $emailHashKey --project $project
dotnet user-secrets set "PasswordReset:HashKey" $resetHashKey --project $project
dotnet user-secrets set "GigaChat:AuthKey" "NEW_GIGACHAT_AUTH_KEY" --project $project
```

`NEW_GIGACHAT_AUTH_KEY` нужно создать или перевыпустить в кабинете GigaChat
API. Используется постоянный Authorization key для Basic-авторизации
OAuth-запроса, а не временный `access_token`.

После настройки секретов:

```powershell
dotnet run --project backend/ITPlanetaTramplin.Api/ITPlanetaTramplin.Api.csproj
```

По умолчанию `Development`-конфиг backend уже настроен на локальный PostgreSQL из `docker-compose.yml`.
В Development неприменённые EF Core-миграции применяются автоматически.

Для явного применения миграций без запуска API:

```powershell
dotnet ef database update `
  --project backend/ITPlanetaTramplin.Api/ITPlanetaTramplin.Api.csproj `
  --startup-project backend/ITPlanetaTramplin.Api/ITPlanetaTramplin.Api.csproj
```

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

## Ключи и секреты

### Обязательные

| Переменная | Откуда взять | Требования |
| --- | --- | --- |
| `Auth__Key` / `API_AUTH_KEY` | Сгенерировать самостоятельно | Случайные 64 байта в Base64. Все экземпляры одного backend-окружения используют одинаковое значение. |
| `GigaChat__AuthKey` / `API_GIGACHAT_AUTH_KEY` | Кабинет GigaChat API | Новый перевыпущенный Authorization key. Не OAuth `access_token`. |
| `ConnectionStrings__DefaultConnection` / `API_CONNECTION_STRING` | Параметры PostgreSQL | Отдельная production-база и сильный пароль. |
| `EmailVerification__HashKey` / `API_EMAIL_VERIFICATION_HASH_KEY` | Сгенерировать самостоятельно | Отдельный случайный ключ, не равный `Auth__Key`. |
| `PasswordReset__HashKey` / `API_PASSWORD_RESET_HASH_KEY` | Сгенерировать самостоятельно | Ещё один отдельный случайный ключ. |

Сгенерировать три независимых ключа можно так:

```powershell
1..3 | ForEach-Object {
  $bytes = [byte[]]::new(64)
  [Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
  [Convert]::ToBase64String($bytes)
}
```

Первое значение используй как `API_AUTH_KEY`, второе как
`API_EMAIL_VERIFICATION_HASH_KEY`, третье как
`API_PASSWORD_RESET_HASH_KEY`. Не публикуй вывод команды.

### Опциональные интеграции

| Переменная | Назначение |
| --- | --- |
| `VITE_YANDEX_MAPS_API_KEY` | Карты и геокодинг. Ограничь frontend-ключ доменами и квотами. |
| `API_DADATA_API_KEY` | Подсказки Dadata. |
| `API_SMTP_*` | Реальная отправка писем. Для Яндекса нужен пароль приложения. |

### Какие ключи нельзя использовать

- старый GigaChat key, ранее находившийся в `appsettings`;
- старый JWT signing key из истории Git;
- старые SMTP/Dadata credentials и hash-ключи, ранее находившиеся в Git;
- одинаковое значение для JWT, email verification и password reset;
- временный GigaChat OAuth `access_token` вместо Authorization key;
- личный production-ключ Яндекс Карт без ограничений для локальной разработки.

## Production-запуск через Docker Compose

1. Создай локальный `.env` из шаблона:

```powershell
Copy-Item .env.example .env
```

2. Замени все `replace-with-*` и пустые обязательные значения:

```dotenv
POSTGRES_DB=itplanetatramplin
POSTGRES_USER=tramplin
POSTGRES_PASSWORD=STRONG_DATABASE_PASSWORD
API_CONNECTION_STRING=Host=db;Port=5432;Database=itplanetatramplin;Username=tramplin;Password=STRONG_DATABASE_PASSWORD
API_APPLY_MIGRATIONS_ON_STARTUP=true
API_AUTH_KEY=GENERATED_BASE64_AUTH_KEY
API_EMAIL_VERIFICATION_HASH_KEY=GENERATED_EMAIL_HASH_KEY
API_PASSWORD_RESET_HASH_KEY=GENERATED_PASSWORD_RESET_HASH_KEY
API_GIGACHAT_ENABLED=true
API_GIGACHAT_AUTH_KEY=NEW_GIGACHAT_AUTHORIZATION_KEY
FRONTEND_VITE_API_BASE_URL=/api
CADDY_SITE=your-domain.example
```

3. Запусти production-состав:

```powershell
docker compose -f docker-compose.prod.yml up -d --build
```

4. Проверь миграции и сервисы:

```powershell
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs api --tail 100
```

При `API_APPLY_MIGRATIONS_ON_STARTUP=true` API применяет pending-миграции до
начала обработки запросов. В логах не должно быть ошибки
`Failed to apply database migrations on startup`.

Если миграции выполняются отдельным deployment job, установи
`API_APPLY_MIGRATIONS_ON_STARTUP=false` и запускай `dotnet ef database update`
из CI/CD до переключения трафика.

## Проверка AI-обзора

1. Войди под кандидатом и открой карьерный дашборд.
2. Запусти обновление AI-обзора.
3. Проверь, что создание job возвращает HTTP `202`.
4. Убедись, что три шага переходят из `queued/running` в `succeeded`,
   `partial` или `failed`.
5. При сбое одного шага старый обзор должен остаться видимым, а предупреждение
   должно появиться только возле проблемного блока.

Без `GigaChat__AuthKey` проект запускается, но AI-job завершится ошибкой
`configuration`, и интерфейс покажет кэш или системный fallback.

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
