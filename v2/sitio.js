// Contenido editable y contadores del sitio (ver supabase/admin.sql).
//
// Uso en cada página, después de supabase-config.js:
//   <script src="v2/sitio.js" data-pagina="johnfer" defer></script>
//
// - Textos:   <p data-edit="johnfer.sobre.parrafo1" data-edit-label="Párrafo 1">…</p>
// - Imágenes: <img data-edit-img="…"> o un elemento con style="--img: url(…)".
// - Descargas: <a data-descarga="metodo-eufonio">…</a>
// Si Supabase no responde, la página se queda con su contenido original.
(function () {
  const script = document.currentScript;
  const pagina = script && script.dataset.pagina;
  const cfg = window.FIEB_SUPABASE || {};
  const conectado = Boolean(cfg.url && cfg.anonKey);
  const headers = { apikey: cfg.anonKey, 'Content-Type': 'application/json' };

  // ---- Formato de texto: *cursiva*, **negrita**, salto de línea = <br> ----

  function escapar(texto) {
    return texto.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function formatear(texto) {
    return escapar(texto)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\r?\n/g, '<br>');
  }

  // Inverso de formatear(): lee el texto original de un elemento del HTML.
  function aTexto(el) {
    let salida = '';
    el.childNodes.forEach(nodo => {
      if (nodo.nodeType === 3) salida += nodo.textContent.replace(/\s+/g, ' ');
      else if (nodo.nodeName === 'BR') salida += '\n';
      else if (nodo.nodeName === 'EM' || nodo.nodeName === 'I') salida += '*' + aTexto(nodo) + '*';
      else if (nodo.nodeName === 'STRONG' || nodo.nodeName === 'B') salida += '**' + aTexto(nodo) + '**';
      else if (nodo.nodeType === 1) salida += aTexto(nodo);
    });
    return salida.split('\n').map(linea => linea.trim()).join('\n').trim();
  }

  window.Sitio = { formatear, aTexto };
  if (!pagina || !conectado) return;

  // ---- Contenido editable ----

  const originales = new Map();
  const editables = () => document.querySelectorAll('[data-edit], [data-edit-img]');

  function guardarOriginales() {
    editables().forEach(el => {
      if (originales.has(el)) return;
      originales.set(el, el.dataset.edit
        ? el.innerHTML
        : (el.tagName === 'IMG' ? el.getAttribute('src') : el.style.getPropertyValue('--img')));
    });
  }

  function aplicar(filas) {
    const mapa = new Map((filas || []).map(f => [f.clave, f]));
    editables().forEach(el => {
      const original = originales.get(el);
      if (el.dataset.edit) {
        const fila = mapa.get(el.dataset.edit);
        el.innerHTML = fila && fila.tipo === 'texto' ? formatear(fila.valor) : original;
        return;
      }
      const fila = mapa.get(el.dataset.editImg);
      const url = fila && fila.tipo === 'imagen' && /^https:\/\//.test(fila.valor) ? fila.valor : null;
      if (el.tagName === 'IMG') el.setAttribute('src', url || original);
      else el.style.setProperty('--img', url ? `url("${url.replace(/["\\\n]/g, '')}")` : original);
    });
  }

  // Lo último que se vio se aplica de inmediato y luego se refresca desde Supabase.
  const claveCache = 'sitio-contenido:' + pagina;
  function leerCache() {
    try { return JSON.parse(localStorage.getItem(claveCache)); } catch (e) { return null; }
  }
  function escribirCache(filas) {
    try { localStorage.setItem(claveCache, JSON.stringify(filas)); } catch (e) { /* sin almacenamiento */ }
  }

  function cargarContenido() {
    guardarOriginales();
    const cache = leerCache();
    if (cache) aplicar(cache);

    const control = new AbortController();
    setTimeout(() => control.abort(), 8000);
    fetch(`${cfg.url}/rest/v1/contenido?select=clave,tipo,valor&clave=like.${pagina}.*`, { headers, signal: control.signal })
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(filas => { aplicar(filas); escribirCache(filas); })
      .catch(() => { /* se queda con el contenido original o la caché */ });
  }

  // ---- Contadores: una visita por página y sesión; una descarga por archivo y sesión ----

  function noContar() {
    try { return navigator.webdriver || localStorage.getItem('sitio-no-contar') === '1'; } catch (e) { return false; }
  }

  function registrar(tipo, recurso) {
    const marca = `sitio-contado:${tipo}:${recurso}`;
    try {
      if (sessionStorage.getItem(marca)) return;
      sessionStorage.setItem(marca, '1');
    } catch (e) { /* sin almacenamiento: se cuenta igual */ }
    if (noContar()) return;
    fetch(`${cfg.url}/rest/v1/rpc/registrar_evento`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ p_tipo: tipo, p_recurso: recurso }),
      keepalive: true
    }).catch(() => {});
  }

  document.addEventListener('click', e => {
    const enlace = e.target.closest && e.target.closest('[data-descarga]');
    if (enlace) registrar('descarga', enlace.dataset.descarga);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', cargarContenido);
  else cargarContenido();
  registrar('visita', pagina);
})();
