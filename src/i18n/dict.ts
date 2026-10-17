export type Lang = "ru" | "en";
export const dict = {
  ru: {
    home: "Главная", catalog: "Каталог", login: "Вход", register: "Регистрация",
    logout: "Выйти", profile: "Кабинет", admin: "Админка", add_server: "Добавить сервер",
    top_month: "Топ месяца", search_ph: "Поиск по названию, IP...",
    vote: "Проголосовать", voted: "Голос учтён!", copy_ip: "Копировать IP", copied: "Скопировано!",
    apply: "Подать заявку", online: "Онлайн", offline: "Оффлайн",
    forgot: "Забыли пароль?", reset: "Сброс пароля", email: "E-mail", password: "Пароль",
    login_or_email: "Логин или e-mail", do_login: "Войти", do_register: "Создать аккаунт",
    my_servers: "Мои серверы", my_apps: "Мои заявки", notifications: "Уведомления",
    settings: "Настройки", users: "Пользователи", servers: "Серверы", votes: "Голоса",
    audit: "Журнал", stats: "Статистика", save: "Сохранить", delete: "Удалить",
    edit: "Редактировать", approve: "Одобрить", reject: "Отклонить",
    nick: "Игровой ник", contact: "Контакт (Discord/Telegram)", message: "Сообщение",
    theme: "Тема", language: "Язык", dark: "Тёмная", light: "Светлая"
  },
  en: {
    home: "Home", catalog: "Catalog", login: "Login", register: "Sign up",
    logout: "Logout", profile: "Profile", admin: "Admin", add_server: "Add server",
    top_month: "Top of the month", search_ph: "Search by name, IP...",
    vote: "Vote", voted: "Vote counted!", copy_ip: "Copy IP", copied: "Copied!",
    apply: "Apply", online: "Online", offline: "Offline",
    forgot: "Forgot password?", reset: "Reset password", email: "E-mail", password: "Password",
    login_or_email: "Login or e-mail", do_login: "Sign in", do_register: "Create account",
    my_servers: "My servers", my_apps: "My applications", notifications: "Notifications",
    settings: "Settings", users: "Users", servers: "Servers", votes: "Votes",
    audit: "Audit log", stats: "Stats", save: "Save", delete: "Delete",
    edit: "Edit", approve: "Approve", reject: "Reject",
    nick: "Minecraft nick", contact: "Contact (Discord/Telegram)", message: "Message",
    theme: "Theme", language: "Language", dark: "Dark", light: "Light"
  }
} as const;
export type Dict = typeof dict.ru;
