/* Lumenook storefront behaviour (brief Sections 8-11). Vanilla web components, no libraries.
   Loaded once with `defer` from snippets/lumenook-head.liquid. */

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const storage = {
  get(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      /* storage unavailable (private mode): ignore */
    }
  },
};

/* Reveal: fades in .ln-fade elements as they enter the viewport. */
(() => {
  const items = document.querySelectorAll('.ln-fade');
  if (!items.length) return;
  if (reduceMotion() || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -10% 0px' }
  );
  items.forEach((el) => io.observe(el));
})();

/* Delivery estimate: countdown to the Asia/Dubai cut-off and an arrival date per emirate. */
class LnDeliveryEstimate extends HTMLElement {
  static STORAGE_KEY = 'lumenook:emirate';

  connectedCallback() {
    this.config = JSON.parse(this.querySelector('script[type="application/json"]')?.textContent || '{}');
    this.config.closedWeekdays = String(this.config.closedWeekdays || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number);
    this.config.holidays = String(this.config.holidays || '').split(/\s+/).filter(Boolean);
    this.select = this.querySelector('select');
    this.output = this.querySelector('[data-output]');
    if (!this.select || !this.output) return;

    const saved = storage.get(LnDeliveryEstimate.STORAGE_KEY);
    if (saved && [...this.select.options].some((o) => o.value === saved)) this.select.value = saved;
    this.select.addEventListener('change', () => {
      storage.set(LnDeliveryEstimate.STORAGE_KEY, this.select.value);
      this.render();
    });

    this.render();
    this.timer = window.setInterval(() => this.render(), 60000);
    this.hidden = false;
  }

  disconnectedCallback() {
    window.clearInterval(this.timer);
  }

  /* Wall-clock parts in Asia/Dubai, independent of the shopper's own time zone. */
  dubaiNow() {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Dubai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date());
    const get = (type) => Number(parts.find((p) => p.type === type).value);
    return { y: get('year'), m: get('month'), d: get('day'), h: get('hour'), min: get('minute') };
  }

  isWorkingDay(date) {
    const iso = date.toISOString().slice(0, 10);
    return !this.config.closedWeekdays.includes(date.getUTCDay()) && !this.config.holidays.includes(iso);
  }

  nextWorkingDay(date) {
    const next = new Date(date);
    do {
      next.setUTCDate(next.getUTCDate() + 1);
    } while (!this.isWorkingDay(next));
    return next;
  }

  render() {
    const now = this.dubaiNow();
    // Represent Dubai calendar dates as UTC midnights so weekday maths is time-zone safe.
    const today = new Date(Date.UTC(now.y, now.m - 1, now.d));
    const beforeCutoff = now.h < this.config.cutoffHour && this.isWorkingDay(today);

    const dispatch = beforeCutoff ? today : this.nextWorkingDay(today);
    const fast = this.config.fastEmirates.includes(this.select.value);
    let arrival = this.nextWorkingDay(dispatch);
    const extra = fast ? 0 : this.config.otherDays - 1;
    for (let i = 0; i < extra; i += 1) arrival = this.nextWorkingDay(arrival);

    const locale = document.documentElement.lang || 'en';
    const dateText = new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    }).format(arrival);
    const tomorrow = arrival - today === 86400000;
    const when = tomorrow ? `${this.config.strings.tomorrow}, ${dateText}` : dateText;
    const emirate = this.select.options[this.select.selectedIndex].text;

    if (beforeCutoff) {
      const minutesLeft = this.config.cutoffHour * 60 - (now.h * 60 + now.min);
      const hours = Math.floor(minutesLeft / 60);
      const mins = minutesLeft % 60;
      this.output.textContent = this.config.strings.before
        .replace('[hours]', hours)
        .replace('[minutes]', mins)
        .replace('[emirate]', emirate)
        .replace('[date]', when);
    } else {
      this.output.textContent = this.config.strings.after.replace('[emirate]', emirate).replace('[date]', when);
    }
  }
}
if (!customElements.get('ln-delivery-estimate')) customElements.define('ln-delivery-estimate', LnDeliveryEstimate);

