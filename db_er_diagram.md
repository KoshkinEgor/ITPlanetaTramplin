# ER-диаграмма базы данных (ITPlanetaTramplin)

Данный документ содержит ER-диаграмму и подробное описание схемы базы данных проекта на основе контекста Entity Framework Core (`ApplicationDBContext`). 

---

## Визуализация схемы (Mermaid ER с описанием полей на русском языке)

Ниже представлена полная интерактивная ER-диаграмма сущностей базы данных. Все названия таблиц и полей сохранены на английском языке (в соответствии с кодом), а в комментариях и связях дан русский перевод.

```mermaid
erDiagram
    users ||--o| applicant_profiles : "имеет профиль соискателя"
    users ||--o| employer_profiles : "имеет профиль работодателя"
    users ||--o| curator_profiles : "имеет профиль куратора"
    users ||--o{ chat_threads : "создает ветки чата"
    users ||--o{ chat_participants : "участвует в чатах"
    users ||--o{ chat_messages : "отправляет сообщения"
    users ||--o{ opportunity_shares : "делится возможностью (отправитель)"
    users ||--o{ opportunity_shares : "получает возможность (получатель)"
    users ||--o{ friend_requests : "отправляет запрос в друзья"
    users ||--o{ friend_requests : "получает запрос в друзья"
    users ||--o{ contacts : "владеет контактом"
    users ||--o{ contacts : "добавлен как контакт"
    users ||--o{ candidate_project_invites : "отправляет инвайт в проект"
    users ||--o{ candidate_project_invites : "получает инвайт в проект"
    users ||--o{ user_notifications : "получает уведомления"
    users ||--o{ user_notifications : "инициирует уведомления"
    users ||--o{ complaints : "подает жалобы"
    users ||--o{ complaints : "разрешает жалобы"
    users ||--o{ moderation_audit_logs : "совершает действие (модератор)"
    users ||--o{ moderator_invitations : "приглашает модератора"
    users ||--o{ moderator_invitations : "принимает инвайт модератора"
    users ||--o| moderator_settings : "имеет настройки модератора"
    users ||--o{ tags : "создает теги"
    users ||--o{ tags : "обновляет теги"
    users ||--o{ system_reference_items : "обновляет системные элементы"

    applicant_profiles ||--o{ applicant_achievements : "имеет достижения"
    applicant_profiles ||--o{ applicant_educations : "имеет образование"
    applicant_profiles ||--o{ candidate_projects : "создает проекты"
    applicant_profiles ||--o{ applications : "подает отклики"
    applicant_profiles ||--o{ recommendations : "получает рекомендации"
    applicant_profiles ||--o{ recommendations : "дает рекомендации"

    employer_profiles ||--o| company_settings : "имеет настройки компании"
    employer_profiles ||--o{ opportunities : "публикует возможности"

    opportunities ||--o{ applications : "содержит отклики"
    opportunities ||--o{ opportunity_shares : "пересылается"
    opportunities ||--o{ complaints : "получает жалобы"
    opportunities ||--o{ recommendations : "рекомендуется для"
    opportunities ||--o{ opportunity_tags : "имеет теги"
    tags ||--o{ opportunity_tags : "присвоен"

    candidate_projects ||--o{ candidate_project_invites : "связан с инвайтами"
    chat_threads ||--o{ chat_participants : "имеет участников"
    chat_threads ||--o{ chat_messages : "содержит сообщения"
    applications ||--o{ user_notifications : "генерирует уведомления"
    complaints ||--o{ user_notifications : "генерирует уведомления"
    tags ||--o{ tags : "объединен в"

    users {
        int id PK "Идентификатор"
        string email "Электронная почта"
        string password_hash "Хэш пароля"
        bool is_verified "Почта подтверждена"
        bool pre_verify "Флаг предверификации"
        string email_verification_code_hash "Хэш кода верификации почты"
        timestamp email_verification_expires_at "Истечение кода почты"
        timestamp email_verification_sent_at "Время отправки кода почты"
        int email_verification_attempt_count "Попытки подтверждения почты"
        string password_reset_code_hash "Хэш кода сброса пароля"
        timestamp password_reset_expires_at "Истечение кода сброса пароля"
        timestamp password_reset_sent_at "Время отправки кода сброса пароля"
        int password_reset_attempt_count "Попытки сброса пароля"
        timestamp created_at "Дата регистрации"
        timestamp deleted_at "Дата удаления аккаунта"
    }

    applicant_profiles {
        int id PK "Идентификатор профиля"
        int user_id FK "ID пользователя"
        string name "Имя"
        string surname "Фамилия"
        string thirdname "Отчество"
        string description "О себе"
        string moderation_status "Статус модерации"
        string_array skills "Навыки"
        jsonb links "Ссылки (соцсети)"
        jsonb privacy_settings "Настройки приватности"
    }

    applicant_achievements {
        int id PK "Идентификатор"
        int applicant_id FK "ID профиля соискателя"
        date obtain_date "Дата получения"
        string location "Место получения"
        string title "Название достижения"
        string description "Описание достижения"
        string_array attachments "Вложения (сертификаты/документы)"
    }

    applicant_educations {
        int id PK "Идентификатор"
        int applicant_id FK "ID профиля соискателя"
        string institution_name "Название учебного заведения"
        string faculty "Факультет"
        string specialization "Специальность"
        int start_year "Год начала"
        int graduation_year "Год окончания"
        bool is_completed "Окончено ли обучение"
        string_array attachments "Вложения"
        string description "Описание"
        string education_level "Уровень образования"
    }

    candidate_projects {
        int id PK "Идентификатор"
        int applicant_id FK "ID профиля соискателя"
        string title "Название проекта"
        string project_type "Тип проекта"
        string short_description "Краткое описание"
        string organization "Организация/Заказчик"
        string role "Роль в проекте"
        int team_size "Размер команды"
        date start_date "Дата начала"
        date end_date "Дата окончания"
        bool is_ongoing "В процессе разработки"
        string problem "Какую проблему решали"
        string contribution "Личный вклад"
        string result "Результаты работы"
        string metrics "Метрики проекта"
        string lessons_learned "Уроки и выводы"
        string_array tags "Теги проекта"
        string cover_image_url "Ссылка на обложку"
        jsonb participants "Список участников (JSON)"
        string demo_url "Ссылка на демо"
        string repository_url "Ссылка на репозиторий"
        string design_url "Ссылка на дизайн (Figma и т.д.)"
        string case_study_url "Ссылка на кейс"
        bool show_in_portfolio "Показывать в портфолио"
        timestamp created_at "Дата создания"
        timestamp updated_at "Дата обновления"
    }

    candidate_project_invites {
        int id PK "Идентификатор"
        int sender_user_id FK "Отправитель приглашения (User ID)"
        int recipient_user_id FK "Получатель приглашения (User ID)"
        int project_id FK "ID проекта"
        string role "Предлагаемая роль"
        string message "Сообщение к приглашению"
        string status "Статус приглашения"
        timestamp created_at "Дата создания"
        timestamp updated_at "Дата обновления"
        timestamp responded_at "Дата ответа"
    }

    curator_profiles {
        int id PK "Идентификатор"
        int user_id FK "ID пользователя"
        bool is_administrator "Является ли суперадминистратором"
        string name "Имя"
        string surname "Фамилия"
        string thirdname "Отчество"
    }

    employer_profiles {
        int id PK "Идентификатор"
        int user_id FK "ID пользователя"
        string company_name "Название компании"
        string inn "ИНН"
        string verification_data "Данные верификации"
        string verification_status "Статус верификации"
        string verification_reason "Причина статуса верификации"
        string legal_address "Юридический адрес"
        string profile_image "Изображение профиля"
        string description "Описание компании"
        jsonb socials "Социальные сети"
        string verification_method "Метод подтверждения"
        jsonb media_content "Медиа-контент"
        jsonb hero_media "Главное медиа"
        jsonb case_studies "Кейсы компании"
        jsonb gallery "Галерея изображений"
    }

    company_settings {
        int id PK "Идентификатор"
        int employer_id FK "ID профиля работодателя"
        string notification_email "Email для уведомлений"
        bool notify_new_applications "Уведомлять о новых откликах"
        bool notify_moderation_updates "Уведомлять о статусе модерации"
        bool notify_complaints_and_system "Уведомлять о жалобах и системе"
        string default_start_section "Раздел по умолчанию при старте"
        string default_responses_sort "Сортировка откликов по умолчанию"
        bool show_archived_opportunities "Показывать архивные вакансии"
        bool allow_company_messages "Разрешить сообщения компании"
        timestamp created_at "Дата создания"
        timestamp updated_at "Дата обновления"
    }

    opportunities {
        int id PK "Идентификатор"
        int employer_id FK "ID профиля работодателя"
        string title "Заголовок вакансии/мероприятия"
        string description "Детальное описание"
        string location_address "Адрес места проведения"
        string location_city "Город"
        decimal latitude "Широта на карте"
        decimal longitude "Долгота на карте"
        string opportunity_type "Тип (стажировка, вакансия и т.д.)"
        string employment_type "Тип занятости (полная, частичная)"
        string experience_level "Требуемый опыт"
        string schedule "График работы"
        string moderation_status "Статус модерации"
        string? moderation_reason "Причина отклонения модерации"
        date publish_at "Дата публикации"
        date expire_at "Срок действия"
        date deleted_at "Дата удаления"
        jsonb contacts "Контактная информация (JSON)"
        jsonb media_content "Медиа-файлы (JSON)"
        decimal salary_from "Зарплата от"
        decimal salary_to "Зарплата до"
        bool is_paid "Оплачивается ли"
        decimal stipend_from "Стипендия от"
        decimal stipend_to "Стипендия до"
        string duration "Продолжительность"
        date event_start_at "Дата начала мероприятия"
        date registration_deadline "Крайний срок регистрации"
        string meeting_frequency "Частота встреч"
        int seats_count "Количество мест"
    }

    opportunity_tags {
        int opportunity_id PK, FK "ID возможности"
        int tag_id PK, FK "ID тега"
    }

    tags {
        int id PK "Идентификатор"
        string name "Название тега"
        int created_by FK "Создатель тега (User ID)"
        bool is_active "Активен ли"
        timestamp updated_at "Дата изменения"
        int updated_by_user_id FK "Кто изменил (User ID)"
        int merged_into_tag_id FK "Ссылка на тег, в который объединен"
    }

    applications {
        int id PK "Идентификатор"
        int opportunity_id FK "ID возможности"
        int applicant_id FK "ID соискателя"
        timestamp applied_at "Дата подачи отклика"
        string status "Статус отклика"
        string employer_note "Заметка работодателя"
        bool allow_peer_visibility "Виден ли отклик другим соискателям"
    }

    opportunity_shares {
        int id PK "Идентификатор"
        int sender_user_id FK "Отправитель (User ID)"
        int recipient_user_id FK "Получатель (User ID)"
        int opportunity_id FK "ID возможности"
        string note "Заметка при пересылке"
        timestamp created_at "Дата пересылки"
    }

    complaints {
        int id PK "Идентификатор"
        int reporter_user_id FK "Автор жалобы (User ID)"
        int opportunity_id FK "Жалоба на возможность"
        string reason "Причина жалобы"
        string description "Текст жалобы"
        string status "Статус (pending, resolved)"
        string moderator_note "Заметка модератора"
        timestamp created_at "Дата подачи"
        timestamp resolved_at "Дата решения"
        int resolved_by_user_id FK "Кто решил жалобу (User ID)"
    }

    contacts {
        int user_id PK, FK "Владелец связи (User ID)"
        int contact_id PK, FK "Контакт (User ID)"
        timestamp created_at "Дата добавления"
    }

    friend_requests {
        int id PK "Идентификатор"
        int sender_user_id FK "Отправитель запроса (User ID)"
        int recipient_user_id FK "Получатель запроса (User ID)"
        string status "Статус (pending, accepted, declined)"
        timestamp created_at "Дата создания"
        timestamp updated_at "Дата изменения"
        timestamp responded_at "Дата ответа"
    }

    chat_threads {
        int id PK "Идентификатор ветки"
        string subject "Тема ветки"
        string context_type "Контекст (direct, opportunity и т.д.)"
        int context_id "Идентификатор сущности контекста"
        int created_by_user_id FK "Создатель чата (User ID)"
        timestamp created_at "Дата создания"
        timestamp updated_at "Дата изменения"
        timestamp last_message_at "Время последнего сообщения"
    }

    chat_participants {
        int thread_id PK, FK "ID ветки чата"
        int user_id PK, FK "ID участника"
        string role "Роль участника"
        timestamp created_at "Дата входа в чат"
        timestamp last_read_at "Время прочтения сообщений"
        bool is_muted "Чат заглушен"
    }

    chat_messages {
        int id PK "Идентификатор сообщения"
        int thread_id FK "ID ветки чата"
        int sender_user_id FK "Отправитель сообщения"
        string body "Текст сообщения"
        bool is_system "Является ли системным"
        timestamp created_at "Дата отправки"
    }

    moderator_invitations {
        int id PK "Идентификатор"
        string email "Электронная почта приглашенного"
        string name "Имя"
        string surname "Фамилия"
        string thirdname "Отчество"
        int invited_by_user_id FK "Кто пригласил (User ID)"
        int accepted_user_id FK "Кто принял приглашение (User ID)"
        string token_hash "Хэш токена приглашения"
        timestamp expires_at "Истечение срока приглашения"
        timestamp accepted_at "Дата принятия"
        timestamp revoked_at "Дата отзыва инвайта"
        timestamp created_at "Дата создания"
    }

    moderator_settings {
        int id PK "Идентификатор"
        int user_id FK "ID пользователя"
        jsonb notification_settings "Настройки уведомлений (JSON)"
        jsonb queue_settings "Настройки очереди модерации (JSON)"
        string start_page "Стартовая страница"
        timestamp created_at "Дата создания"
        timestamp updated_at "Дата изменения"
    }

    moderation_audit_logs {
        int id PK "Идентификатор"
        int actor_user_id FK "Модератор (User ID)"
        string action "Действие модератора"
        string entity_type "Тип сущности"
        int entity_id "ID сущности"
        string summary "Описание действия"
        jsonb metadata "Дополнительные метаданные (JSON)"
        timestamp created_at "Дата действия"
    }

    user_notifications {
        int id PK "Идентификатор"
        int user_id FK "Кому предназначено (User ID)"
        string type "Тип уведомления"
        string title "Заголовок"
        string message "Сообщение"
        string link "Ссылка для перехода"
        bool is_read "Прочитано"
        timestamp created_at "Дата генерации"
        timestamp read_at "Дата прочтения"
        int actor_user_id FK "Инициатор действия (User ID)"
        int opportunity_id FK "Связанная возможность"
        int application_id FK "Связанный отклик"
        int complaint_id FK "Связанная жалоба"
        jsonb metadata "Дополнительные данные (JSON)"
    }

    system_reference_items {
        int id PK "Идентификатор"
        string category "Категория справочника"
        string key "Ключ"
        string label "Отображаемое значение"
        string description "Описание значения"
        bool is_active "Активен ли пункт"
        bool is_system "Системный ли пункт"
        int sort_order "Порядок сортировки"
        timestamp created_at "Дата создания"
        timestamp updated_at "Дата изменения"
        int updated_by_user_id FK "Кто изменил (User ID)"
    }

    recommendations {
        int id PK "Идентификатор"
        int recommender_id FK "ID рекомендующего (соискателя)"
        int candidate_id FK "ID кандидата"
        int opportunity_id FK "ID возможности"
        string message "Сопроводительное письмо"
        timestamp created_at "Дата рекомендации"
    }
```

