# Inventario de imágenes del sitio

Para reemplazar una imagen: guarda la tuya en `assets/images/` con el nombre indicado abajo
(minúsculas, guiones) y avisa cuál reemplaza a cuál. Preferir `.webp` o `.jpg` sobre `.png`
para fotos — pesan mucho menos para la misma calidad.

## Logos (locales, en `assets/logos/`)

| Archivo | Dónde se usa | Nota |
|---|---|---|
| `fieb_logo_light.png` | Hero de la página FIEB (logo grande) | 1200×375 aprox. Fondo transparente |
| `fieb_logo_gold_small.png` | Navbar FIEB, tarjetas de ecosistema y proyectos | ⚠️ Es azul marino (no dorado). Falta versión clara para fondos oscuros |
| `jhonfer_logo_white.png` | Hero de la página Johnfer Laverde | Logo blanco grande, fondo transparente |
| `jhonfer_logo_white_small.png` | Navbar Johnfer, tarjetas de ecosistema | Blanco — sobre fondos claros va dentro de un chip oscuro |
| `fundacion_logo_gold.png` | Hero de la página Fundación (logo grande) | Dorado con glow |
| `fundacion_logo_gold_small.png` | Navbar Fundación, tarjetas de ecosistema | |

## Fotos (locales, en `assets/images/`)

| Archivo | Dónde se usa | Estado |
|---|---|---|
| `fundacion-hero-cultura-deporte.webp` | **Fundación** → fondo del hero (lavado azul noche) | ✅ Foto propia (iglesia/plaza) con íconos de los 4 pilares superpuestos |
| `jhonfer-trayectoria.webp` | **Johnfer** → foto "Sobre mí" (retrato 4:5) | ✅ Foto propia con eufonio |
| `jhonfer-hero-background-v3.webp` | **Johnfer** → fondo del hero (retrato ilustrado integrado a la derecha) | ✅ Texto del hero centrado (sin alineación especial) |
| — | **FIEB** → fondo del hero | ⏳ Sigue siendo la foto de Wikimedia (eufonio en ensayo, CC BY-SA 4.0). Reemplazar por foto propia del festival: `fieb-hero.jpg`, 1920×1080 horizontal |

Los `.png` junto a cada `.webp` son el original de mayor peso — se conservan como respaldo pero la página usa el `.webp` (mismo contenido, 5-6× más liviano).

## Fotos que NO existen aún y valdría la pena agregar

- Fotos de los **maestros invitados** del FIEB (las tarjetas hoy muestran iniciales en círculo).
  Formato: cuadradas, mínimo 200×200, nombradas por maestro (ej. `adam-frey.jpg`).
- Fotos de cada **edición del festival** para la línea de tiempo (opcional).
- **Favicon** del sitio (no hay): 512×512 PNG con el ícono del eufonio.

## Consejo

Las fotos de fondo llevan un degradado de color encima (lavado tonal), así que funcionan
mejor fotos con buen contraste y un sujeto claro (instrumento, escenario, músicos).
No hace falta editarlas: el lavado lo pone el CSS.
