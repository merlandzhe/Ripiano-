
import React from 'react';
import './compliance.css';

/** Temporary safeguard: personal-data collection remains paused until the
 * RIPIANO database and all receiving endpoints are moved to Russian-hosted infrastructure.
 * Restore only after the operator completes a privacy/legal review.
 */
export const REQUESTS_ENABLED=false;

export function OnlineRequestsPaused(){
 return <div className="rp-online-paused" role="status">
  <h3>Онлайн-заявки временно недоступны</h3>
  <p>Мы обновляем систему защиты персональных данных. Каталог и конструктор работают в режиме просмотра. Для уточнения цены и оформления заказа свяжитесь с RIPIANO по телефону.</p>
  <a href="tel:+79651003900">Позвонить: +7 (965) 100-39-00</a>
  <small>Пожалуйста, не отправляйте личные данные через формы до завершения обновления.</small>
 </div>;
}