---

## Подробное описание связей и полей таблиц

### 1. Пользователи и Профили (Users & Profiles)
В системе существует три типа пользователей. Каждому аккаунту в таблице `users` может соответствовать только один профиль конкретной роли:
* **Соискатель (`applicant_profiles`)**: Хранит личные данные кандидата, массив навыков (`skills`), ссылки на социальные сети (`links`) и настройки видимости резюме.
* **Работодатель (`employer_profiles`)**: Содержит ИНН (`inn`), название компании, адрес, бренд-медиа, галерею компании и кейсы.
* **Куратор (`curator_profiles`)**: Отвечает за администрирование платформы, имеет флаг суперпользователя (`is_administrator`).

### 2. Портфолио Соискателя (Portfolio & Resume)
Профиль соискателя агрегирует информацию о его бэкграунде:
* **Образование (`applicant_educations`)**: Каждая запись привязана к профилю соискателя и описывает учебное заведение, факультет, период учебы и уровень образования.
* **Достижения (`applicant_achievements`)**: Список наград, сертификатов с вложенными файлами-доказательствами.
* **Проекты (`candidate_projects`)**: Проекты, созданные соискателем (как учебные, так и коммерческие). Хранят ссылки на репозитории, демо, дизайн-макеты, а также детальный разбор вклада и результатов.
* **Инвайты в проекты (`candidate_project_invites`)**: Механизм приглашения других участников платформы к совместному добавлению проекта в портфолио.

