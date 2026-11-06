/* site.js — the clone's own behaviour layer.
   The platform's 771 script references were removed, which also removed the
   behaviours they carried. This reimplements the ones the markup actually needs,
   using only the classes and elements the theme already ships. No dependencies. */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* --- <details> based menus and modals ---------------------------------
     The theme wires header menus, the search modal and disclosures as <details>
     elements. Native <details> already toggles; what the platform added was
     click-outside and Escape to close. */
  function bindDetails() {
    $$('details').forEach(function (d) {
      var summary = $('summary', d);
      if (!summary) return;
      summary.setAttribute('role', summary.getAttribute('role') || 'button');
      summary.setAttribute('aria-expanded', d.hasAttribute('open') ? 'true' : 'false');
      d.addEventListener('toggle', function () {
        summary.setAttribute('aria-expanded', d.hasAttribute('open') ? 'true' : 'false');
      });
    });
    document.addEventListener('click', function (e) {
      $$('details[open]').forEach(function (d) {
        if (!d.contains(e.target)) d.removeAttribute('open');
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      $$('details[open]').forEach(function (d) { d.removeAttribute('open'); });
    });
  }

  /* --- announcement bar ---------------------------------------------------
     The theme rotates the slides on a timer. Its own rotator threw
     "Cannot read properties of undefined (reading 'classList')" on the live site
     every cycle; this one reads the slide list before touching it. */
  function bindAnnouncement() {
    var bars = $$('.announcement-bar-slider, slideshow-component.announcement-bar-slider');
    bars.forEach(function (bar) {
      var slides = $$('.slideshow__slide, .announcement-bar__link, [id^="Slide-"]', bar);
      if (slides.length < 2) return;
      var i = slides.findIndex(function (s) { return s.getAttribute('aria-hidden') !== 'true'; });
      if (i < 0) i = 0;
      /* The source keeps every slide display:flex, visibility:visible, opacity:1 and
         hides the inactive ones by the slider track's scroll position — only
         aria-hidden differs. Toggling display:none instead removed two client
         sentences ("Now Shipping Internationally", "Free Shipping on Orders $75+")
         from innerText and from assistive tech, which the source does not do
         (measured against the live page, 2026-09-04). Move the track, not the box. */
      var track = slides[0] && slides[0].parentElement;
      var show = function (n) {
        slides.forEach(function (s, k) {
          if (!s || !s.setAttribute) return;
          s.setAttribute('aria-hidden', k === n ? 'false' : 'true');
        });
        var target = slides[n];
        if (track && target && track.scrollWidth > track.clientWidth) track.scrollLeft = target.offsetLeft;
      };
      show(i);
      setInterval(function () { i = (i + 1) % slides.length; show(i); }, 5000);
    });
  }

  /* --- cookie-consent banner (Jetpack block) -------------------------------
     The block's own view.js is a platform script and is removed, which left the dialog
     undismissable: "Accept" is an <a> with no href, measured 2026-10-20 on a live clone.
     The inline head guard that hides the banner once the eucookielaw cookie exists is kept
     by the builder, so the click only has to set that cookie, for the block's own lifetime
     (the <span> holds the days), and hide the dialog — what view.js did. */
  function bindCookieConsent() {
    $$('div.wp-block-jetpack-cookie-consent, div.block-jetpack-cookie-consent').forEach(function (box) {
      if (box.parentElement && box.parentElement.closest('div.wp-block-jetpack-cookie-consent, div.block-jetpack-cookie-consent')) return;
      var btn = box.querySelector('.wp-block-button__link, .block-button__link');
      if (!btn || btn.getAttribute('href')) return;
      var span = box.querySelector('span');
      var days = parseInt(span && span.textContent, 10) || 365;
      // No id and no href are added: an id anchors every path sr-sweep writes under it, and the
      // banner would stop matching its own source findings. The source writes href="#" here.
      btn.setAttribute('role', 'button');
      btn.setAttribute('tabindex', '0');
      var accept = function (e) {
        if (e) e.preventDefault();
        var until = Date.now() + days * 864e5;
        document.cookie = 'eucookielaw=' + until + ';path=/;max-age=' + days * 86400 + ';samesite=lax';
        box.style.display = 'none';
      };
      btn.addEventListener('click', accept);
      btn.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') accept(e); });
    });
  }

  /* --- localization selector ---------------------------------------------
     490 country/currency options that the platform posted to /localization.
     A static clone has no such endpoint, so the choice is remembered locally and
     reflected in the button label. Every option and label is left in place. */
  function bindLocalization() {
    $$('form[action*="localization"], .localization-form').forEach(function (form) {
      var button = $('button, summary', form);
      var options = $$('a[href="#top"], .disclosure__link', form);
      /* One reader for an option's label. textContent carries the source's newlines and
         indentation — "Afghanistan\n      \n        AFN\n        ؋" went into
         localStorage verbatim and into the button label, and the equality test on reload
         then compared raw whitespace. Collapse once, here, so the stored value, the
         rendered label and the comparison are all the same string. */
      var labelOf = function (o) { return o.textContent.replace(/\s+/g, ' ').trim(); };
      var key = 'clone:localization:' + (form.getAttribute('data-scope') || form.className || 'default');
      var saved = null;
      try { saved = localStorage.getItem(key); } catch (e) { saved = null; }
      if (saved && button) {
        var match = options.find(function (o) { return labelOf(o) === saved; });
        if (match) {
          var label = $('.localization-form__currency, span', button) || button;
          label.textContent = saved;
        }
      }
      options.forEach(function (o) {
        o.addEventListener('click', function (e) {
          e.preventDefault();
          var value = labelOf(o);
          try { localStorage.setItem(key, value); } catch (err) { /* private mode */ }
          if (button) {
            var lbl = $('.localization-form__currency, span', button) || button;
            lbl.textContent = value;
          }
          var open = o.closest('details');
          if (open) open.removeAttribute('open');
        });
      });
    });
  }

  /* --- cart notification --------------------------------------------------
     Present in the markup, hidden until the platform's cart JS revealed it.
     With no cart backend it stays hidden; the close control is still wired so the
     element behaves rather than sitting inert. */
  function bindCartNotification() {
    $$('#cart-notification, .cart-notification').forEach(function (n) {
      $$('.cart-notification__close, [aria-label*="Close" i]', n).forEach(function (btn) {
        btn.addEventListener('click', function () { n.classList.remove('active'); n.setAttribute('aria-hidden', 'true'); });
      });
    });
  }

  /* --- in-page anchors ----------------------------------------------------
     REMOVED. bindTopLinks() listened for a[href="#top"] and skipped any inside a
     localization form. Counted across the built site: 29,151 such anchors on 41 pages,
     and ZERO outside a localization form — every one is a country/currency option, which
     bindLocalization already preventDefaults. So the guard made the body of its own
     handler unreachable, and it cost a document-level click listener on every page for
     a link pattern this theme does not use. If a real back-to-top link ever appears,
     the native anchor jump is the correct behaviour anyway. */

  /* --- forms with no backend ----------------------------------------------
     The platform served /search, /cart, /cart/add, /localization and /contact. This
     build serves none of them — measured: all four return 404 — so submitting the footer
     newsletter, which sits on all 41 pages, navigated the visitor to a 404. The BUILDER
     marks these (it is the only thing that knows what the build contains); this only has
     to honour the mark. The form is left exactly as the source rendered it: no invented
     message, no disabled control, just no navigation to a page that is not there. */
  function bindUnwiredForms() {
    document.addEventListener('submit', function (e) {
      var form = e.target;
      if (!form || !form.hasAttribute || !form.hasAttribute('data-clone-unwired')) return;
      e.preventDefault();
      /* preventDefault stops the browser's submit, not the platform's own handler: its runtime
         binds submit on the form and posts it by XHR to the original site's form inbox. This
         listener runs in the capture phase on document, so stopping here means no handler
         below it ever sees the event. */
      e.stopImmediatePropagation();
      form.setAttribute('data-clone-submitted', form.getAttribute('data-clone-unwired'));
    }, true);
    /* Same stamp, same rule, for anchors: the theme's account links point at the platform's
       customer_authentication endpoint on the ORIGINAL store. Following one would take a
       visitor of the clone to the old shop's login. */
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest && e.target.closest('a[data-clone-unwired]');
      if (!a) return;
      e.preventDefault();
    }, true);
  }

  /* --- ui- components ----------------------------------------------------------
     A visual builder's component kit, with its runtime removed: tabs, dropdowns, the
     navbar, the lightbox, the slider, background video and custom checkboxes. The markup
     and the theme's stylesheet are the source's own (classes renamed ui-); these supply
     only the state changes the stylesheet keys on. Every function is a no-op on a page
     without its component. */
  function markJs() {
    var h = document.documentElement;
    h.classList.add('ui-mod-js');
    // No interaction player on this page: nothing will ever set the "motion is wired" class, and
    // the anti-flicker rules would keep animated elements hidden. Set it now.
    if (!document.querySelector('script[src$="/motion.js"]')) h.classList.add('ui-mod-motion');
    if ('ontouchstart' in window || (window.DocumentTouch && document instanceof window.DocumentTouch)) h.classList.add('ui-mod-touch');
  }

  function bindTabs() {
    $$('.ui-tabs').forEach(function (tabs) {
      var links = $$('.ui-tab-link', tabs).filter(function (l) { return l.closest('.ui-tabs') === tabs; });
      var panes = $$('.ui-tab-pane', tabs).filter(function (p) { return p.closest('.ui-tabs') === tabs; });
      var show = function (name) {
        links.forEach(function (l) {
          var on = l.getAttribute('data-ui-tab') === name;
          l.classList.toggle('ui--current', on);
          l.setAttribute('aria-selected', on ? 'true' : 'false');
          l.setAttribute('tabindex', on ? '0' : '-1');
        });
        panes.forEach(function (p) {
          var on = p.getAttribute('data-ui-tab') === name;
          p.classList.toggle('ui--tab-active', on);
          if (on) { p.style.opacity = '0'; requestAnimationFrame(function () { p.style.transition = 'opacity ' + (Number(tabs.getAttribute('data-duration-in')) || 300) + 'ms'; p.style.opacity = '1'; }); }
        });
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      };
      // What the source's runtime writes at load, the markup does not carry: a tab link has no
      // href until then, so it goes nowhere and takes no keyboard focus. Each link is pointed at
      // the pane of its own name; an href or id the page already wrote is left as it is.
      var g = $$('.ui-tabs').indexOf(tabs);
      links.forEach(function (l, i) {
        var name = l.getAttribute('data-ui-tab');
        var pane = panes.filter(function (p) { return p.getAttribute('data-ui-tab') === name; })[0];
        if (!l.id) l.id = 'ui-tabs-' + g + '-tab-' + i;
        if (pane) {
          if (!pane.id) pane.id = 'ui-tabs-' + g + '-pane-' + i;
          if (!l.getAttribute('href')) l.setAttribute('href', '#' + pane.id);
          if (!l.getAttribute('aria-controls')) l.setAttribute('aria-controls', pane.id);
          if (!pane.getAttribute('aria-labelledby')) pane.setAttribute('aria-labelledby', l.id);
        }
        var cur = l.classList.contains('ui--current');
        l.setAttribute('aria-selected', cur ? 'true' : 'false');
        l.setAttribute('tabindex', cur ? '0' : '-1');
      });
      links.forEach(function (l) {
        l.setAttribute('role', 'tab');
        l.addEventListener('click', function (e) { e.preventDefault(); show(l.getAttribute('data-ui-tab')); });
        l.addEventListener('keydown', function (e) {
          var i = links.indexOf(l);
          if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            var n = links[(i + (e.key === 'ArrowRight' ? 1 : links.length - 1)) % links.length];
            n.focus(); show(n.getAttribute('data-ui-tab'));
          }
        });
      });
      panes.forEach(function (p) { p.setAttribute('role', 'tabpanel'); });
    });
  }

  function bindDropdowns() {
    var open = [];
    var setOpen = function (dd, on) {
      var toggle = $('.ui-dropdown-toggle', dd), list = $('.ui-dropdown-list', dd);
      if (toggle) { toggle.classList.toggle('ui--open', on); toggle.setAttribute('aria-expanded', on ? 'true' : 'false'); }
      if (list) list.classList.toggle('ui--open', on);
      dd.style.zIndex = on ? '901' : '';
      var i = open.indexOf(dd);
      if (on && i < 0) open.push(dd); else if (!on && i >= 0) open.splice(i, 1);
      // the interaction player (motion.js) animates on these, as the source's dropdown events did
      if ((i < 0) === on) dd.dispatchEvent(new CustomEvent(on ? 'ui:dropdown-open' : 'ui:dropdown-close'));
    };
    $$('.ui-dropdown').forEach(function (dd) {
      var toggle = $('.ui-dropdown-toggle', dd);
      if (!toggle) return;
      toggle.setAttribute('aria-haspopup', 'menu');
      toggle.setAttribute('aria-expanded', 'false');
      var timer = null;
      var hover = dd.getAttribute('data-hover') === 'true' && window.matchMedia('(hover: hover)').matches;
      var delay = Number(dd.getAttribute('data-delay')) || 0;
      toggle.addEventListener('click', function (e) {
        e.preventDefault();
        setOpen(dd, open.indexOf(dd) < 0);
      });
      if (hover) {
        dd.addEventListener('mouseenter', function () { clearTimeout(timer); setOpen(dd, true); });
        dd.addEventListener('mouseleave', function () { clearTimeout(timer); timer = setTimeout(function () { setOpen(dd, false); }, delay); });
      }
    });
    document.addEventListener('click', function (e) {
      open.slice().forEach(function (dd) { if (!dd.contains(e.target)) setOpen(dd, false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') open.slice().forEach(function (dd) { setOpen(dd, false); });
    });
  }

  function bindNav() {
    $$('.ui-nav').forEach(function (nav) {
      var btn = $('.ui-nav-button', nav), menu = $('.ui-nav-menu', nav);
      if (!btn || !menu) return;
      btn.setAttribute('aria-label', btn.getAttribute('aria-label') || 'menu');
      btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var on = !menu.hasAttribute('data-nav-menu-open');
        if (on) menu.setAttribute('data-nav-menu-open', ''); else menu.removeAttribute('data-nav-menu-open');
        btn.classList.toggle('ui--open', on);
        btn.setAttribute('aria-expanded', on ? 'true' : 'false');
        nav.dispatchEvent(new CustomEvent(on ? 'ui:nav-open' : 'ui:nav-close'));
      });
      $$('a', menu).forEach(function (a) {
        a.addEventListener('click', function () {
          menu.removeAttribute('data-nav-menu-open'); btn.classList.remove('ui--open'); btn.setAttribute('aria-expanded', 'false');
        });
      });
    });
  }

  /* The lightbox builds the same DOM the source's runtime built, so the theme's stylesheet
     (ui-lightbox-*) draws it. Items come from the JSON each trigger carries; a shared group
     name joins triggers into one gallery. */
  function bindLightbox() {
    var triggers = $$('.ui-lightbox');
    if (!triggers.length) return;
    var itemsOf = function (a) {
      var j = $('script.ui-json', a);
      try { return JSON.parse(j ? j.textContent : '{}'); } catch (e) { return {}; }
    };
    var box = null, list = [], at = 0, opener = null;
    var el = function (tag, cls) { var n = document.createElement(tag); if (cls) n.className = cls; return n; };
    var render = function () {
      var view = $('.ui-lightbox-view', box);
      view.innerHTML = '';
      var frame = el('div', 'ui-lightbox-frame'), fig = el('figure', 'ui-lightbox-figure'), img = el('img', 'ui-lightbox-img ui-lightbox-image');
      img.src = list[at].url; img.alt = list[at].caption || '';
      fig.appendChild(img); frame.appendChild(fig); view.appendChild(frame);
      $('.ui-lightbox-left', box).classList.toggle('ui-lightbox-inactive', at === 0);
      $('.ui-lightbox-right', box).classList.toggle('ui-lightbox-inactive', at === list.length - 1);
      $$('.ui-lightbox-item', box).forEach(function (li, i) { li.classList.toggle('ui-lightbox-active', i === at); });
    };
    var close = function () {
      if (!box) return;
      box.remove(); box = null;
      document.documentElement.classList.remove('ui-lightbox-noscroll');
      if (opener) opener.focus();
    };
    var openAt = function (items, i, from) {
      list = items; at = i; opener = from;
      box = el('div', 'ui-lightbox-backdrop');
      box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.tabIndex = -1;
      var c = el('div', 'ui-lightbox-container'), content = el('div', 'ui-lightbox-content'), view = el('div', 'ui-lightbox-view');
      var left = el('button', 'ui-lightbox-control ui-lightbox-left'), right = el('button', 'ui-lightbox-control ui-lightbox-right'), x = el('button', 'ui-lightbox-control ui-lightbox-close');
      left.setAttribute('aria-label', 'previous image'); right.setAttribute('aria-label', 'next image'); x.setAttribute('aria-label', 'close lightbox');
      content.appendChild(view); content.appendChild(left); content.appendChild(right); content.appendChild(x);
      c.appendChild(content);
      if (list.length > 1) {
        var strip = el('div', 'ui-lightbox-strip');
        list.forEach(function (it, n) {
          var li = el('a', 'ui-lightbox-item'), th = el('div', 'ui-lightbox-thumbnail'), ti = el('img', 'ui-lightbox-thumbnail-image');
          ti.src = it.url; ti.alt = ''; th.appendChild(ti); li.appendChild(th); li.href = '#top';
          li.addEventListener('click', function (e) { e.preventDefault(); at = n; render(); });
          strip.appendChild(li);
        });
        c.appendChild(strip);
      }
      box.appendChild(c);
      left.addEventListener('click', function () { if (at > 0) { at--; render(); } });
      right.addEventListener('click', function () { if (at < list.length - 1) { at++; render(); } });
      x.addEventListener('click', close);
      box.addEventListener('click', function (e) { if (e.target === box || e.target === c || e.target === content) close(); });
      document.body.appendChild(box);
      document.documentElement.classList.add('ui-lightbox-noscroll');
      render(); box.focus();
    };
    document.addEventListener('keydown', function (e) {
      if (!box) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft' && at > 0) { at--; render(); }
      else if (e.key === 'ArrowRight' && at < list.length - 1) { at++; render(); }
    });
    triggers.forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var data = itemsOf(a), items = (data.items || []).filter(function (it) { return it.type !== 'video'; });
        var start = 0;
        if (data.group) {
          var all = [];
          triggers.forEach(function (t) {
            var d = itemsOf(t);
            if (d.group !== data.group) return;
            if (t === a) start = all.length;
            all = all.concat((d.items || []).filter(function (it) { return it.type !== 'video'; }));
          });
          items = all;
        }
        if (items.length) openAt(items, start, a);
      });
    });
  }

  function bindSliders() {
    $$('.ui-slider').forEach(function (sl) {
      var mask = $('.ui-slider-mask', sl);
      if (!mask) return;
      var slides = $$('.ui-slide', mask);
      if (!slides.length) return;
      var fade = /fade|cross/.test(sl.getAttribute('data-animation') || '');
      var dur = Number(sl.getAttribute('data-duration')) || 500;
      var infinite = sl.getAttribute('data-infinite') === 'true';
      var at = 0;
      var nav = $('.ui-slider-nav', sl);
      var dots = [];
      if (nav) {
        nav.innerHTML = '';
        slides.forEach(function (s, i) {
          var d = document.createElement('div');
          d.className = 'ui-slider-dot'; d.setAttribute('role', 'button'); d.tabIndex = 0;
          d.setAttribute('aria-label', 'Show slide ' + (i + 1) + ' of ' + slides.length);
          d.addEventListener('click', function () { go(i); });
          nav.appendChild(d); dots.push(d);
        });
      }
      var go = function (i) {
        if (i < 0) i = infinite ? slides.length - 1 : 0;
        if (i >= slides.length) i = infinite ? 0 : slides.length - 1;
        at = i;
        slides.forEach(function (s, n) {
          s.style.transition = (fade ? 'opacity ' : 'transform ') + dur + 'ms ease';
          if (fade) { s.style.opacity = n === at ? '1' : '0'; s.style.zIndex = n === at ? '1' : '0'; }
          else s.style.transform = 'translateX(' + (-100 * at) + '%)';
          s.setAttribute('aria-hidden', n === at ? 'false' : 'true');
        });
        dots.forEach(function (d, n) { d.classList.toggle('ui-active', n === at); });
      };
      if (fade) slides.forEach(function (s, n) { s.style.position = n ? 'absolute' : 'relative'; s.style.top = '0'; s.style.left = '0'; s.style.width = '100%'; });
      var l = $('.ui-slider-arrow-left', sl), r = $('.ui-slider-arrow-right', sl);
      if (l) l.addEventListener('click', function () { go(at - 1); });
      if (r) r.addEventListener('click', function () { go(at + 1); });
      go(0);
      if (sl.getAttribute('data-autoplay') === 'true') {
        var delay = Number(sl.getAttribute('data-delay')) || 4000;
        setInterval(function () { go(at + 1); }, delay);
      }
    });
  }

  function bindBackgroundVideo() {
    $$('.ui-background-video').forEach(function (wrap) {
      var v = $('video', wrap);
      if (!v) return;
      v.muted = true;
      if (wrap.getAttribute('data-autoplay') === 'true' && v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      $$('.ui-backgroundvideo-backgroundvideoplaypausebutton, .ui-background-video--control', wrap).forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          if (v.paused) { v.play(); btn.setAttribute('aria-label', 'Pause video'); } else { v.pause(); btn.setAttribute('aria-label', 'Play video'); }
          btn.classList.toggle('is-paused', v.paused);
        });
      });
    });
  }

  /* --- 3D scenes ---------------------------------------------------------------
     The platform's runtime drew each scene into the <canvas> inside its container. The scene
     file stays on the scene vendor's host and only the vendor's player can draw it — an embed
     with no local alternative, kept and named like a video player. Loaded once, when the first
     scene nears the viewport; the outcome is stamped on the container so a browser check can
     read whether it painted. A failed load leaves the container as it was. */
  var SCENE_PLAYER = 'https://unpkg.com/@splinetool/runtime@2.0.73/build/runtime.js';
  function bindScenes() {
    var boxes = $$('[data-spline-url]');
    if (!boxes.length) return;
    var player = null;
    var draw = function (box) {
      if (box.getAttribute('data-clone-scene')) return;
      box.setAttribute('data-clone-scene', 'loading');
      var canvas = $('canvas', box);
      if (!canvas) { canvas = document.createElement('canvas'); box.appendChild(canvas); }
      player = player || import(SCENE_PLAYER);
      player.then(function (m) { return new m.Application(canvas).load(box.getAttribute('data-spline-url')); })
        .then(function () { box.setAttribute('data-clone-scene', 'live'); })
        .catch(function () { box.setAttribute('data-clone-scene', 'failed'); });
    };
    if (!('IntersectionObserver' in window)) { boxes.forEach(draw); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); draw(e.target); } });
    }, { rootMargin: '200px' });
    boxes.forEach(function (b) { io.observe(b); });
  }

  function bindCustomInputs() {
    var sync = function (input) {
      var box = input.parentElement && $('.ui-checkbox-input--inputType-custom, .ui-form-formradioinput--inputType-custom', input.parentElement);
      if (input.type === 'radio' && input.name) {
        $$('input[type="radio"][name="' + input.name.replace(/"/g, '\\"') + '"]').forEach(function (r) {
          var b = r.parentElement && $('.ui-form-formradioinput--inputType-custom', r.parentElement);
          if (b) b.classList.toggle('ui--redirected-checked', r.checked);
        });
      } else if (box) box.classList.toggle('ui--redirected-checked', input.checked);
    };
    $$('.ui-checkbox input[type="checkbox"], .ui-radio input[type="radio"]').forEach(function (input) {
      input.addEventListener('change', function () { sync(input); });
      input.addEventListener('focus', function () { var b = input.previousElementSibling; if (b) b.classList.add('ui--redirected-focus'); });
      input.addEventListener('blur', function () { var b = input.previousElementSibling; if (b) b.classList.remove('ui--redirected-focus'); });
      sync(input);
    });
  }

  function init() {
    bindUnwiredForms();
    bindDetails();
    bindAnnouncement();
    bindLocalization();
    bindCartNotification();
    markJs();
    bindTabs();
    bindDropdowns();
    bindNav();
    bindLightbox();
    bindSliders();
    bindBackgroundVideo();
    bindScenes();
    bindCustomInputs();
    bindCookieConsent();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
