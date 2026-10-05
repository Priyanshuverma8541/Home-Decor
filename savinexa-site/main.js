/**
 * main.js — application entry.
 *
 *   1. fetch the site content (data/content.json) with utils/fetcher.js
 *   2. render every page section from that data
 *   3. mount the Navbar and Modal components
 *   4. wire up the enquiry form, scroll-reveal and the footer
 */
import { Navbar } from './src/components/Navbar/Navbar.js';
import { Modal } from './src/components/Modal/Modal.js';
import { fetchJSON, postJSON, FetchError } from './src/utils/fetcher.js';
import { icon } from './src/utils/icons.js';

/* -------------------------------------------------------------------------
   Helpers
   ------------------------------------------------------------------------- */
const CONTENT_URL = 'data/content.json';

const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const safeHref = (value) => {
  try {
    const url = new URL(String(value || ''), document.baseURI);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol) ? url.href : '#';
  } catch { return '#'; }
};

const reveal = (i = 0) => `data-reveal style="--i:${i}"`;

const formatPhone = (n) => (/^\d{10}$/.test(n) ? `${n.slice(0, 5)} ${n.slice(5)}` : n);
const telHref = (n, cc) => `tel:+${cc}${n.replace(/\D/g, '')}`;

const sectionHead = ({ eyebrow, title, intro }, { center = false } = {}) => `
  <div class="section__head ${center ? 'section__head--center' : ''}" ${reveal()}>
    <p class="eyebrow">${esc(eyebrow)}</p>
    <h2 class="section__title">${esc(title)}</h2>
    ${intro ? `<p class="section__intro">${esc(intro)}</p>` : ''}
  </div>`;

const checkList = (items, badgeClass) => `
  <ul class="check-list">
    ${items
      .map(
        (text, i) => `
      <li ${reveal(i)}>
        <span class="badge ${badgeClass}">${icon('check', { size: 16 })}</span>
        <span>${esc(text)}</span>
      </li>`
      )
      .join('')}
  </ul>`;

const iconCard = ({ icon: name, title, text }, i, { variant = '', badge = '', row = false } = {}) => `
  <article class="card ${variant} ${row ? 'card--row' : ''}" ${reveal(i)}>
    <span class="badge ${badge}">${icon(name, { size: 22 })}</span>
    <div>
      <h3>${esc(title)}</h3>
      <p>${esc(text)}</p>
    </div>
  </article>`;

/* -------------------------------------------------------------------------
   Sections
   ------------------------------------------------------------------------- */