### 3. Возможности и Отклики (Opportunities & Applications)
Центральный блок взаимодействия соискателя и работодателя:
* **Возможности (`opportunities`)**: Вакансии, стажировки, менторские программы и мероприятия, созданные работодателями. Содержат детальные условия (локация, зарплата/стипендия, занятость, график, дедлайн регистрации и т.д.).
* **Теги (`tags`)**: Классификатор для вакансий. Реализована связь Many-to-Many через таблицу `opportunity_tags`. Теги могут объединяться друг с другом (`merged_into_tag_id`) для очистки дубликатов.
* **Отклики (`applications`)**: Связующая сущность соискателя и вакансии. Содержит статус отклика (`Status`) и заметки работодателя.
* **Рекомендации (`recommendations`)**: Отзывы соискателей в пользу кандидата на конкретную возможность.

### 4. Социальное взаимодействие и Коммуникации
* **Контакты (`contacts`)**: Записи о дружбе/связях между пользователями (таблица связи `user_id` и `contact_id`).
* **Запросы в друзья (`friend_requests`)**: Запросы на добавление в контакты со статусами прохождения.
* **Чаты (`chat_threads`, `chat_participants`, `chat_messages`)**: Система обмена сообщениями. Поддерживает привязку чата к определенному объекту (например, чат по отклику на вакансию).

### 5. Модерация и Системное администрирование
* **Жалобы (`complaints`)**: Жалобы пользователей на вакансии. Направляются модераторам, содержат причину, текст и резолюцию модератора.
* **Инвайты модераторов (`moderator_invitations`)**: Приглашения, высылаемые администраторами для новых модераторов.
* **Настройки модератора (`moderator_settings`)**: Персональные настройки очередей распределения контента на проверку.
* **Лог аудита (`moderation_audit_logs`)**: Логирование всех действий модераторов над сущностями для исключения злоупотреблений.
* **Уведомления (`user_notifications`)**: Локальная система алертов пользователей. Ссылается на инициатора действия, вакансию, жалобу или отклик.
* **Справочники (`system_reference_items`)**: Словари для хранения динамических списков категорий и полей интерфейса.
