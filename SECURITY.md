# Política de seguridad

## Versiones con soporte

Solo la última versión de la rama `master` recibe correcciones.

## Cómo avisar de una vulnerabilidad

No abras una issue pública. Usa **[Report a vulnerability](https://github.com/BertMarti/squad-summoner-v3/security/advisories/new)**
(avisos privados de GitHub) con los pasos para reproducirla. Intentaré responder en unos días.

## Buenas prácticas del proyecto

- La **API key de Gemini** nunca se sube a git ni a la web publicada: en GitHub Pages cada persona pega la suya y se guarda
  solo en su navegador (`localStorage`). El build de Pages falla si encuentra `VITE_GOOGLE_API_KEY`.
- El `.env` y la sesión de WhatsApp (`server/.wwebjs_auth/`) están en `.gitignore`: contienen secretos.
- El servidor de WhatsApp escucha solo en `127.0.0.1`, acepta peticiones únicamente de los orígenes de `ALLOWED_ORIGINS`,
  valida y limita los mensajes y aplica un límite de envíos por minuto.
- El CI ejecuta gitleaks, `npm audit`, tipos, pruebas y build en cada PR; Dependabot propone actualizaciones semanales.