const sections = {
  hero(d) {
    const icons = d.approach.steps.map((s) => s.icon);
    return `
    <section class="hero" id="top" aria-labelledby="hero-title">
      <div class="hero__bg" aria-hidden="true"></div>
      <div class="container hero__grid">
        <div class="hero__copy">
          <p class="eyebrow" ${reveal(0)}>${esc(d.hero.eyebrow)}</p>
          <h1 class="hero__title" id="hero-title" ${reveal(1)}>${esc(d.hero.title)}</h1>
          <p class="hero__lead" ${reveal(2)}>${esc(d.hero.lead)}</p>
          <div class="hero__actions" ${reveal(3)}>
            <button type="button" class="btn btn--gold" data-open-enquiry>
              ${esc(d.hero.primaryCta)} ${icon('arrow', { size: 18 })}
            </button>
            <a class="btn btn--ghost" href="#services">${esc(d.hero.secondaryCta)}</a>
          </div>
          <p class="hero__audience" ${reveal(4)}>${esc(d.hero.audience)}</p>
        </div>

        <ol class="hero__chain" aria-label="How SaviNexa works" ${reveal(3)}>
          ${d.hero.chain
            .map(
              (label, i) => `
            <li class="chain-item">
              <span class="badge">${icon(icons[i] ?? 'check', { size: 20 })}</span>
              <span class="chain-item__label"><span class="chain-item__step">Step ${i + 1}</span>${esc(label)}</span>
            </li>`
            )
            .join('')}
        </ol>
      </div>
    </section>`;
  },

  about(d) {
    return `
    <section class="section section--white" id="about" aria-labelledby="about-title">
      <div class="container split">
        <div>
          ${sectionHead(d.about).replace('<h2 ', '<h2 id="about-title" ')}
          <div class="prose" ${reveal(1)}>
            ${d.about.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}
          </div>
        </div>
        <ul class="about-points">
          ${d.about.highlights
            .map(
              (h, i) => `
            <li class="about-point" ${reveal(i + 1)}>
              <span class="badge">${icon(h.icon, { size: 22 })}</span>
              <span>${esc(h.text)}</span>
            </li>`
            )
            .join('')}
        </ul>
      </div>
    </section>`;
  },

  challenge(d) {
    return `
    <section class="section section--deep" id="challenge">
      <div class="container">
        ${sectionHead(d.challenge)}
        <div class="grid grid--2">
          ${d.challenge.items.map((it, i) => iconCard(it, i, { variant: 'card--glass', badge: 'badge--gold', row: true })).join('')}
        </div>
      </div>
    </section>`;
  },

  approach(d) {
    return `
    <section class="section section--white" id="approach">
      <div class="container">
        ${sectionHead(d.approach, { center: true })}
        <ol class="chain">
          ${d.approach.steps
            .map(
              (s, i) => `
            <li class="chain__step" ${reveal(i)}>
              <span class="chain__node">${icon(s.icon, { size: 32 })}</span>
              <div>
                <h3>${esc(s.title)}</h3>
                <p>${esc(s.text)}</p>
              </div>
            </li>`
            )
            .join('')}
        </ol>
      </div>
    </section>`;
  },

  services(d) {
    return `
    <section class="section section--paper" id="services">
      <div class="container">
        ${sectionHead(d.services)}
        <div class="grid grid--3">
          ${d.services.items.map((it, i) => iconCard(it, i)).join('')}
        </div>
      </div>
    </section>`;
  },

  process(d) {
    return `
    <section class="section section--white" id="process">
      <div class="container">
        ${sectionHead(d.process, { center: true })}
        <ol class="steps">
          ${d.process.steps
            .map(
              (s, i) => `
            <li class="step" ${reveal(i)}>
              <span class="step__badge">${icon(s.icon, { size: 26 })}</span>
              <div>
                <h3>${esc(s.title)}</h3>
                <p>${esc(s.text)}</p>
              </div>
            </li>`
            )
            .join('')}
        </ol>
      </div>
    </section>`;
  },

  different(d) {
    return `
    <section class="section section--navy" id="${esc(d.different.id)}">
      <div class="container">
        ${sectionHead(d.different)}
        <div class="grid grid--3 feature-grid">
          ${d.different.items.map((it, i) => iconCard(it, i, { variant: 'card--glass', badge: 'badge--gold' })).join('')}
        </div>
      </div>
    </section>`;
  },

  value(d) {
    return `
    <section class="section section--paper" id="value">
      <div class="container">
        ${sectionHead(d.value)}
        <div class="grid grid--3">
          ${d.value.items.map((it, i) => iconCard(it, i)).join('')}
        </div>
      </div>
    </section>`;
  },

  industries(d) {
    const group = (label, items, badge) => `
      <div class="tile-group">
        <h3 class="tile-group__label" ${reveal()}>${esc(label)}</h3>
        <ul class="tiles">
          ${items
            .map(
              (t, i) => `
            <li class="tile" ${reveal(i)}>
              <span class="badge ${badge}">${icon(t.icon, { size: 24 })}</span>
              ${esc(t.label)}
            </li>`
            )
            .join('')}
        </ul>
      </div>`;

    return `
    <section class="section section--white" id="industries">
      <div class="container">
        ${sectionHead(d.industries)}
        ${group(d.industries.industriesLabel, d.industries.industries, 'badge--ice')}
        ${group(d.industries.functionsLabel, d.industries.functions, '')}
        <div class="industries-note" ${reveal()}>
          <p>${esc(d.industries.note)}</p>
          <a class="btn btn--navy" href="#audience">${esc(d.industries.cta)} ${icon('arrow', { size: 18 })}</a>
        </div>
      </div>
    </section>`;
  },

  audience(d) {
    const a = d.audience;
    return `
    <section class="section section--navy" id="audience">
      <div class="container split split--even">
        <div>
          ${sectionHead(a)}
          ${checkList(a.items, 'badge--gold')}
        </div>
        <aside class="panel panel--white" ${reveal(2)}>
          <h3>${esc(a.categoriesTitle)}</h3>
          <ul class="chips">
            ${a.categories.map((c) => `<li class="chip">${esc(c)}</li>`).join('')}
          </ul>
          <p class="panel__note">${esc(a.categoriesNote)}</p>
        </aside>
      </div>
    </section>`;
  },

  partner(d) {
    const p = d.partner;
    return `
    <section class="section section--paper" id="partner">
      <div class="container split split--even">
        <div>
          ${sectionHead(p)}
          ${checkList(p.items, '')}
        </div>
        <aside class="panel panel--navy" ${reveal(2)}>
          <span class="badge badge--gold" style="width:56px;height:56px">${icon('handshake', { size: 28 })}</span>
          <h3>${esc(p.commitmentTitle)}</h3>
          <p>${esc(p.commitment)}</p>
        </aside>
      </div>
    </section>`;
  },

  vision(d) {
    return `
    <section class="section section--white" id="vision">
      <div class="container">
        ${sectionHead(d.vision)}
        <div class="grid grid--2">
          ${d.vision.items.map((it, i) => iconCard(it, i, { variant: 'card--tint', row: true })).join('')}
        </div>
      </div>
    </section>`;
  },

  contact(d) {
    const c = d.contact;
    const cc = d.site.countryCode;
    const messageMarkup = c.message
      ? `<p class="contact__message">${esc(c.message).replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noreferrer noopener">$1</a>').replace(/\n/g, '<br>')}</p>`
      : '';

    const cards = [
      ...c.socials.map(
        (s) => `
        <div class="contact-card" ${reveal()}>
          <span class="badge">${icon(s.icon || 'globe', { size: 22 })}</span>
          <div>
            <span class="contact-card__label">${esc(s.label)}</span>
            <a class="contact-card__value" href="${esc(safeHref(s.url))}" target="_blank" rel="noreferrer noopener">${esc(s.label)}</a>
          </div>
        </div>`
      ),
      ...c.phones.map(
        (p) => `
        <div class="contact-card" ${reveal()}>
          <span class="badge">${icon('phone', { size: 22 })}</span>
          <div>
            <span class="contact-card__label">Phone</span>
            <a class="contact-card__value" href="${esc(telHref(p.number, cc))}">${esc(formatPhone(p.number))}</a>
            <span class="contact-card__name">${esc(p.name)}</span>
          </div>
        </div>`
      ),
      c.email
        ? `<div class="contact-card" ${reveal()}>
            <span class="badge">${icon('envelope', { size: 22 })}</span>
            <div>
              <span class="contact-card__label">Email</span>
              <a class="contact-card__value" href="mailto:${esc(c.email)}">${esc(c.email)}</a>
            </div>
          </div>`
        : '',
      c.office
        ? `<div class="contact-card" ${reveal()}>
            <span class="badge">${icon('pin', { size: 22 })}</span>
            <div>
              <span class="contact-card__label">Office</span>
              <span class="contact-card__value">${esc(c.office)}</span>
            </div>
          </div>`
        : '',
    ].join('');

    return `
    <section class="section section--navy" id="contact" aria-labelledby="contact-title">
      <div class="container split split--even">
        <div>
          <div ${reveal()}>
            <p class="eyebrow">${esc(c.eyebrow)}</p>
            <h2 class="section__title" id="contact-title">${esc(c.title)}</h2>
            <p class="contact__sub">${esc(c.subtitle)}</p>
            ${messageMarkup}
          </div>
          <button type="button" class="btn btn--gold" data-open-enquiry ${reveal(1)}>
            ${esc(c.cta)} ${icon('arrow', { size: 18 })}
          </button>
        </div>
        <div class="contact-list">${cards}</div>
      </div>
    </section>`;
  },
};

