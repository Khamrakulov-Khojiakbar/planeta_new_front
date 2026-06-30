<script setup>
// ────────────────────────────────────────────────
// ДАННЫЕ МАГАЗИНА — отредактируй под себя
// ────────────────────────────────────────────────
const storeInfo = {
  name: 'ПЛАНЕТА',
  address: 'ул. Аскар Шакирова 105, Ош, Кыргызстан',
  phones: ['+996 552 267 777'],
  whatsapp: '+996552267777',          // без + и пробелов, для wa.me ссылки
  instagram: '@planeta.mobile.osh',          // замени на свой
  instagramUrl: 'https://www.instagram.com/planeta.mobile.osh/',
  hours: [
    { day: 'Пн – Вс', time: '10:00 — 22:00' },
  ],
  mapEmbedUrl: 'https://yandex.com/map-widget/v1/?ll=72.812722%2C40.519013&mode=poi&poi%5Bpoint%5D=72.812621%2C40.519006&poi%5Buri%5D=ymapsbm1%3A%2F%2Forg%3Foid%3D230720748842&z=20.68', // вставь сюда iframe-ссылку Google Maps / 2GIS, если есть
}
</script>

<template>
  <div class="contacts-page">

    <!-- HERO -->
    <section class="contacts-hero">
      <span class="hero-label">Свяжитесь с нами</span>
      <h1 class="hero-title">Контакты</h1>
      <p class="hero-sub">Мы всегда рады помочь с выбором или ответить на ваши вопросы</p>
    </section>

    <!-- КАРТОЧКИ -->
    <section class="contact-grid">

      <a :href="`tel:${storeInfo.phones[0].replace(/\s/g, '')}`" class="contact-card">
        <div class="card-icon phone">📞</div>
        <div class="card-body">
          <span class="card-label">Телефон</span>
          <strong class="card-value">{{ storeInfo.phones[0] }}</strong>
        </div>
      </a>

      <a :href="`https://wa.me/${storeInfo.whatsapp}`" target="_blank" class="contact-card">
        <div class="card-icon whatsapp">💬</div>
        <div class="card-body">
          <span class="card-label">WhatsApp</span>
          <strong class="card-value">Написать нам</strong>
        </div>
      </a>

      <a :href="storeInfo.instagramUrl" target="_blank" class="contact-card">
        <div class="card-icon instagram">📷</div>
        <div class="card-body">
          <span class="card-label">Instagram</span>
          <strong class="card-value">{{ storeInfo.instagram }}</strong>
        </div>
      </a>

    </section>

    <!-- АДРЕС + ЧАСЫ -->
    <section class="info-section">
      <div class="info-block">
        <div class="info-icon">📍</div>
        <div>
          <h3>Адрес магазина</h3>
          <p>{{ storeInfo.address }}</p>
        </div>
      </div>
      <div class="info-block">
        <div class="info-icon">🕐</div>
        <div>
          <h3>Часы работы</h3>
          <p v-for="h in storeInfo.hours" :key="h.day">{{ h.day }}: {{ h.time }}</p>
        </div>
      </div>
    </section>

    <!-- КАРТА -->
    <section v-if="storeInfo.mapEmbedUrl" class="map-section">
      <iframe
        :src="storeInfo.mapEmbedUrl"
        width="100%"
        height="380"
        style="border:0; border-radius: 24px;"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
      ></iframe>
    </section>
    <section v-else class="map-placeholder">
      <span>🗺️</span>
      <p>Здесь будет карта с расположением магазина</p>
    </section>

  </div>
</template>

<style scoped>
.contacts-page {
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* HERO */
.contacts-hero {
  text-align: center;
  padding: 56px 20px 48px;
}
.hero-label {
  display: inline-block;
  background: #f1f5f9;
  color: #475569;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  padding: 6px 14px;
  border-radius: 40px;
  margin-bottom: 16px;
}
.hero-title {
  font-size: clamp(32px, 4vw, 48px);
  font-weight: 900;
  color: #0f172a;
  margin: 0 0 12px;
}
.hero-sub {
  font-size: 15px;
  color: #64748b;
  max-width: 480px;
  margin: 0 auto;
  line-height: 1.6;
}

/* CONTACT GRID */
.contact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 48px;
}
.contact-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #fff;
  border: 1.5px solid #f0f4f8;
  border-radius: 20px;
  padding: 20px;
  transition: .22s;
}
.contact-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(0,0,0,.08);
  border-color: #e2e8f0;
}
.card-icon {
  width: 48px; height: 48px;
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}
.card-icon.phone     { background: #eff6ff; }
.card-icon.whatsapp  { background: #ecfdf5; }
.card-icon.instagram { background: #fdf2f8; }
.card-icon.email     { background: #fef3c7; }
.card-body { min-width: 0; }
.card-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: #94a3b8;
  display: block;
  margin-bottom: 3px;
}
.card-value {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

/* ADDRESS + HOURS */
.info-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 32px;
}
.info-block {
  display: flex;
  gap: 16px;
  background: #0f172a;
  border-radius: 24px;
  padding: 28px;
  color: #fff;
}
.info-icon { font-size: 28px; flex-shrink: 0; }
.info-block h3 {
  font-size: 15px;
  font-weight: 800;
  margin: 0 0 8px;
}
.info-block p {
  font-size: 13px;
  color: rgba(255,255,255,.6);
  line-height: 1.6;
  margin: 0;
}

/* MAP */
.map-section { margin-bottom: 32px; }
.map-placeholder {
  background: #f8fafc;
  border: 1.5px dashed #e2e8f0;
  border-radius: 24px;
  padding: 64px 20px;
  text-align: center;
  margin-bottom: 32px;
}
.map-placeholder span { font-size: 40px; display: block; margin-bottom: 12px; }
.map-placeholder p { font-size: 14px; color: #94a3b8; }

/* RESPONSIVE */
@media (max-width: 768px) {
  .info-section { grid-template-columns: 1fr; }
  .contact-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 480px) {
  .contact-grid { grid-template-columns: 1fr; }
}
</style>