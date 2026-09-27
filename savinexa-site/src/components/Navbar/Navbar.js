import { loadStylesheet } from '../../utils/fetcher.js';
import { icon } from '../../utils/icons.js';

const escapeHTML = (str) =>
  String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * Navbar — sticky header with scroll-spy, a condensed "scrolled" state and a mobile drawer.
 *
 *   const nav = new Navbar({
 *     mount:  document.getElementById('navbar'),
 *     brand:  { name: 'SaviNexa', descriptor: 'Talent & Hiring Solutions', logo: 'assets/logo-mark.png' },
 *     links:  [{ id: 'about', label: 'About' }, ...],   // id = the section's DOM id
 *     cta:    { label: 'Contact us', onClick: () => {} },
 *   });
 *   await nav.init();
 */
export class Navbar {
  constructor({ mount, brand, links = [], cta = null }) {
    this.mount = mount;
    this.brand = brand;
    this.links = links;
    this.cta = cta;
    this.isOpen = false;
    this.observer = null;
    this.cleanups = [];
  }

  async init() {
    await loadStylesheet(new URL('./Navbar.css', import.meta.url));
    this.render();
    this.bind();
    this.observeSections();
    this.onScroll();
    return this;
  }

  render() {
    const { brand, links, cta } = this;

    this.mount.innerHTML = `
      <header class="nav" data-state="top">
        <div class="nav__inner container">
          <a class="nav__brand" href="#top" aria-label="${escapeHTML(brand.name)} — back to top">
            <span class="nav__logo"><img src="${escapeHTML(brand.logo)}" alt="" width="30" height="25"></span>
            <span class="nav__brand-text">
              <span class="nav__brand-name">${escapeHTML(brand.name)}</span>
              <span class="nav__brand-sub">${escapeHTML(brand.descriptor)}</span>
            </span>
          </a>

          <nav class="nav__menu" id="nav-menu" aria-label="Primary">
            <ul class="nav__list">
              ${links
                .map(
                  (l) =>
                    `<li><a class="nav__link" href="#${escapeHTML(l.id)}" data-target="${escapeHTML(l.id)}">${escapeHTML(l.label)}</a></li>`
                )
                .join('')}
            </ul>
            ${
              cta
                ? `<button type="button" class="btn btn--gold nav__cta" data-nav-cta>${escapeHTML(cta.label)}</button>`
                : ''
            }
          </nav>

          <button type="button" class="nav__toggle" aria-expanded="false" aria-controls="nav-menu" aria-label="Open menu">
            <span class="nav__toggle-open">${icon('menu', { size: 24 })}</span>
            <span class="nav__toggle-close">${icon('close', { size: 24 })}</span>
          </button>
        </div>
      </header>
    `;

    this.el = this.mount.querySelector('.nav');
    this.toggleBtn = this.mount.querySelector('.nav__toggle');
  }

  bind() {
    const on = (target, type, handler, opts) => {
      target.addEventListener(type, handler, opts);
      this.cleanups.push(() => target.removeEventListener(type, handler, opts));
    };

    on(this.toggleBtn, 'click', () => this.setOpen(!this.isOpen));

    // Close the drawer after choosing a link.
    on(this.mount.querySelector('.nav__menu'), 'click', (e) => {
      if (e.target.closest('.nav__link')) this.setOpen(false);
    });

    const ctaBtn = this.mount.querySelector('[data-nav-cta]');
    if (ctaBtn && this.cta?.onClick) {
      on(ctaBtn, 'click', () => {
        this.setOpen(false);
        this.cta.onClick();
      });
    }

    on(document, 'keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.setOpen(false);
        this.toggleBtn.focus();
      }
    });

    on(window, 'scroll', () => this.onScroll(), { passive: true });
    on(window, 'resize', () => {
      if (window.innerWidth > 900 && this.isOpen) this.setOpen(false);
    });
  }

  setOpen(open) {
    this.isOpen = open;
    this.el.classList.toggle('is-open', open);
    this.toggleBtn.setAttribute('aria-expanded', String(open));
    this.toggleBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('nav-open', open);
  }

  onScroll() {
    this.el.dataset.state = window.scrollY > 24 ? 'scrolled' : 'top';
  }

  /** Highlight the link whose section is currently in the middle band of the viewport. */
  observeSections() {
    const linkFor = new Map(
      [...this.mount.querySelectorAll('.nav__link')].map((a) => [a.dataset.target, a])
    );

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          linkFor.forEach((a) => a.classList.remove('is-active'));
          linkFor.get(entry.target.id)?.classList.add('is-active');
          linkFor.get(entry.target.id)?.setAttribute('aria-current', 'true');
          linkFor.forEach((a, id) => id !== entry.target.id && a.removeAttribute('aria-current'));
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );

    linkFor.forEach((_, id) => {
      const section = document.getElementById(id);
      if (section) this.observer.observe(section);
    });
  }

  destroy() {
    this.observer?.disconnect();
    this.cleanups.forEach((fn) => fn());
    this.cleanups = [];
    document.body.classList.remove('nav-open');
    this.mount.innerHTML = '';
  }
}
