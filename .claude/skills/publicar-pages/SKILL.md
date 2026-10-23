---
name: publicar-pages
description: Comprobar en local y publicar la versión web (modo demo) de Squad Summoner en GitHub Pages bajo /squad-summoner-v3/.
---

# Publicar en GitHub Pages

La web se publica sola con `.github/workflows/pages.yml` en cada push a `master` (o a mano desde *Actions → Pages →
Run workflow*). Esta skill sirve para comprobarlo antes y diagnosticar fallos.

## 1. Comprobar en local

```sh
npm ci
npm run type-check && npm test
npm run build:pages            # VITE_DEPLOY_TARGET=pages → base /squad-summoner-v3/, sin clave, sin botón de servidor
grep -rEo 'AIza[0-9A-Za-z_-]{35}' dist && echo "¡CLAVE EN dist!"   # no debe imprimir nada
mkdir -p /tmp/pages && rm -rf /tmp/pages/squad-summoner-v3 && cp -r dist /tmp/pages/squad-summoner-v3
python3 -m http.server 8080 --directory /tmp/pages
```

Abre <http://localhost:8080/squad-summoner-v3/>: debe verse el aviso «Versión web de demostración», cargar las
ilustraciones de `games/` y generar en modo demo. Si algo da 404, revisa que las rutas usen `import.meta.env.BASE_URL`.

## 2. Publicar

1. Fusiona en `master` (PR). El workflow `Pages` compila, crea `404.html` y `.nojekyll` y despliega.
2. Si es la primera vez, *Settings → Pages → Source* debe ser **GitHub Actions**
   (o `gh api -X POST repos/BertMarti/squad-summoner-v3/pages -f build_type=workflow`).
3. Comprueba <https://bertmarti.github.io/squad-summoner-v3/>.

## Errores típicos

- `VITE_GOOGLE_API_KEY está definida en una compilación para GitHub Pages`: quita la variable del entorno del build.
- Pantalla en blanco: base incorrecta (mayúsculas del nombre del repo) o violación de CSP (mira la consola).
- Un dominio externo nuevo (fuente, API) no carga: añádelo a la CSP de `vite.config.ts`.
