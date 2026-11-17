# RIPIANO

Мебельный интернет-магазин с каталогом, корзиной, заявками и кабинетом владельца.

## Стек
React + Vite, Supabase (Auth, Postgres, Storage), Vercel.

## Настройка
1. Установите зависимости: `npm install`.
2. Запуск: `npm run dev`. Сборка: `npm run build`.
3. На Supabase создана таблица `ripiano_products` и роли по RLS.
4. Для кабинета: владелец регистрирует email через `/admin`, после подтверждения почты его UUID надо добавить в `public.ripiano_admins` через SQL Editor: `insert into public.ripiano_admins(user_id) select id from auth.users where email = 'EMAIL_ВЛАДЕЛЬЦА' on conflict do nothing;`. Не делайте открытой самостоятельную выдачу доступа администратора.
5. Фотографии загружаются владельцем в Storage bucket `ripiano-products`. Для начальных карточек используются пути `/images/…`; при обновлении фото заменяется URL.
6. Включите проверку rate-limit/CAPTCHA перед рекламным запуском, настройте почтовые уведомления и политику персональных данных для обработки заказов.

В репозитории не хранятся secret/service-role ключи Supabase. Publishable key используется с RLS.