const footer = (d) => `
  <footer class="footer">
    <div class="container footer__inner">
      <div class="footer__brand">
        <span class="logo-tile"><img src="assets/logo-mark.png" alt="" width="25" height="21" /></span>
        ${esc(d.site.name)}
      </div>
      <p class="footer__chain">${esc(d.hero.chain.join('  →  '))}</p>
      <p class="footer__legal">© ${new Date().getFullYear()} ${esc(d.site.name)} · ${esc(d.site.descriptor)}. All rights reserved.</p>
    </div>
  </footer>`;

/* -------------------------------------------------------------------------
   Enquiry form (shown inside the Modal)
   ------------------------------------------------------------------------- */
const enquiryFormHTML = (d) => `
  <form class="form" novalidate>
    <div class="form__row form__row--2">
      <div class="field">
        <label for="enq-name">Your name</label>
        <input id="enq-name" name="name" type="text" autocomplete="name" required />
      </div>
      <div class="field">
        <label for="enq-company">Company</label>
        <input id="enq-company" name="company" type="text" autocomplete="organization" required />
      </div>
    </div>
    <div class="form__row form__row--2">
      <div class="field">
        <label for="enq-phone">Phone</label>
        <input id="enq-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" required />
      </div>
      <div class="field">
        <label for="enq-email">Email <small>(optional)</small></label>
        <input id="enq-email" name="email" type="email" autocomplete="email" />
      </div>
    </div>
    <div class="field">
      <label for="enq-need">What are you looking for?</label>
      <select id="enq-need" name="need" required>
        ${d.enquiryNeeds.map((n) => `<option>${esc(n)}</option>`).join('')}
      </select>
    </div>
    <div class="field">
      <label for="enq-message">Tell us about the role or requirement</label>
      <textarea id="enq-message" name="message" placeholder="Roles, seniority, headcount, timelines…" required></textarea>
    </div>

    <!-- honeypot: real visitors never see or fill this -->
    <div class="form__hp" aria-hidden="true">
      <label>Website <input type="text" name="website" tabindex="-1" autocomplete="off" /></label>
    </div>

    <div class="form__error" role="alert" hidden></div>
    <button type="submit" class="btn btn--gold btn--block">Send enquiry ${icon('arrow', { size: 18 })}</button>
    <p class="form__hint">${
      d.site.formEndpoint
        ? 'We treat every enquiry in confidence.'
        : 'This opens WhatsApp with your enquiry ready to send to our team.'
    }</p>
  </form>`;