/* Lit / unlit toggle: a real button with aria-pressed that crossfades two stacked images. */
class LnLitToggle extends HTMLElement {
  connectedCallback() {
    this.button = this.querySelector('button');
    this.button?.addEventListener('click', () => {
      const lit = this.button.getAttribute('aria-pressed') !== 'true';
      this.button.setAttribute('aria-pressed', String(lit));
      this.toggleAttribute('data-lit', lit);
    });
  }
}
if (!customElements.get('ln-lit-toggle')) customElements.define('ln-lit-toggle', LnLitToggle);

/* Async section: fetches a Section Rendering API URL and swaps in the matching markup.
   Used for "Pairs well with" fallback recommendations and "Recently viewed". */
class LnAsyncSection extends HTMLElement {
  async connectedCallback() {
    let url = this.dataset.url;
    if (this.dataset.recentlyViewed !== undefined) {
      url = this.recentlyViewedUrl();
      if (!url) return;
    }
    if (!url) return;
    try {
      const response = await fetch(url);
      if (!response.ok) return;
      const html = new DOMParser().parseFromString(await response.text(), 'text/html');
      const fresh = html.querySelector(`ln-async-section[data-target="${this.dataset.target}"] [data-async-content]`);
      if (fresh && fresh.children.length) {
        this.querySelector('[data-async-content]').replaceWith(fresh);
        this.hidden = false;
      }
    } catch (e) {
      /* network failure: leave the section hidden */
    }
  }

  recentlyViewedUrl() {
    let ids = [];
    try {
      ids = JSON.parse(storage.get('viewedProducts') || '[]');
    } catch (e) {
      ids = [];
    }
    ids = ids.filter((id) => String(id) !== this.dataset.currentId).slice(0, 4);
    if (!ids.length) return null;
    const url = new URL(this.dataset.searchUrl, window.location.origin);
    url.searchParams.set('q', ids.map((id) => `id:${id}`).join(' OR '));
    url.searchParams.set('resources[type]', 'product');
    url.searchParams.set('section_id', this.dataset.sectionId);
    return url.toString();
  }
}
if (!customElements.get('ln-async-section')) customElements.define('ln-async-section', LnAsyncSection);

/* Collection "Load more": a link to the next page, upgraded to append the next page's cards in place. */
class LnLoadMore extends HTMLElement {
  connectedCallback() {
    this.link = this.querySelector('a');
    this.link?.addEventListener('click', (event) => {
      event.preventDefault();
      this.load();
    });
  }

  async load() {
    const next = this.dataset.nextUrl;
    const grid = document.querySelector(this.dataset.grid);
    if (!next || !grid) {
      window.location.href = next;
      return;
    }
    this.link.setAttribute('aria-busy', 'true');
    try {
      const html = new DOMParser().parseFromString(await (await fetch(next)).text(), 'text/html');
      const items = html.querySelectorAll(`${this.dataset.grid} > li`);
      items.forEach((item) => grid.append(item));
      items[0]?.querySelector('a')?.focus({ preventScroll: true });
      const nextMore = html.querySelector('ln-load-more');
      if (nextMore?.dataset.nextUrl) {
        this.dataset.nextUrl = nextMore.dataset.nextUrl;
        this.link.href = nextMore.dataset.nextUrl;
        this.link.removeAttribute('aria-busy');
      } else {
        this.remove();
      }
    } catch (e) {
      window.location.href = next;
    }
  }
}
if (!customElements.get('ln-load-more')) customElements.define('ln-load-more', LnLoadMore);

/* Read more: expands a collapsed text block. */
class LnReadMore extends HTMLElement {
  connectedCallback() {
    const button = this.querySelector('button');
    const body = this.querySelector('[data-body]');
    if (!button || !body) return;
    if (body.scrollHeight <= body.clientHeight + 4) {
      button.hidden = true;
      this.setAttribute('data-expanded', '');
      return;
    }
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(open));
      this.toggleAttribute('data-expanded', open);
      button.textContent = open ? button.dataset.less : button.dataset.more;
    });
  }
}
if (!customElements.get('ln-read-more')) customElements.define('ln-read-more', LnReadMore);

