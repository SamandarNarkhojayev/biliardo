# Отчёт: Kaspi-интеграция для billiard-pro

## TL;DR

В проекте **уже есть скелет интеграции** ([kaspi-client.ts](vscode-webview://1mcqav0g8vnomqb7lepmq488ueldvafkbhvbv9cq8s22mfje1lov/services/payment/src/kaspi-client.ts), [routes.ts](vscode-webview://1mcqav0g8vnomqb7lepmq488ueldvafkbhvbv9cq8s22mfje1lov/services/payment/src/routes.ts), [schema.prisma](vscode-webview://1mcqav0g8vnomqb7lepmq488ueldvafkbhvbv9cq8s22mfje1lov/services/payment/prisma/schema.prisma)) — `Payment` + `Subscription`, stub/live режимы, webhook с HMAC-SHA256. Что осталось:

1. **Подать заявку на Kaspi WebPay** (без неё API недоступно)
2. **Получить от Kaspi реальные endpoints** и заменить угаданные в `KaspiLiveClient`
3. **Допилить billing-обвязку** (cron на expiry/renewal, страница "моя подписка")

---

## 1. Какой именно API Kaspi нужен

У Kaspi для бизнеса **два разных API** , легко перепутать:

| API                                                  | Для чего                                                  | Подойдёт ли                                                              |
| ---------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Kaspi Shop API** (Магазин)                         | Маркетплейс-продавцы, токен прямо в кабинете              | ❌ нет, это про товары                                                   |
| **Kaspi QR Merchant API** (`qrapi-cert-ip.kaspi.kz`) | Офлайн касса/POS, регистрация устройств на торговой точке | ⚠️ Можно, но это POS-парадигма (invoice + ORG_BIN + DEVICE_TOKEN + mTLS) |
| **Kaspi Pay / WebPay** (онлайн-эквайринг)            | Оплата на сайте по QR / по ссылке                         | ✅**Это и есть нужный путь**                                             |

Для SaaS-сайта с QR-оплатой подписки — **WebPay** . Заявка тут: [kaspi.kz/webpay/partnership](https://kaspi.kz/webpay/partnership).

---

## 2. Организационная часть (без неё API не дадут)

**Что нужно:**

- ИП/ТОО с регистрацией в РК ✅ (у тебя есть)
- Расчётный счёт (логично — в Kaspi Business)
- ЭЦП
- Сайт с **HTTPS** и **публичной офертой + политикой возврата** (Kaspi проверяет)

**Шаги:**

1. Заявка на kaspi.kz/webpay/partnership → указываешь категорию (для SaaS обычно "Интернет-услуги" / "ПО"), БИН/ИИН, контакты
2. Рассмотрение **3–5 рабочих дней**
3. Подписание договора → выдают:
   - Технический регламент (PDF, не публичный)
   - API URL + Merchant ID + API key
   - Sandbox-доступ
   - Webhook secret для HMAC
   - Возможно SSL-клиентский сертификат (mTLS, режим STRONG)
4. Запуск в prod после прохождения тестов на их стороне
5. Полный цикл: **6–15 рабочих дней**

**Комиссия:** для интернет-услуг ~3% от платежа (точную ставку выдадут в договоре; для Kaspi Gold напрямую — 0.95%, остальное зависит от категории).

**Контакт для технических вопросов:** `pay@kaspi.kz`.

---

## 3. Как технически работает QR-оплата

```
User жмёт "Оплатить" → backend POST /payments
   ↓
payment-service создаёт Payment(PENDING) в БД
   ↓
kaspi.createOrder() → Kaspi возвращает {externalId, qrPayload, paymentUrl, expiresAt}
   ↓
Фронт рендерит QR (qrPayload в <QRCode/>) либо редиректит на paymentUrl
   ↓
User сканирует в приложении Kaspi.kz и подтверждает
   ↓
Kaspi → POST /payments/webhook/kaspi (HMAC-подпись в заголовке)
   ↓
processWebhook() ставит COMPLETED + создаёт Subscription на 30 дней
   ↓
Фронт polling-ом дёргает GET /payments/:id → видит COMPLETED → показывает success
```

Все эти куски в [routes.ts](vscode-webview://1mcqav0g8vnomqb7lepmq488ueldvafkbhvbv9cq8s22mfje1lov/services/payment/src/routes.ts:48-225) уже написаны.

---

## 4. Что есть в коде сейчас и что менять

### ✅ Готово

- Схема БД: `Payment`, `Subscription` ([schema.prisma:50-91](vscode-webview://1mcqav0g8vnomqb7lepmq488ueldvafkbhvbv9cq8s22mfje1lov/services/payment/prisma/schema.prisma#L50-L91))
- Stub-клиент для dev ([kaspi-client.ts:47-68](vscode-webview://1mcqav0g8vnomqb7lepmq488ueldvafkbhvbv9cq8s22mfje1lov/services/payment/src/kaspi-client.ts#L47-L68))
- Live-клиент с HTTP-вызовом + HMAC ([kaspi-client.ts:70-140](vscode-webview://1mcqav0g8vnomqb7lepmq488ueldvafkbhvbv9cq8s22mfje1lov/services/payment/src/kaspi-client.ts#L70-L140))
- Webhook endpoint с проверкой подписи ([routes.ts:183-199](vscode-webview://1mcqav0g8vnomqb7lepmq488ueldvafkbhvbv9cq8s22mfje1lov/services/payment/src/routes.ts#L183-L199))
- Идемпотентный processWebhook ([routes.ts:231-293](vscode-webview://1mcqav0g8vnomqb7lepmq488ueldvafkbhvbv9cq8s22mfje1lov/services/payment/src/routes.ts#L231-L293))
- Конфиг с гардами prod ([config.ts:53-72](vscode-webview://1mcqav0g8vnomqb7lepmq488ueldvafkbhvbv9cq8s22mfje1lov/services/payment/src/config.ts#L53-L72))

### ⚠️ Что надо допилить **после получения техрегламента**

В [kaspi-client.ts:86-124](vscode-webview://1mcqav0g8vnomqb7lepmq488ueldvafkbhvbv9cq8s22mfje1lov/services/payment/src/kaspi-client.ts#L86-L124) пути и поля **угаданы** (`/v2/orders`, `merchantOrderId`, `Bearer ...`, `X-Merchant-Id`). Реальные имена приходят в PDF от Kaspi. Скорее всего поменяется:

- URL → что-то типа `https://kaspi.kz/api/v01/...` или `qrapi.kaspi.kz`
- Метод `scan` / `register` / `notifyPayment` (для QR Merchant) **либо** invoice-флоу через WebPay
- Авторизация — может быть **mTLS-сертификат** вместо bearer-токена (см. config STRONG в PHP SDK)
- Подпись webhook — обычно HMAC-SHA256, но Kaspi иногда подписывает client-cert'ом

### ❌ Чего ещё нет в коде (нужно добавить для полноценного billing)

1. **Cron-задача expiry** : PENDING-платежи старше `PAYMENT_EXPIRY_MINUTES` → `EXPIRED`
2. **Renewal-напоминания** : за 3 дня до `Subscription.endsAt` → email/push "продлите подписку"
3. **Cron auto-expire подписок** : когда `endsAt < now` и статус `ACTIVE` → `EXPIRED`
4. **UI** :

- Страница "Моя подписка" с датой окончания (есть API `/subscriptions/me`, но фронта на неё ещё может не быть — проверь `apps/web`)
- Страница "История платежей" (API уже есть: `/payments/me/history`)
- QR-страница с rendering `qrPayload` через `qrcode`/`qrcode.react`
- `/payment/return` страница для редиректа после оплаты

1. **Возвраты** (refund): Kaspi требует политику возврата → endpoint `POST /payments/:id/refund` для админа
2. **Фискальный чек** : если используешь Kaspi Кассу — чек пробивается автоматически на их стороне; иначе нужна интеграция с Webkassa/Rekassa, **это отдельная история**

---

## 5. Важный нюанс: Kaspi не делает recurring-подписки

В отличие от Stripe, у Kaspi **нет автосписания** . Каждый платёж — это разовый invoice. Подписка реализуется на твоей стороне:

- За N дней до конца → шлёшь напоминание
- Юзер сам жмёт "продлить" → создаётся новый Payment → новый QR → оплата
- В коде уже верно: при COMPLETED продлеваем на 30 дней от `Math.max(now, existing.endsAt)` ([routes.ts:268-286](vscode-webview://1mcqav0g8vnomqb7lepmq488ueldvafkbhvbv9cq8s22mfje1lov/services/payment/src/routes.ts#L268-L286))

Если хочется "почти-recurring" — можно сохранять `linkedPaymentMethodToken` от Kaspi (если выдают; уточнить в договоре), но обычно это не предусмотрено.

---

## 6. Альтернативы (если Kaspi откажет / долго)

| Вариант                                                                                                        | Плюсы                                      | Минусы                                                           |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------- |
| **AiPay / PayBot** ([aipay.kz](https://www.aipay.kz/en))                                                       | Подключение за день, webhooks, ИП не нужно | Парсинг push-уведомлений с твоего телефона, не официально, риски |
| **Craftgate** ([developer.craftgate.io](https://developer.craftgate.io/en/alternative-payment-methods/kaspi/)) | Турецкий PSP с Kaspi-методом               | Двойная комиссия, договор с Craftgate                            |
| **OneLab модуль** ([onelab.kz](https://onelab.kz/en/product/modul-oplaty-kaspi-kz-kaspi-qr/))                  | Готовый плагин                             | Для CMS (1С-Битрикс), не подойдёт под Node.js монорепо           |

Рекомендация: **идти официальным путём Kaspi WebPay** , параллельно держать `stub` режим для разработки.

---

## 7. Что я предлагаю сделать дальше

| Шаг                                                                                  | Кто             | Когда                 |
| ------------------------------------------------------------------------------------ | --------------- | --------------------- |
| 1. Подать заявку на kaspi.kz/webpay/partnership                                      | Ты              | Сегодня               |
| 2. Подготовить оферту + политику возврата на сайте                                   | Можно сделать   | Пока ждём ответ Kaspi |
| 3. Допилить cron expiry для PENDING + auto-expire Subscription                       | Можно сделать   | Пока ждём             |
| 4. UI: QR-страница + страница "Моя подписка" в `apps/web`                            | Можно сделать   | Пока ждём             |
| 5. Получить договор + техрегламент → заменить угаданные URL/поля в `KaspiLiveClient` | После одобрения | +3-5 дней             |
| 6. Прогнать sandbox-тесты Kaspi → переключить `KASPI_MODE=live`                      | После договора  | +6-15 дней            |

Хочешь — сразу начну с пунктов 3-4 (cron expiry, страница "Моя подписка", QR-рендеринг), пока ты подаёшь заявку?

---

**Источники:**

- [Kaspi WebPay Partnership](https://kaspi.kz/webpay/partnership)
- [Kaspi Pay Business](https://business.kaspi.kz/pay/)
- [Технический регламент Kaspi Pay (PDF)](https://kaspipay.kz/documents/p5r.pdf)
- [Kaspi QR PHP SDK (burcev-alex)](https://github.com/burcev-alex/kaspi-qr-sdk) — показывает реальные endpoints `qrapi-cert-ip.kaspi.kz`
- [Kaspi Merchant API Go (abdymazhit)](https://github.com/abdymazhit/kaspi-merchant-api)
- [OSN.kz: гайд по интеграции Kaspi Pay](https://osn.kz/blog/kaspi-bank-api-integration-guide)
- [Craftgate: Kaspi alternative payment](https://developer.craftgate.io/en/alternative-payment-methods/kaspi/)
- [Kaspi Партнёрский Гид: API Магазина](https://guide.kaspi.kz/partner/ru/shop/api/general/q3193)
- [AiPay (неофициальная автоматизация)](https://www.aipay.kz/en)