const doneHTML = (kind) => `
  <div class="form-done">
    <span class="badge badge--gold">${icon('check', { size: 30 })}</span>
    <h3>${kind === 'sent' ? 'Thank you — enquiry received' : 'Your enquiry is ready in WhatsApp'}</h3>
    <p>${
      kind === 'sent'
        ? 'Our team will get back to you shortly. If it is urgent, please call us using the numbers on this page.'
        : 'Press send in WhatsApp to reach our team. If it did not open, you can call us using the numbers on this page.'
    }</p>
    <button type="button" class="btn btn--navy" data-modal-close>Close</button>
  </div>`;

function whatsappURL(d, data) {
  const target = `${d.site.countryCode}${d.contact.phones[0].number.replace(/\D/g, '')}`;
  const text = [
    `Hello ${d.site.name}, I'd like to discuss a hiring requirement.`,
    '',
    `Name: ${data.name}`,
    `Company: ${data.company}`,
    `Phone: ${data.phone}`,
    data.email ? `Email: ${data.email}` : null,
    `Looking for: ${data.need}`,
    '',
    data.message,
  ]
    .filter((line) => line !== null)
    .join('\n');
  return `https://wa.me/${target}?text=${encodeURIComponent(text)}`;
}

function openEnquiry(modal, d) {
  modal.open({
    title: 'Start a hiring conversation',
    subtitle: 'Tell us what you need — we will take it from there.',
    body: enquiryFormHTML(d),
  });

  const form = modal.content.querySelector('form');
  const errorBox = form.querySelector('.form__error');
  const submit = form.querySelector('button[type="submit"]');
  form.querySelector('input')?.focus();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const data = Object.fromEntries(new FormData(form));
    if (data.website) return; // honeypot tripped
    delete data.website;

    errorBox.hidden = true;
    submit.disabled = true;

    const finish = (kind) => {
      modal.setBody(doneHTML(kind));
      modal.content.querySelector('[data-modal-close]')?.addEventListener('click', () => modal.close());
    };

    try {
      if (d.site.formEndpoint) {
        await postJSON(d.site.formEndpoint, data, { timeout: 15000 });
        finish('sent');
      } else {
        window.open(whatsappURL(d, data), '_blank', 'noopener');
        finish('whatsapp');
      }
    } catch (err) {
      errorBox.textContent =
        err instanceof FetchError
          ? 'We could not send your enquiry just now. Please try again, or call us using the numbers on this page.'
          : 'Something went wrong. Please try again.';
      errorBox.hidden = false;
      submit.disabled = false;
    }
  });
}

/* -------------------------------------------------------------------------
   Scroll reveal
   ------------------------------------------------------------------------- */
function initReveal(root = document) {
  const targets = root.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
  );
  targets.forEach((el) => io.observe(el));
}