/* Header: toggles html.ln-scrolled after 40px so the sticky header shrinks 88px -> 64px (brief Section 11). */
(() => {
  const root = document.documentElement;
  let ticking = false;
  const scrollTop = () => Math.max(window.scrollY, document.querySelector('.page-wrapper')?.scrollTop || 0);
  const update = () => {
    ticking = false;
    root.classList.toggle('ln-scrolled', scrollTop() > 40);
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  document.querySelector('.page-wrapper')?.addEventListener('scroll', onScroll, { passive: true });
  update();
})();

/* Mobile sticky add-to-bag (brief Section 10F): shows once the main add-to-cart button leaves the
   viewport, hides near the footer, and submits the main product form so the variant stays in sync. */
class LnStickyAtc extends HTMLElement {
  connectedCallback() {
    this.form = document.querySelector('.product-information form[data-type="add-to-cart-form"]');
    this.mainButton = this.form?.querySelector('[type="submit"], button[name="add"]');
    this.button = this.querySelector('[data-button]');
    if (!this.form || !this.mainButton || !this.button || !('IntersectionObserver' in window)) return;

    if (!this.form.id) this.form.id = 'LnProductForm';
    this.button.setAttribute('form', this.form.id);

    this.mainVisible = true;
    this.footerVisible = false;
    const mq = window.matchMedia('(max-width: 749px)');
    const sync = () => {
      const show = mq.matches && !this.mainVisible && !this.footerVisible && !this.mainButton.disabled;
      this.hidden = !show;
      document.documentElement.classList.toggle('ln-sticky-atc-open', show);
    };

    new IntersectionObserver(([entry]) => {
      this.mainVisible = entry.isIntersecting || entry.boundingClientRect.top > 0;
      sync();
    }).observe(this.mainButton);

    const footer = document.querySelector('footer');
    if (footer) {
      new IntersectionObserver(([entry]) => {
        this.footerVisible = entry.isIntersecting;
        sync();
      }).observe(footer);
    }
    mq.addEventListener('change', sync);

    // Mirror the main price and availability when the shopper changes variant.
    const mainPrice = document.querySelector('.product-information product-price');
    const priceTarget = this.querySelector('[data-price]');
    if (mainPrice && priceTarget) {
      const mirror = () => {
        const current = mainPrice.querySelector('.price, [ref="priceContainer"]') || mainPrice;
        const text = current.textContent.trim().split(/\s{2,}/)[0];
        if (text) priceTarget.textContent = text;
      };
      new MutationObserver(mirror).observe(mainPrice, { childList: true, subtree: true, characterData: true });
    }
    new MutationObserver(() => {
      this.button.disabled = this.mainButton.disabled;
      sync();
    }).observe(this.mainButton, { attributes: true, attributeFilter: ['disabled'] });
  }
}
if (!customElements.get('ln-sticky-atc')) customElements.define('ln-sticky-atc', LnStickyAtc);

/* Product gallery on mobile: thin progress bar instead of dots (brief Section 10). */
(() => {
  const scroller = document.querySelector('.product-information slideshow-slides');
  if (!scroller) return;
  const bar = document.createElement('div');
  bar.className = 'ln-gallery-progress';
  bar.setAttribute('aria-hidden', 'true');
  bar.innerHTML = '<span></span>';
  scroller.closest('slideshow-component')?.after(bar);
  const fill = bar.firstElementChild;
  const update = () => {
    const max = scroller.scrollWidth - scroller.clientWidth;
    const ratio = max > 0 ? Math.abs(scroller.scrollLeft) / max : 0;
    const slides = Math.max(1, Math.round(scroller.scrollWidth / Math.max(1, scroller.clientWidth)));
    fill.style.inlineSize = `${100 / slides}%`;
    fill.style.transform = `translateX(${ratio * (slides - 1) * 100 * (document.dir === 'rtl' ? -1 : 1)}%)`;
  };
  scroller.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  window.addEventListener('resize', update);
  update();
})();

/* Product gallery videos: autoplay muted while in view, unless the shopper saves data or prefers reduced motion. */
(() => {
  const saveData = navigator.connection?.saveData;
  if (saveData || reduceMotion() || !('IntersectionObserver' in window)) return;
  const videos = document.querySelectorAll('.product-information video');
  if (!videos.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      target.muted = true;
      target.playsInline = true;
      if (isIntersecting) target.play().catch(() => {});
      else target.pause();
    });
  }, { threshold: 0.5 });
  videos.forEach((v) => io.observe(v));
})();
