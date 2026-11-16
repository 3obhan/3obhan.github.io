(() => {
  'use strict';
  const langKey = 'sobhan-language';
  const cartKey = 'sobhan-static-cart-v1';
  const html = document.documentElement;
  const catalog = {
    'book-lay-paye-panda': { fa: 'لای پای پاندا', en: 'The Panda Between the Legs', toman: 200000, usd: 10, fixed: 'TOMAN' },
    'book-shomal': { fa: 'شمال بی‌تو به اندازهٔ شمال کم است', en: 'The North Is Not North Enough Without You', toman: 200000, usd: 10, fixed: 'TOMAN' },
    'book-an-deraz': { fa: 'آن دراز', en: 'That Long One', toman: 200000, usd: 10, fixed: 'TOMAN' },
    'book-hichkas-tanha-nist': { fa: 'هیچ‌کس تنها نیست', en: 'No One Is Alone', toman: 200000, usd: 10, fixed: 'TOMAN' },
    'book-jadooye-jabehei': { fa: 'جادوی جعبه‌ای', en: 'The Magic of the Box', toman: 200000, usd: 10, fixed: 'TOMAN' },
    'book-idehaei-baraye-dozdidan': { fa: 'ایده‌هایی برای دزدیدن', en: 'Ideas to Steal', toman: 200000, usd: 10, fixed: 'TOMAN' },
    'book-thinnest-condom': { fa: 'The Thinnest Condom', en: 'The Thinnest Condom', toman: 200000, usd: 10, fixed: 'USD' },
    'book-plastic-panther': { fa: 'Plastic Panther', en: 'Plastic Panther', toman: 200000, usd: 10, fixed: 'USD' },
    'book-shes-hot': { fa: "She's Hot and Other Sentence", en: "She's Hot and Other Sentence", toman: 200000, usd: 10, fixed: 'USD' },
    'album-dour-douri': { fa: 'دور دوری', en: 'Dour Douri', toman: 700000, usd: 7 },
    'album-jacket-abi': { fa: 'ژاکت آبیت', en: 'Jâket Abit', toman: 700000, usd: 7 },
    'album-manmaneh': { fa: 'منمنه', en: 'Manmaneh', toman: 700000, usd: 7 },
    'album-cherekhnevis': { fa: 'چرکنویس‌های خوشنویسی‌شده', en: 'Cherknevis-hâ-ye Khoshnevisi-Shodeh', toman: 700000, usd: 7 }
  };
  let language = localStorage.getItem(langKey) === 'fa' ? 'fa' : 'en';
  let cart = readCart();

  function readCart() {
    try {
      const value = JSON.parse(localStorage.getItem(cartKey) || '[]');
      return Array.isArray(value) ? value.filter(x => x && typeof x.id === 'string' && Number.isInteger(x.qty) && x.qty > 0) : [];
    } catch (_) { return []; }
  }
  function saveCart() { localStorage.setItem(cartKey, JSON.stringify(cart)); }
  function formatMoney(toman, usd, currency = (language === 'fa' ? 'TOMAN' : 'USD')) {
    return currency === 'TOMAN'
      ? `${new Intl.NumberFormat('fa-IR').format(toman)} تومان`
      : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(usd);
  }
  function translate() {
    html.lang = language;
    html.dir = language === 'fa' ? 'rtl' : 'ltr';
    document.body.classList.toggle('fa', language === 'fa');
    document.querySelectorAll('[data-en][data-fa]').forEach(node => {
      const value = node.getAttribute(`data-${language}`) || '';
      if (node.hasAttribute('data-i18n-html') || value.includes('<span>')) node.innerHTML = value;
      else node.textContent = value;
    });
    document.querySelectorAll('[data-price-toman][data-price-usd]').forEach(node => {
      node.textContent = formatMoney(Number(node.dataset.priceToman), Number(node.dataset.priceUsd), node.dataset.currency || undefined);
    });
    document.querySelectorAll('[data-catalog-lang]').forEach(node => {
      node.hidden = node.dataset.catalogLang !== language;
    });
    document.querySelectorAll('.lang-button').forEach(button => {
      button.textContent = language === 'fa' ? 'EN' : 'FA';
      button.setAttribute('aria-label', language === 'fa' ? 'Switch to English' : 'تغییر زبان به فارسی');
    });
    document.querySelectorAll('.cart-open').forEach(button => {
      const label = language === 'fa' ? 'سبد خرید' : 'Cart';
      button.setAttribute('aria-label', `${label}, ${cart.reduce((n, x) => n + x.qty, 0)} ${language === 'fa' ? 'کالا' : 'items'}`);
    });
    localStorage.setItem(langKey, language);
    renderCart();
  }
  function productFor(id) {
    const node = [...document.querySelectorAll('[data-product-id]')].find(item => item.dataset.productId === id);
    const item = catalog[id];
    if (!item) return null;
    return {
      id,
      titleEn: node?.dataset.titleEn || item.en,
      titleFa: node?.dataset.titleFa || item.fa,
      toman: Number(node?.dataset.priceToman || item.toman),
      usd: Number(node?.dataset.priceUsd || item.usd),
      fixedCurrency: node?.dataset.currency || item.fixed || null
    };
  }
  function renderCart() {
    const list = document.querySelector('.cart-items');
    const count = document.querySelector('.cart-count');
    const total = document.querySelector('.cart-total-value');
    if (!list) return;
    list.replaceChildren();
    let sumToman = 0, sumUsd = 0, qty = 0, hasToman = false, hasUsd = false;
    cart.forEach(item => {
      const product = productFor(item.id);
      if (!product) return;
      qty += item.qty;
      const currency = product.fixedCurrency || (language === 'fa' ? 'TOMAN' : 'USD');
      if (currency === 'TOMAN') { sumToman += product.toman * item.qty; hasToman = true; }
      else { sumUsd += product.usd * item.qty; hasUsd = true; }
      const li = document.createElement('li');
      li.className = 'cart-line';
      const copy = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = language === 'fa' ? product.titleFa : product.titleEn;
      const meta = document.createElement('small');
      meta.textContent = `${item.qty} × ${formatMoney(product.toman * item.qty, product.usd * item.qty, currency)}`;
      copy.append(title, meta);
      const remove = document.createElement('button');
      remove.className = 'cart-remove';
      remove.type = 'button';
      remove.dataset.removeId = item.id;
      remove.textContent = language === 'fa' ? 'حذف' : 'Remove';
      li.append(copy, remove);
      list.append(li);
    });
    if (!qty) {
      const empty = document.createElement('li');
      empty.className = 'cart-empty';
      empty.textContent = language === 'fa' ? 'سبد خرید خالی است.' : 'Your cart is empty.';
      list.append(empty);
    }
    if (count) count.textContent = String(qty);
    if (total) {
      const parts = [];
      if (hasToman) parts.push(formatMoney(sumToman, 0, 'TOMAN'));
      if (hasUsd) parts.push(formatMoney(0, sumUsd, 'USD'));
      total.textContent = parts.join(' + ') || formatMoney(0, 0);
    }
  }
  function addProduct(id) {
    if (!catalog[id]) return;
    const existing = cart.find(x => x.id === id);
    if (existing) existing.qty += 1;
    else cart.push({ id, qty: 1 });
    saveCart(); renderCart();
    document.body.classList.add('cart-opened');
  }
  document.addEventListener('click', event => {
    const target = event.target.closest('button, a');
    if (!target) return;
    if (target.matches('.lang-button')) { language = language === 'fa' ? 'en' : 'fa'; translate(); }
    if (target.matches('.cart-open')) document.body.classList.add('cart-opened');
    if (target.matches('.cart-close, .cart-backdrop')) document.body.classList.remove('cart-opened');
    if (target.matches('.add-cart')) {
      event.preventDefault();
      addProduct(target.dataset.addId);
    }
    if (target.matches('.cart-remove')) {
      cart = cart.filter(item => item.id !== target.dataset.removeId);
      saveCart(); renderCart();
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') document.body.classList.remove('cart-opened');
  });
  translate();
})();