function trackEvent(name, metadata, data) {
  var details = { event: name, metadata: metadata || {}, timestamp: Date.now() };
  window.dispatchEvent(new CustomEvent('savinexa:analytics', { detail: details }));
  if (data && data.site && data.site.eventEndpoint) postJSON(data.site.eventEndpoint, { eventType: name, metadata: metadata || {} }, { timeout: 4000 }).catch(function () {});
}

function enhancePage(data) {
  var hero = document.querySelector('.hero');
  var heroImage = document.createElement('img');
  heroImage.className = 'hero__photo';
  heroImage.src = data.hero.image || 'assets/1.jpeg';
  heroImage.alt = data.hero.imageAlt || '';
  heroImage.width = 1280;
  heroImage.height = 853;
  heroImage.fetchPriority = 'high';
  heroImage.decoding = 'async';
  hero.appendChild(heroImage);
  var network = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  network.classList.add('hero__network');
  network.setAttribute('viewBox', '0 0 600 420');
  network.setAttribute('aria-hidden', 'true');
  network.setAttribute('focusable', 'false');
  network.innerHTML = '<path d="M65 300 170 210 285 270 390 120 530 175M170 210 210 75 390 120 470 340 285 270 110 385"/><circle cx="65" cy="300" r="9"/><circle cx="170" cy="210" r="11"/><circle cx="285" cy="270" r="8"/><circle cx="390" cy="120" r="12"/><circle cx="530" cy="175" r="8"/><circle cx="210" cy="75" r="7"/><circle cx="470" cy="340" r="10"/><circle cx="110" cy="385" r="6"/>';
  hero.appendChild(network);
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    hero.addEventListener('pointermove', function (event) {
      var box = hero.getBoundingClientRect();
      var x = (event.clientX - box.left) / box.width - .5;
      var y = (event.clientY - box.top) / box.height - .5;
      network.style.setProperty('--tilt-x', (y * -3).toFixed(2) + 'deg');
      network.style.setProperty('--tilt-y', (x * 4).toFixed(2) + 'deg');
    }, { passive: true });
    hero.addEventListener('pointerleave', function () { network.style.setProperty('--tilt-x', '0deg'); network.style.setProperty('--tilt-y', '0deg'); }, { passive: true });
  }

  var points = document.querySelector('.about-points');
  if (points && data.about.image) {
    var figure = document.createElement('figure');
    figure.className = 'about__photo';
    figure.innerHTML = '<img src="' + esc(data.about.image) + '" alt="' + esc(data.about.imageAlt || '') + '" width="916" height="1280" loading="lazy" decoding="async"><figcaption>People first. Outcomes always.</figcaption>';
    var aside = document.createElement('div'); aside.className = 'about__aside';
    points.parentElement.insertBefore(aside, points); aside.appendChild(figure); aside.appendChild(points);
  }

  document.querySelectorAll('#services .card').forEach(function (card, index) {
    card.classList.add('service-card');
    var photo = data.services.items[index] && data.services.items[index].image;
    if (photo) { var image = document.createElement('img'); image.className = 'service-card__image'; image.src = photo; image.alt = ''; image.width = 720; image.height = 1280; image.loading = 'lazy'; image.decoding = 'async'; card.prepend(image); }
    var title = card.querySelector('h3');
    if (!title) return;
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'service-card__link';
    button.dataset.serviceSelect = title.textContent;
    button.innerHTML = 'Discuss this service ' + icon('arrow', { size: 16 });
    card.appendChild(button);
  });

  var processList = document.querySelector('#process .steps');
  if (processList && data.process.image) {
    var processFigure = document.createElement('figure');
    processFigure.className = 'process-photo';
    processFigure.innerHTML = '<img src="' + esc(data.process.image) + '" alt="' + esc(data.process.imageAlt || '') + '" width="720" height="1280" loading="lazy" decoding="async"><figcaption>A clear process from role brief to onboarding.</figcaption>';
    processList.after(processFigure);
  }
  var industryNote = document.querySelector('#industries .industries-note');
  if (industryNote && data.industries.image) {
    var industryFigure = document.createElement('img');
    industryFigure.className = 'industries-photo'; industryFigure.src = data.industries.image; industryFigure.alt = data.industries.imageAlt || '';
    industryFigure.width = 720; industryFigure.height = 1280; industryFigure.loading = 'lazy'; industryFigure.decoding = 'async';
    industryNote.prepend(industryFigure);
  }

  var process = data.process.steps || [];
  document.querySelectorAll('#process .step').forEach(function (item, index) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'step__activate';
    button.textContent = 'Focus this step';
    button.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');
    button.addEventListener('click', function () {
      document.querySelectorAll('#process .step__activate').forEach(function (other) {
        other.setAttribute('aria-pressed', String(other === button));
      });
      document.querySelectorAll('#process .step').forEach(function (other) {
        other.classList.toggle('is-active', other === item);
      });
      trackEvent('process_step_view', { step: process[index] && process[index].title }, data);
    });
    item.appendChild(button);
    if (index === 0) item.classList.add('is-active');
  });

  var industrySection = document.getElementById('industries');
  if (industrySection) {
    var controls = document.createElement('div');
    controls.className = 'category-controls';
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', 'Filter hiring categories');
    controls.innerHTML = '<button type="button" class="category-filter is-active" data-category-filter="all" aria-pressed="true">All categories</button><button type="button" class="category-filter" data-category-filter="Industries" aria-pressed="false">Industries</button><button type="button" class="category-filter" data-category-filter="Functions" aria-pressed="false">Functions</button>';
    industrySection.querySelector('.section__head').after(controls);
    var groups = Array.from(industrySection.querySelectorAll('.tile-group'));
    groups.forEach(function (group, index) { group.dataset.tileGroup = index === 0 ? 'Industries' : 'Functions'; });
    controls.addEventListener('click', function (event) {
      var button = event.target.closest('[data-category-filter]');
      if (!button) return;
      controls.querySelectorAll('button').forEach(function (item) {
        var selected = item === button;
        item.classList.toggle('is-active', selected);
        item.setAttribute('aria-pressed', String(selected));
      });
      groups.forEach(function (group) { group.hidden = button.dataset.categoryFilter !== 'all' && group.dataset.tileGroup !== button.dataset.categoryFilter; });
      trackEvent('category_filter', { category: button.dataset.categoryFilter }, data);
    });
  }

  var careers = data.careers || {};
  var careersSection = document.createElement('section');
  careersSection.className = 'section careers';
  careersSection.id = 'careers';
  careersSection.setAttribute('aria-labelledby', 'careers-title');
  var jobMarkup = (careers.jobs || []).filter(function (job) { return job && job.title; }).map(function (job) {
    var destination = job.applyUrl || ('mailto:' + encodeURI(data.contact.email) + '?subject=' + encodeURIComponent('Application — ' + job.title));
    return '<article class="job-card"><div><h3>' + esc(job.title) + '</h3><p>' + esc([job.location, job.type].filter(Boolean).join(' · ')) + '</p>' + (job.description ? '<p>' + esc(job.description) + '</p>' : '') + '</div><a class="btn btn--navy" href="' + esc(safeHref(destination)) + '">Apply ' + icon('arrow', { size: 18 }) + '</a></article>';
  }).join('');
  careersSection.innerHTML = '<div class="container careers__inner"><div><p class="eyebrow">' + esc(careers.eyebrow || 'For talent') + '</p><h2 class="section__title" id="careers-title">' + esc(careers.title || 'Careers at SaviNexa') + '</h2><p class="section__intro">' + esc(careers.intro || '') + '</p></div><div class="careers__list">' + (jobMarkup || '<p class="careers__empty">' + esc(careers.emptyLabel || 'No current roles are listed.') + '</p>') + '<a class="btn btn--gold" href="mailto:' + encodeURI(data.contact.email) + '?subject=' + encodeURIComponent(careers.emailSubject || 'Candidate profile — SaviNexa') + '">' + esc(careers.cta || 'Share your profile') + ' ' + icon('arrow', { size: 18 }) + '</a></div></div>';
  if (careers.image) { var careerImage = document.createElement('img'); careerImage.className = 'careers__photo'; careerImage.src = careers.image; careerImage.alt = ''; careerImage.width = 916; careerImage.height = 1280; careerImage.loading = 'lazy'; careerImage.decoding = 'async'; careersSection.appendChild(careerImage); }
  document.getElementById('contact').before(careersSection);

  var share = document.createElement('button');
  share.type = 'button';
  share.className = 'btn btn--ghost contact-share';
  share.innerHTML = icon('network', { size: 18 }) + ' Share SaviNexa';
  share.addEventListener('click', function () {
    var payload = { title: data.site.name, text: data.hero.lead, url: location.href };
    if (navigator.share) navigator.share(payload).then(function () { trackEvent('share', {}, data); }).catch(function () {});
    else if (navigator.clipboard) navigator.clipboard.writeText(payload.url).then(function () { trackEvent('share_copied', {}, data); }).catch(function () {});
  });
  document.querySelector('#contact [data-open-enquiry]').after(share);

  document.querySelectorAll('#services [data-service-select]').forEach(function (button) {
    button.addEventListener('click', function () {
      trackEvent('service_select', { service: button.dataset.serviceSelect }, data);
      document.querySelector('[data-open-enquiry]').click();
      var select = document.querySelector('.modal [name="need"]');
      if (select) select.value = button.dataset.serviceSelect;
    });
  });

  document.querySelector('meta[name="description"]')?.setAttribute('content', data.hero.lead);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', data.site.name + ' — ' + data.site.descriptor);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', data.hero.lead);
  var schema = document.createElement('script');
  schema.type = 'application/ld+json';
  schema.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'EmploymentAgency', name: data.site.name, description: data.hero.lead, email: data.contact.email, telephone: data.contact.phones.map(function (phone) { return '+' + data.site.countryCode + phone.number; }), sameAs: data.contact.socials.map(function (social) { return social.url; }) });
  document.head.appendChild(schema);
  trackEvent('page_view', { path: location.pathname + location.hash }, data);
}

