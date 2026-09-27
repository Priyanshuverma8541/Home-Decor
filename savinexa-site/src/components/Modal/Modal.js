import { loadStylesheet } from '../../utils/fetcher.js';
import { icon } from '../../utils/icons.js';

/**
 * Modal — a single reusable, accessible dialog built on the native <dialog> element
 * (focus trapping, Esc-to-close and the top layer come for free).
 *
 *   const modal = new Modal();
 *   await modal.init();
 *
 *   modal.open({
 *     title: 'Send an enquiry',
 *     subtitle: 'We usually reply within one working day.',   // optional
 *     body: htmlStringOrElement,
 *     size: 'md',                                             // 'sm' | 'md' | 'lg'
 *     onClose: () => {},                                      // optional
 *   });
 *
 *   modal.setBody(htmlStringOrElement);   // swap content while open
 *   modal.close();
 */
export class Modal {
  constructor() {
    this.dialog = null;
    this.opener = null;
    this.onClose = null;
    this.ready = false;
  }

  async init() {
    if (this.ready) return this;
    await loadStylesheet(new URL('./Modal.css', import.meta.url));

    this.dialog = document.createElement('dialog');
    this.dialog.className = 'modal';
    this.dialog.setAttribute('aria-labelledby', 'modal-title');
    this.dialog.innerHTML = `
      <div class="modal__panel" role="document">
        <button type="button" class="modal__close" aria-label="Close dialog">${icon('close', { size: 20 })}</button>
        <header class="modal__header">
          <h2 class="modal__title" id="modal-title"></h2>
          <p class="modal__subtitle" hidden></p>
        </header>
        <div class="modal__body"></div>
      </div>
    `;
    document.body.appendChild(this.dialog);

    this.panel = this.dialog.querySelector('.modal__panel');
    this.titleEl = this.dialog.querySelector('.modal__title');
    this.subtitleEl = this.dialog.querySelector('.modal__subtitle');
    this.bodyEl = this.dialog.querySelector('.modal__body');

    this.dialog.querySelector('.modal__close').addEventListener('click', () => this.close());

    // Click on the backdrop (the <dialog> itself, outside the panel) closes it.
    this.dialog.addEventListener('mousedown', (e) => {
      if (e.target === this.dialog) this.close();
    });

    this.dialog.addEventListener('close', () => {
      document.body.classList.remove('modal-open');
      this.opener?.focus?.({ preventScroll: true });
      const cb = this.onClose;
      this.onClose = null;
      cb?.();
    });

    this.ready = true;
    return this;
  }

  open({ title = '', subtitle = '', body = '', size = 'md', onClose = null } = {}) {
    if (!this.ready) throw new Error('Modal.init() must be awaited before open().');

    this.opener = document.activeElement;
    this.onClose = onClose;

    this.titleEl.textContent = title;
    this.subtitleEl.textContent = subtitle;
    this.subtitleEl.hidden = !subtitle;
    this.panel.dataset.size = size;
    this.setBody(body);

    if (!this.dialog.open) this.dialog.showModal();
    document.body.classList.add('modal-open');
    this.bodyEl.scrollTop = 0;
    return this;
  }

  setBody(body) {
    if (typeof body === 'string') {
      this.bodyEl.innerHTML = body;
    } else {
      this.bodyEl.replaceChildren(body);
    }
  }

  /** The element you can query / append to while the modal is open. */
  get content() {
    return this.bodyEl;
  }

  close() {
    if (this.dialog?.open) this.dialog.close();
  }
}
