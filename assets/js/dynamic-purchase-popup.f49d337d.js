// dynamic-purchase-popup.js
// Replaces static purchased popup with dynamic product-driven notifications
(function () {
  "use strict";

  const CONFIG = {
    // Match your category-page.js usage: products.grouped2.json or the location you use
    jsonPath: "products.grouped2.json",
    minIntervalMs: 12000,
    maxIntervalMs: 45000,
    meanIntervalMs: 20000, // Average interval for exponential distribution
    recentTimeRangeMinMinutes: 1,
    recentTimeRangeMaxMinutes: 60,
    showQuantityChance: 0.25,
    quantityMin: 1,
    quantityMax: 3,
    namePool: [
      "Kwame", "Ama", "Kojo", "Akosua", "Kofi", "Yaa", "Esi", "Abena", "Adwoa", "Kwasi", "Afua",
      "Emmanuel", "Samuel", "Priscilla", "Cynthia", "Joseph", "Mary", "David", "Daniel", "Grace",
      "Fatima", "Aisha", "Michael", "John"
    ], // Expanded with common Ghanaian names for realism
    locations: [
      "Accra, Ghana", "Kumasi, Ghana", "Tamale, Ghana", "Sekondi-Takoradi, Ghana", "Cape Coast, Ghana",
      "Sunyani, Ghana", "Ho, Ghana", "Wa, Ghana", "Lagos, Nigeria", "Abuja, Nigeria", "Nairobi, Kenya",
      "London, UK", "Manchester, UK", "New York, USA"
    ], // More Ghana-focused for site relevance
    visibleOnSelectors: [".product-single", ".main-content"],
    // placeholder relative path (no leading slash) — matches your assets folder
    placeholderImage: "assets/images/products/small/product-placeholder.webp",
    maxRecentPerProduct: 5,
    // MiniPopup defaults for purchased notifications (overridden from cart defaults in main.min.js)
    miniPopupDefaults: {
      imageSrc: "",
      imageLink: "#",
      name: "",
      nameLink: "#",
      content: "has been purchased.", // Adjusted for purchased context
      action: '<span class="text-primary" style="font-size: 11px;"></span>', // Time/location injected dynamically
      delay: 4000,
      space: 20,
      template: '<div class="minipopup-box"><div class="product"><figure class="product-media"><a href="{{imageLink}}"><img src="{{imageSrc}}" alt="product" width="60" height="60"></a></figure><div class="product-detail"><a href="{{nameLink}}" class="product-name">{{name}}</a><p>{{content}}</p></div></div><div class="product-action">{{action}}</div><button class="mfp-close"></button></div>'
    }
  };

  // Ensure jQuery is available (assumed from theme)
  if (typeof jQuery === 'undefined') {
    console.error('dynamic-purchase-popup: jQuery required but not found');
    return;
  }
  const $ = jQuery;

  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function humanTimeAgo(minutes) {
    minutes = Math.round(minutes);
    if (minutes < 1) return "just now";
    if (minutes === 1) return "1 MINUTE AGO";
    if (minutes < 60) return `${minutes} MINUTES AGO`;
    const hours = Math.round(minutes / 60);
    if (hours === 1) return "1 HOUR AGO";
    return `${hours} HOURS AGO`;
  }

  // Normalize JSON product shapes to { id, title, url, image }
  function normalizeProducts(raw) {
    const out = [];
    if (!raw) return out;
    // Accept either { categories: [...] } like category-page, or grouped map or array
    if (Array.isArray(raw)) {
      raw.forEach(p => out.push(p));
    } else if (raw.categories && Array.isArray(raw.categories)) {
      raw.categories.forEach(cat => {
        (cat.subcategories || []).forEach(sc => {
          (sc.products || []).forEach(p => {
            p.popularity = rand(1, 10); // Assign random popularity for weighted selection
            out.push(p);
          });
        });
      });
    } else if (typeof raw === "object") {
      // fallback: flatten any arrays inside object
      Object.keys(raw).forEach(k => {
        if (Array.isArray(raw[k])) raw[k].forEach(p => {
          p.popularity = rand(1, 10);
          out.push(p);
        });
      });
    }
    return out.map((p, i) => {
      const id = p.id || p.sku || p.product_id || `p-${i}`;
      const title = p.name || p.title || p.product_name || `Product ${i+1}`;
      // derive url consistently with category-page: product.html#<id>
      const url = p.url || p.link || `product.html#${id}`;
      // prefer explicit image or images[0], try different property names used across exports
      let image = "";
      if (p.images && Array.isArray(p.images) && p.images.length) image = p.images[0];
      image = image || p.image || p.thumbnail || p.imageSrc || p.thumb || "";
      // ensure no leading "./" and no leading slash (main.min.js templates use relative)
      image = image.toString().replace(/^\.\//, "").replace(/^\/+/, "");
      // try to produce a small version if images use full paths and have /large/ etc:
      // but don't assume — fallback to placeholder if missing
      if (!image) image = CONFIG.placeholderImage;
      return { id, title, url, image };
    });
  }

  // pick product with simple anti-repeat weights
  let products = [];
  let recentPurchases = {}; // {productId: timestamp[]}

  function incrementRecent(id) {
    if (!recentPurchases[id]) recentPurchases[id] = [];
    recentPurchases[id].push(Date.now());
    if (recentPurchases[id].length > CONFIG.maxRecentPerProduct) recentPurchases[id].shift();
  }

  function getRecentCount(id) {
    if (!recentPurchases[id]) return 0;
    const now = Date.now();
    return recentPurchases[id].filter(ts => now - ts < CONFIG.recentTimeRangeMaxMinutes * 60 * 1000).length;
  }

  function pickProduct() {
    const totalPop = products.reduce((sum, p) => sum + p.popularity, 0);
    let randVal = Math.random() * totalPop;
    for (const p of products) {
      randVal -= p.popularity;
      if (randVal <= 0) {
        if (getRecentCount(p.id) < CONFIG.maxRecentPerProduct) return p;
      }
    }
    return null; // No suitable product; will retry next schedule
  }

  // Standalone MiniPopup implementation (rewritten cleanly from main.min.js logic)
  // This mimics the exact behavior, template, and animation without relying on the theme's local 'c' scope
  const MiniPopup = (function() {
    let stackHeight = 0;
    let stack = [];
    let isPaused = false;
    let timeouts = [];
    let autoCloseTimer = null;
    let $area = null;
    let space = 20;

    const templateFn = (tmpl, data) => {
      return tmpl.replace(/\{\{(\w+)\}\}/g, (match, key) => data[key] || '');
    };

    const autoCloseLoop = function() {
      if (isPaused) return;
      for (let idx = 0; idx < timeouts.length; ++idx) {
        timeouts[idx] -= 200;
        if (timeouts[idx] <= 0) {
          close(idx--);
        }
      }
      if (timeouts.length > 0) {
        autoCloseTimer = setTimeout(autoCloseLoop, 200);
      }
    };

    const close = function(idx) {
      idx = (idx === undefined) ? 0 : idx;
      if (stack.length === 0) return;
      if (idx >= stack.length) idx = stack.length - 1;
      const removed = stack.splice(idx, 1);
      if (removed.length === 0) return;
      const $popup = removed[0];
      timeouts.splice(idx, 1);
      const h = $popup[0] ? $popup[0].offsetHeight : 0;
      stackHeight -= h + space;

      $popup.removeClass('active');
      setTimeout(() => {
        $popup.remove();
      }, 300);

      // Reposition remaining popups
      stack.forEach((p, i) => {
        if (i >= idx && p.hasClass('active')) {
          p.stop(true, true).animate({
            top: parseInt(p.css('top')) + (h + 20)
          }, 600, 'easeOutQuint');
        }
      });

      if (stack.length === 0) {
        clearTimeout(autoCloseTimer);
        autoCloseTimer = null;
      }
    };

    const init = function() {
      // Create or reuse .minipopup-area
      let area = document.querySelector('.minipopup-area');
      if (!area) {
        area = document.createElement('div');
        area.className = 'minipopup-area';
        const pageWrapper = document.querySelector('.page-wrapper');
        if (pageWrapper) {
          pageWrapper.appendChild(area);
        } else {
          document.body.appendChild(area); // fallback
        }
      }
      $area = $(area);

      // Event for close button
      $area.on('click', '.mfp-close', function(e) {
        e.preventDefault();
        const $popup = $(this).closest('.minipopup-box');
        const idx = stack.indexOf($popup);
        if (idx !== -1) {
          close(idx);
        }
      });

      autoCloseLoop(); // Start the loop if needed
    };

    const open = function(options, callback) {
      const settings = $.extend(true, {}, CONFIG.miniPopupDefaults, options);
      const $popup = $(templateFn(settings.template, settings));
      space = settings.space || 20;

      $popup.appendTo($area).css('top', -stackHeight);
      const $img = $popup.find('img');

      const onLoad = function() {
        const h = $popup[0].offsetHeight;
        stackHeight += h + space;
        $popup.addClass('active');

        // Check if it would overflow viewport
        const offsetTop = $popup.offset().top - window.pageYOffset;
        if (offsetTop < 0) {
          close();
          $popup.css('top', -stackHeight + h + space);
          $popup.addClass('active'); // Re-add active
        }

        // Mouse/touch events for pause/resume
        $popup.on('mouseenter', pause)
              .on('mouseleave', resume)
              .on('touchstart', function(e) {
                pause();
                e.stopPropagation();
              })
              .on('mousedown', function() { $popup.addClass('focus'); })
              .on('mouseup', function() {
                const idx = stack.indexOf($popup);
                if (idx !== -1) close(idx);
              });

        // Global touch resume (note: multiple handlers accumulate, but harmless)
        $(document.body).on('touchstart.dynamic-popup', resume);

        stack.push($popup);
        timeouts.push(settings.delay);

        if (timeouts.length === 1) {
          autoCloseTimer = setTimeout(autoCloseLoop, 200);
        }

        if (callback) callback($popup);
      };

      if ($img.length && $img[0].complete) {
        onLoad();
      } else {
        $img.on('load', onLoad);
      }
    };

    const pause = function() { isPaused = true; };
    const resume = function() { isPaused = false; };

    return {
      init: init,
      open: open,
      close: close,
      pause: pause,
      resume: resume
    };
  })();

  // Build notification payload expected by MiniPopup.open
  function buildPayloadFor(product) {
    const buyer = pick(CONFIG.namePool);
    const minutesAgo = rand(CONFIG.recentTimeRangeMinMinutes, CONFIG.recentTimeRangeMaxMinutes);
    const timeText = humanTimeAgo(minutesAgo);
    const showQty = Math.random() < CONFIG.showQuantityChance;
    const qtyText = showQty ? ` • ${rand(CONFIG.quantityMin, CONFIG.quantityMax)} items` : "";
    const location = Math.random() < 0.6 ? pick(CONFIG.locations) : null;

    const content = `${buyer} purchased${qtyText}`;
    const action = `<span class="text-primary" style="font-size: 11px;">${timeText}${location ? ` • ${location}` : ""}</span>`;

    return {
      name: product.title,
      nameLink: product.url,
      imageSrc: product.image || CONFIG.placeholderImage,
      content: content,
      action: action
    };
  }

  // Show notification using our standalone MiniPopup
  function showNotification(product) {
    if (!product) return;
    const payload = buildPayloadFor(product);
    MiniPopup.open(payload);
  }

  // Neutralize original static behavior
  function neutralizeOriginal() {
    // Use MO to remove static popups and prevent their onload from firing
    const mo = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.classList && node.classList.contains('minipopup-box')) {
            if (node.textContent.includes('Mobile Speaker')) {
              // Prevent onload crash
              $(node).find('img').off('load');
              // Remove the static popup
              if (node.parentNode) {
                node.parentNode.removeChild(node);
              }
            }
          }
        });
      });
    });
    const target = document.querySelector('.page-wrapper') || document.body;
    mo.observe(target, { childList: true, subtree: true });
  }

  // Scheduling
  let timer = null;
  function scheduleNext() {
    // Exponential distribution for natural "arrival" timing
    let delay = -Math.log(1 - Math.random()) * CONFIG.meanIntervalMs;
    delay = Math.max(CONFIG.minIntervalMs, Math.min(CONFIG.maxIntervalMs, delay));

    timer = setTimeout(() => {
      // only fire when the page context is right
      const visible = CONFIG.visibleOnSelectors.some(sel => !!document.querySelector(sel));
      if (!visible) {
        scheduleNext();
        return;
      }
      const p = pickProduct();
      if (p) {
        incrementRecent(p.id);
        showNotification(p);
      }
      scheduleNext();
    }, delay);
  }

  function stopSchedule() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  // init
  async function init() {
    neutralizeOriginal();

    // Initialize our MiniPopup
    MiniPopup.init();

    // load JSON; try multiple paths used in your files
    const tries = [CONFIG.jsonPath, "assets/data/products.grouped2.json", "products.grouped2.json", "assets/data/products-grouped.json"];
    let raw = null;
    for (const url of tries) {
      try {
        // try fetch; tolerate failure and continue with next
        const res = await fetch(url, { cache: "no-cache" });
        if (!res.ok) throw new Error("not ok " + res.status);
        raw = await res.json();
        break;
      } catch (e) {
        // continue
      }
    }

    // also accept a page-global variable if present
    if (!raw && window.PRODUCTS_GROUPED) raw = window.PRODUCTS_GROUPED;

    if (!raw) {
      console.warn("dynamic-purchase-popup: could not load products JSON; popup will not run");
      return;
    }

    products = normalizeProducts(raw);
    if (!products.length) {
      console.warn("dynamic-purchase-popup: products list empty after normalization");
      return;
    }

    // Expose initializer (for manual call if needed, e.g., from console)
    window.initPurchasedMinipopup = function () {
      stopSchedule();
      scheduleNext();
    };

    // start immediately if page contains relevant selectors
    if (CONFIG.visibleOnSelectors.some(sel => document.querySelector(sel))) {
      window.initPurchasedMinipopup();
    }

    // watch for DOM changes and start/stop accordingly
    const mo = new MutationObserver(() => {
      const has = CONFIG.visibleOnSelectors.some(sel => document.querySelector(sel));
      if (has && !timer) scheduleNext();
      if (!has && timer) stopSchedule();
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });

    // Provide stop API if you want to stop notifications from console
    window.stopPurchasedMinipopup = function () {
      stopSchedule();
      mo.disconnect();
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();