async function loadSiteContent() {
  const local = await fetchJSON(CONTENT_URL);
  if (local.site && local.site.jobsEndpoint) {
    try {
      const response = await fetchJSON(local.site.jobsEndpoint);
      if (Array.isArray(response.jobs)) local.careers = { ...(local.careers || {}), jobs: response.jobs.map(function (job) { return { title: job.title, location: job.location, type: job.employmentType, description: job.description, applyUrl: job.applicationEmail ? 'mailto:' + job.applicationEmail + '?subject=' + encodeURIComponent('Application — ' + job.title) : '' }; }) };
    } catch (error) { console.warn('Live SaviNexa roles are unavailable; showing locally saved careers content.', error); }
  }
  if (!local.site || !local.site.contentEndpoint) return local;
  try { return await fetchJSON(local.site.contentEndpoint); }
  catch (error) { console.warn('Remote content is unavailable; showing the local SaviNexa content.', error); return local; }
}

/* -------------------------------------------------------------------------
   Boot
   ------------------------------------------------------------------------- */
const app = document.getElementById('app');

function showError(err) {
  const onFile = location.protocol === 'file:';
  app.innerHTML = `
    <div class="app-status" role="alert">
      <h2>We couldn't load the page</h2>
      <p>${
        onFile
          ? 'This site uses ES modules and JSON, which browsers block on file:// addresses. Serve the folder with a local server (for example <code>npx serve</code> or <code>python3 -m http.server</code>) and open it from there.'
          : 'Please check your connection and try again.'
      }</p>
      <button type="button" class="btn btn--navy" id="retry">Try again</button>
    </div>`;
  document.getElementById('retry')?.addEventListener('click', boot);
  console.error(err);
}

