/* Comfort Xpress · interacciones
   El contenido vive en el HTML; este archivo solo lo enriquece. Cada bloque va aislado con safe(). */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reducido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var T = {};
  try { T = JSON.parse($('#i18n').textContent); } catch (e) {}

  function safe(nombre, fn) {
    try { fn(); } catch (e) { if (window.console) console.warn('[CX] ' + nombre, e); }
  }

  function observar(els, fn, opciones) {
    if (!('IntersectionObserver' in window)) { els.forEach(fn); return; }
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) { fn(en.target); io.unobserve(en.target); }
      });
    }, opciones || { threshold: 0.05, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- barra: sólida al desplazarse ---------- */
  safe('barra', function () {
    var barra = $('#barra');
    var actualizar = function () { barra.classList.toggle('solida', window.scrollY > 40); };
    window.addEventListener('scroll', actualizar, { passive: true });
    actualizar();
  });

  /* ---------- menú móvil ---------- */
  safe('menu', function () {
    var btn = $('#hamburguesa'), menu = $('#menu');
    var cerrar = function () {
      menu.classList.remove('abierto');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', btn.dataset.abrir);
    };
    btn.addEventListener('click', function () {
      var abierto = menu.classList.toggle('abierto');
      btn.setAttribute('aria-expanded', abierto ? 'true' : 'false');
      btn.setAttribute('aria-label', abierto ? btn.dataset.cerrar : btn.dataset.abrir);
    });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', cerrar); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrar(); });
  });

  /* ---------- enlace activo del menú ---------- */
  safe('pagina-activa', function () {
    $$('.menu a:not([href*="#"]), .pie-nav a').forEach(function (a) {
      var esInicio = /\.\/$/.test(a.getAttribute('href'));  // el enlace "Inicio" no se marca
      if (!esInicio && a.pathname === location.pathname) {
        a.classList.add('activo');
        a.setAttribute('aria-current', 'page');
      }
    });
  });

  safe('activo', function () {
    if (!('IntersectionObserver' in window)) return;
    var enlaces = $$('.menu a[href^="#"]');
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        enlaces.forEach(function (a) { a.classList.toggle('activo', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    enlaces.forEach(function (a) { var s = $(a.getAttribute('href')); if (s) io.observe(s); });
  });

  /* ---------- apariciones, subrayados, pines ---------- */
  safe('aparece', function () {
    var marcar = function (el) { el.classList.add('visto'); };
    observar($$('.aparece, .subraya, .carril'), marcar);
    observar($$('.cabeza .pin'), function (p) { p.classList.add('on'); }, { threshold: 1, rootMargin: '0px 0px -25% 0px' });
    // Red de seguridad: nada queda oculto si el observador falla.
    setTimeout(function () {
      $$('.aparece, .subraya, .carril').forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) marcar(el);
      });
    }, 1500);
  });

  /* ---------- línea de ruta que se dibuja al bajar ---------- */
  safe('ruta', function () {
    var tramos = $$('.tramo');
    if (reducido || !tramos.length) return;
    var pendiente = false;
    var pintar = function () {
      pendiente = false;
      var guia = window.innerHeight * 0.62;
      tramos.forEach(function (t) {
        var r = t.getBoundingClientRect();
        var p = Math.min(1, Math.max(0, (guia - r.top) / r.height));
        t.style.setProperty('--p', p.toFixed(3));
      });
    };
    var pedir = function () { if (!pendiente) { pendiente = true; requestAnimationFrame(pintar); } };
    window.addEventListener('scroll', pedir, { passive: true });
    window.addEventListener('resize', pedir);
    pintar();
  });

  /* ---------- cifras que cuentan ---------- */
  safe('cifras', function () {
    var formato = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
    observar($$('.cuenta'), function (el) {
      var final = parseInt(el.dataset.a.replace(/\D/g, ''), 10);
      if (reducido || !final) return;
      var inicio = null, dur = 1600;
      var paso = function (t) {
        if (!inicio) inicio = t;
        var k = Math.min(1, (t - inicio) / dur);
        el.textContent = formato(Math.round(final * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(paso);
      };
      el.textContent = '0';
      requestAnimationFrame(paso);
    }, { threshold: 0.6 });
  });

  /* ---------- carril de la flota ---------- */
  safe('carril', function () {
    var carril = $('#carril');
    if (!carril) return;
    var paso = function () { var a = $('.auto', carril); return a ? a.getBoundingClientRect().width + 20 : 320; };
    $$('[data-carril]').forEach(function (b) {
      b.addEventListener('click', function () { carril.scrollBy({ left: paso() * Number(b.dataset.carril), behavior: reducido ? 'auto' : 'smooth' }); });
    });
    // Arrastre con el mouse (en pantallas táctiles el desplazamiento es nativo).
    var x0 = 0, s0 = 0, activo = false, movido = false;
    carril.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      activo = true; movido = false; x0 = e.clientX; s0 = carril.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!activo) return;
      var dx = e.clientX - x0;
      if (Math.abs(dx) > 4) { movido = true; carril.classList.add('arrastrando'); }
      carril.scrollLeft = s0 - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!activo) return;
      activo = false;
      carril.classList.remove('arrastrando');
    });
    carril.addEventListener('click', function (e) { if (movido) { e.preventDefault(); movido = false; } }, true);
    carril.addEventListener('dragstart', function (e) { e.preventDefault(); });
    carril.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') carril.scrollBy({ left: paso() });
      if (e.key === 'ArrowLeft') carril.scrollBy({ left: -paso() });
    });
  });

  /* ---------- testimonios ---------- */
  safe('testimonios', function () {
    var caja = $('#testi');
    if (!caja) return;
    var items = $$('.testi-item', caja), puntos = $$('[data-ir]', caja), i = 0, reloj = null;
    var ir = function (n) {
      i = (n + items.length) % items.length;
      items.forEach(function (el, k) { el.classList.toggle('activo', k === i); el.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
      puntos.forEach(function (p, k) { p.classList.toggle('on', k === i); p.setAttribute('aria-current', k === i ? 'true' : 'false'); });
    };
    var parar = function () { clearInterval(reloj); reloj = null; };
    var seguir = function () { if (!reducido && !reloj) reloj = setInterval(function () { ir(i + 1); }, 7000); };
    $$('[data-testi]', caja).forEach(function (b) { b.addEventListener('click', function () { ir(i + Number(b.dataset.testi)); parar(); }); });
    puntos.forEach(function (p) { p.addEventListener('click', function () { ir(Number(p.dataset.ir)); parar(); }); });
    caja.addEventListener('mouseenter', parar);
    caja.addEventListener('mouseleave', seguir);
    caja.addEventListener('focusin', parar);
    document.addEventListener('visibilitychange', function () { if (document.hidden) parar(); else seguir(); });
    ir(0);
    seguir();
  });

  /* ---------- cotizador paso a paso → WhatsApp ---------- */
  safe('cotizador', function () {
    var form = $('#cotizador');
    if (!form) return;
    var pasos = $$('.cot-paso', form), barras = $$('.cot-barra span', form);
    var btnSig = $('#cot-siguiente'), btnAtras = $('#cot-atras'), error = $('#cot-error'), num = $('#cot-n');
    var actual = 0, total = pasos.length;

    var hoy = new Date();
    var iso = new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    form.elements.fecha.min = iso;

    var mostrar = function (n, enfocar) {
      actual = n;
      pasos.forEach(function (p, k) { p.hidden = k !== n; p.classList.toggle('activo', k === n); });
      barras.forEach(function (b, k) { b.classList.toggle('on', k <= n); });
      num.textContent = n + 1;
      btnAtras.hidden = n === 0;
      $('span', btnSig).textContent = n === total - 1 ? T.enviar : T.siguiente;
      error.hidden = true;
      if (enfocar) { var c = $('input:not([type=radio]), input:checked', pasos[n]); if (c) c.focus({ preventScroll: true }); }
    };

    var valido = function () {
      var ok = true;
      $$('input[required]', pasos[actual]).forEach(function (inp) {
        var bien = inp.value.trim() !== '' && (!inp.min || inp.type !== 'date' || inp.value >= inp.min);
        inp.classList.toggle('error', !bien);
        if (!bien) ok = false;
      });
      error.hidden = ok;
      return ok;
    };

    var fechaBonita = function (v) {
      if (!v) return '';
      var p = v.split('-');
      var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
      try { return d.toLocaleDateString(T.lang === 'en' ? 'en-US' : 'es-NI', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
      catch (e) { return v; }
    };

    var mensaje = function () {
      var f = form.elements;
      var lineas = [
        T.msg_saludo,
        '• ' + T.msg_servicio + ': ' + f.servicio.value,
        '• ' + T.msg_fecha + ': ' + fechaBonita(f.fecha.value) + ', ' + f.hora.value,
        '• ' + T.msg_tipo + ': ' + f.tipo.value,
        '• ' + T.msg_pasajeros + ': ' + f.pasajeros.value,
        '• ' + T.msg_origen + ': ' + f.origen.value.trim(),
        '• ' + T.msg_destino + ': ' + f.destino.value.trim(),
        '• ' + T.msg_nombre + ': ' + f.nombre.value.trim()
      ];
      if (f.empresa.value.trim()) lineas.push('• ' + T.msg_empresa + ': ' + f.empresa.value.trim());
      return lineas.join('\n');
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!valido()) return;
      if (actual < total - 1) { mostrar(actual + 1, true); return; }
      var url = 'https://wa.me/' + T.wa + '?text=' + encodeURIComponent(mensaje());
      var ventana = window.open(url, '_blank', 'noopener');
      if (!ventana) window.location.href = url;
    });
    btnAtras.addEventListener('click', function () { mostrar(actual - 1, true); });
    form.addEventListener('input', function (e) { if (e.target.classList.contains('error') && e.target.value.trim()) { e.target.classList.remove('error'); } });

    // Contador de pasajeros
    var pas = form.elements.pasajeros;
    $$('.contador-btn', form).forEach(function (b) {
      b.addEventListener('click', function () {
        var v = Math.min(60, Math.max(1, (parseInt(pas.value, 10) || 1) + Number(b.dataset.delta)));
        pas.value = v;
      });
    });
    pas.addEventListener('change', function () { pas.value = Math.min(60, Math.max(1, parseInt(pas.value, 10) || 1)); });

    // "Para usted" lleva al cotizador con el primer servicio elegido
    $$('[data-servicio]').forEach(function (a) {
      a.addEventListener('click', function () {
        var r = form.querySelectorAll('input[name=servicio]')[Number(a.dataset.servicio)];
        if (r) r.checked = true;
        mostrar(0, false);
      });
    });

    mostrar(0, false);
  });
})();