async function boot() {
  app.innerHTML = `<div class="app-status" role="status"><div class="spinner" aria-hidden="true"></div><p>Loading…</p></div>`;

  let data;
  try {
    data = await loadSiteContent();
  } catch (err) {
    showError(err);
    return;
  }

  document.title = `${data.site.name} — ${data.site.descriptor} | ${data.hero.eyebrow}`;

  // Sections
  const order = ['hero', 'about', 'challenge', 'approach', 'services', 'process', 'different', 'value', 'industries', 'audience', 'partner', 'vision', 'contact'];
  app.innerHTML = order.map((key) => sections[key](data)).join('');
  enhancePage(data);
  document.body.insertAdjacentHTML('beforeend', footer(data));

  // Components
  const modal = await new Modal().init();
  const openForm = () => openEnquiry(modal, data);

  await new Navbar({
    mount: document.getElementById('navbar'),
    brand: { name: data.site.name, descriptor: data.site.descriptor, logo: 'assets/logo-mark.png' },
    links: data.nav,
    cta: { label: 'Get in touch', onClick: openForm },
  }).init();

  // Any element marked data-open-enquiry opens the form.
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-open-enquiry]')) openForm();
  });

  initReveal();

  // Honour deep links (e.g. /#services) now that the sections exist.
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
}

boot();
