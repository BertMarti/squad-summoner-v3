<div align="center">

<img src="docs/img/banner.svg" alt="Squad Summoner v3 — Protocolo de Invocación Táctica" width="100%">

[![Probar online](https://img.shields.io/badge/▶_probar_online-GitHub_Pages-ffbd00?style=for-the-badge&labelColor=05080c)](https://bertmarti.github.io/squad-summoner-v3/)
[![CI](https://github.com/BertMarti/squad-summoner-v3/actions/workflows/ci.yml/badge.svg)](https://github.com/BertMarti/squad-summoner-v3/actions/workflows/ci.yml)
[![Licencia MIT](https://img.shields.io/badge/licencia-MIT-4db8ff?labelColor=0d121d)](LICENSE)
[![Gemini](https://img.shields.io/badge/IA-Google_Gemini-4db8ff?labelColor=0d121d&logo=google&logoColor=white)](https://aistudio.google.com/apikey)

*«No mandes un simple "¿jugamos?". Manda una orden de movilización orbital.»*

### [▶ Abrir Squad Summoner](https://bertmarti.github.io/squad-summoner-v3/)

</div>

---

## 🎖️ ¿Qué es?

**Squad Summoner** es una pequeña web para gamers con un único objetivo: **conseguir que tu grupo se conecte a jugar**.

Eliges el juego, escribes quién tiene que venir y a qué hora, y la IA de **Google Gemini** redacta una convocatoria
épica metida de lleno en el papel: propaganda de la Super Tierra, decretos del Administratum o un aviso de caza desde la
cantina. Luego la copias o la mandas por WhatsApp con un toque.

## 🎯 ¿Para qué sirve?

- Para dejar de escribir «¿jugamos esta noche?» y que nadie conteste.
- Para que el grupo se ría (y se sienta un poco culpable si llega tarde).
- Para tener un mensaje distinto cada vez, con el tono de cada juego:

| Juego | Tono de la transmisión |
|---|---|
| 🏴 **Helldivers 2** | Propaganda máxima por la Democracia Gestionada. ¡LIBER-TÉ! |
| ⚔️ **Space Marine 2** | Decretos góticos del Imperio: la impuntualidad es herejía. |
| 🐾 **Monster Hunter** (World, Rise o Wilds) | La Encargada te espera en la cantina con las armas afiladas. |
| ⛏️ **Deep Rock Galactic** | ¡Rock and Stone! La extracción no espera a ningún enano. |
| 🌌 **Destiny 2** | Convocatoria para Guardianes: el destino de la escuadra está en juego. |
| 🖊️ **Personalizado** | Escribes el nombre de tu juego y la IA se mete en su papel. |

Y además: guarda tus mensajes favoritos como **⭐ plantillas** para reutilizarlos sin gastar IA, y escucha la
transmisión con **🔊 LEER EN VOZ ALTA**.

## 📸 Así se ve

<p align="center">
  <img src="docs/img/captura-escritorio.png" alt="Squad Summoner en el ordenador: seis juegos, reclutas, hora, tono cutre, encuesta de asistencia, una transmisión de Deep Rock Galactic y el historial" width="72%">
  &nbsp;
  <img src="docs/img/captura-movil.png" alt="Squad Summoner en el móvil: la transmisión con la encuesta ✅ voy / ❌ no puedo y los botones Copiar y Compartir en WhatsApp" width="22%">
</p>

## 🕹️ Cómo se usa, paso a paso

1. **Abre la web**: <https://bertmarti.github.io/squad-summoner-v3/> (funciona en el ordenador y en el móvil).
2. **01 · Selecciona el teatro**: toca la tarjeta de tu juego.
3. **02 · Parámetros**: escribe los nombres de los reclutas (por ejemplo «Alex, Marta y Juan») y la hora.
4. Elige el **tono**: Épico, Cutre o Pasivo-agresivo. El épico es el tono predeterminado.
5. Si quieres, marca **📋 Añadir encuesta de asistencia (✅ voy / ❌ no puedo)** para añadir esas respuestas al final del mensaje.
6. Pulsa **📢 GENERAR TRANSMISIÓN** y mira cómo aparece la orden en el terminal.
7. Envíala:
   - **📋 COPIAR** para pegarla donde quieras, o
   - **🟢 COMPARTIR EN WHATSAPP**, que abre WhatsApp con el texto listo: solo eliges el grupo y envías.

¿Quieres otra versión? Vuelve a pulsar el botón: cada transmisión es distinta.

## 🗂️ Historial y repetir la última

El panel **HISTORIAL** conserva las últimas 10 transmisiones durante la visita. Pulsa **VER** para recuperar una o
**REPETIR** para generar otra con el mismo juego, reclutas, hora y tono. También puedes usar **🔁 REPETIR LA ÚLTIMA** bajo
los botones de generación. Por defecto el historial se borra al recargar; marca **Recordar historial en este navegador** si
quieres conservarlo. **VACIAR HISTORIAL** lo elimina cuando quieras.

La primera vez verás una guía de bienvenida con tres pasos. Puedes volver a abrirla cuando quieras con **❓ AYUDA** en la
cabecera. En cada sección encontrarás también un botón **?** con ayuda contextual.

## ⭐ Mis plantillas (sin gastar IA)

¿Tienes un mensaje que te encanta? Guárdalo y reutilízalo cuando quieras, sin gastar llamadas a Gemini:

1. Genera una transmisión (con la IA o en modo demo) y pulsa **⭐ GUARDAR COMO PLANTILLA** debajo del texto.
2. Ponle un nombre (por ejemplo «Viernes de Helldivers»). Con la casilla **Cambiar reclutas, hora y juego por
   variables** marcada, los nombres, la hora y el juego se convierten en huecos que se rellenan solos.
3. Pulsa **💾 GUARDAR**. La plantilla aparece en el panel **MIS PLANTILLAS**.
4. El próximo día cambia los reclutas o la hora y pulsa **▶️ USAR**: la transmisión sale al momento, con encuesta si la
   tienes marcada, y entra en el historial como **PLANTILLA**.

También puedes crear una desde cero con **➕ NUEVA PLANTILLA**, cambiarle el nombre o el texto con **✏️ EDITAR** y
borrarla con **🗑️ BORRAR** (te pide confirmación). Mientras escribes ves una **vista previa** con la misión actual.

| Escribe… | Y se cambia por… |
|---|---|
| `{reclutas}` | los nombres de los reclutas (o «escuadrón» si no hay) |
| `{hora}` | la hora de la partida (o «YA MISMO») |
| `{juego}` | el juego elegido (o «la partida») |
| `{RECLUTAS}`, `{HORA}`, `{JUEGO}` | lo mismo, pero en MAYÚSCULAS |

Las plantillas se guardan **en este navegador** (hasta 30). Para llevarlas a otro móvil u ordenador, o tener una copia,
pulsa **⬇️ EXPORTAR** (descarga un archivo `.json`) y, en el otro dispositivo, **⬆️ IMPORTAR**.

<p align="center">
  <img src="docs/img/captura-plantillas.png" alt="Editor de plantillas: nombre «Viernes de Helldivers», texto con las variables {reclutas} y {hora}, casilla para cambiar los datos por variables y vista previa con Alex, Marta y las 21:30" width="70%">
</p>

## 🔊 Leer en voz alta

Debajo de cada transmisión tienes **🔊 LEER EN VOZ ALTA**: tu navegador la lee con su propia voz (en español si la tiene),
sin coste y sin enviar nada a internet. Mientras lee puedes **⏸️ PAUSAR**, **▶️ REANUDAR** o **⏹️ PARAR**. Los emojis
y los adornos no se leen. Perfecto para ponerla por el altavoz del canal de voz antes de la partida.

<p align="center">
  <img src="docs/img/captura-movil-voz.png" alt="En el móvil: la transmisión con los botones Leer en voz alta y Guardar como plantilla, y el historial con una entrada de plantilla" width="30%">
</p>

## 🔑 Modo demo y tu API key

- **Sin configurar nada** la web funciona en **modo demo**: usa textos de ejemplo escritos a mano, siempre marcados con
  `🧪 [MODO DEMO · texto de ejemplo, no generado por IA]`. También puedes forzarlo con el botón **🧪 MODO DEMO**.
- **Para que escriba la IA** necesitas una clave de Gemini (gratis):
  1. Entra en [Google AI Studio](https://aistudio.google.com/apikey) con tu cuenta de Google y crea una *API key*.
  2. En Squad Summoner pulsa **⚙️ CONFIGURAR API**, pégala y pulsa **PROBAR CLAVE**.
  3. Si la comprobación es correcta, pulsa **GUARDAR**. La casilla **Recordar en este navegador** está desmarcada por
     defecto.
- Sin marcar esa casilla, la clave vive solo en memoria y se olvida al cerrar o recargar la web. Si decides marcarla, lee
  el aviso: todas las webs de `bertmarti.github.io` comparten el almacenamiento del navegador. Puedes revocar la clave en
  [Google AI Studio](https://aistudio.google.com/apikey) y borrarla desde **⚙️ CONFIGURAR API** → **BORRAR CLAVE**.
- La clave se envía directamente a Google; la web publicada no lleva ninguna clave dentro.

## 📲 Envío automático a tu grupo (opcional)

La web pública comparte por WhatsApp, pero eres tú quien pulsa «enviar». Si quieres que el mensaje llegue **solo** a un
grupo concreto, puedes ejecutar la torre de comunicaciones en tu ordenador:

1. Instala [Node.js](https://nodejs.org/) (versión LTS) y descarga el proyecto: en GitHub, botón verde **Code → Download ZIP**
   (y descomprímelo), o `git clone https://github.com/BertMarti/squad-summoner-v3.git`.
2. Abre una terminal en la carpeta del proyecto y ejecuta `npm run setup`. Responde **s** a «¿Quieres configurar el envío
   automático…?»: el asistente comprueba lo que falta, instala lo necesario y prepara la configuración.
3. Ejecuta `npm run server:grupos`. Escanea el QR y elige el grupo; el ID se guardará automáticamente.
4. Para escanearlo: WhatsApp → Ajustes → Dispositivos vinculados → Vincular un dispositivo.
5. Arranca la torre con `npm run server` y déjala abierta. En **otra** terminal ejecuta `npm run dev` y abre
   <http://localhost:5173>: junto a cada transmisión aparecerá **📲 ENVIAR AL GRUPO**.

### ¿Lo usas desde otro equipo de casa?

`npm run setup` crea un **token secreto** en tu archivo `.env` (`SERVER_TOKEN`) sin mostrarlo en pantalla. Si abres la web
con `npm run dev` en el mismo ordenador, la web lo usa sola y no tienes que hacer nada.

Si quieres usar la torre desde otro equipo de casa (por ejemplo, la torre y la web en una Raspberry Pi en `192.168.1.50`):

1. En el `.env` de ese equipo pon `HOST=0.0.0.0` y `ALLOWED_ORIGINS=http://192.168.1.50:4173`. Reinicia la torre con
   `npm run server`. Sin token, la torre **se niega a arrancar** abierta a la red: así nadie más de tu wifi puede mandar
   mensajes a tu grupo.
2. Sirve la web a la red con `npm run build && npm run preview -- --host` (no uses `npm run dev -- --host`: llevaría el
   token dentro y la web se niega a arrancar así).
3. Desde el otro equipo abre <http://192.168.1.50:4173>, entra en **⚙️ CONFIGURAR API** → **Servidor de WhatsApp
   (opcional)** y pega el valor de `SERVER_TOKEN` de tu `.env`. Solo se usa durante esa visita: no se guarda en el
   navegador.

La web publicada en GitHub Pages no muestra esta opción (no puede hablar con tu torre).

La sesión queda en tu ordenador. El botón **🟢 COMPARTIR EN WHATSAPP** sigue funcionando sin instalar el servidor.

## 🧭 Lo que tienes que hacer tú

- Consigue tu clave gratuita en [Google AI Studio](https://aistudio.google.com/apikey) si quieres usar la IA; si no, usa el modo demo.
- Si instalas el servidor en una Raspberry Pi, instala antes Chromium con `sudo apt install chromium`.

**Pendiente del mantenedor (Alberto):** todo lo de la versión 3.4.0 está probado con pruebas automáticas, en modo demo y
en Chromium, pero falta una prueba real de punta a punta:

1. Con una **clave real de Gemini**: ⚙️ CONFIGURAR API → PROBAR CLAVE → GENERAR TRANSMISIÓN con cada tono (Épico, Cutre
   y Pasivo-agresivo) y con la encuesta marcada.
2. Con **WhatsApp real**: `npm run setup`, `npm run server:grupos`, `npm run server` y **📲 ENVIAR AL GRUPO** a un grupo de
   prueba.
3. **Desde otro equipo de casa**, con `HOST=0.0.0.0` y el token pegado en ⚙️, siguiendo «¿Lo usas desde otro equipo de
   casa?». Comprueba también que sin token la torre se niega a arrancar abierta a la red.
4. **🔊 LEER EN VOZ ALTA** en un móvil y en un ordenador con altavoces (en la Raspberry Pi sin voces instaladas la web
   avisa de que no puede leer).

## ❓ Preguntas frecuentes

<details>
<summary><b>¿Es gratis?</b></summary>

Sí. La web es gratuita y de código abierto, y Google ofrece claves de Gemini con un uso gratuito más que suficiente para
convocar a tu escuadrón. En modo demo no necesitas ni eso.
</details>

<details>
<summary><b>¿Se guarda mi historial?</b></summary>

No por defecto: solo vive en memoria y desaparece al recargar. Si marcas **Recordar historial en este navegador**, se guarda
en ese navegador e incluye los nombres de los reclutas. Puedes desmarcarlo o pulsar **VACIAR HISTORIAL**.
</details>

<details>
<summary><b>¿Dónde se guardan mis plantillas? ¿Las pierdo si cambio de móvil?</b></summary>

Se guardan solo en el navegador donde las creas (no hay nube ni cuenta). Si borras los datos del navegador o cambias de
dispositivo, no estarán: usa **⬇️ EXPORTAR** para tener una copia y **⬆️ IMPORTAR** para cargarla en otro sitio. Solo se
importan archivos exportados por Squad Summoner; los textos se muestran siempre como texto. Si tu navegador no deja
guardar (por ejemplo, en modo incógnito estricto), el panel te avisa.
</details>

<details>
<summary><b>Pulso «LEER EN VOZ ALTA» y no suena nada</b></summary>

La voz la pone tu navegador. Sube el volumen y prueba en Chrome, Edge, Safari o Firefox actualizados. Si tu navegador no
tiene voz, el botón aparece desactivado con una explicación; si la tiene pero no hay voces instaladas (pasa en algunos
Linux), la web te avisa a los pocos segundos: instala `speech-dispatcher` o `espeak-ng` y reinicia el navegador.
</details>

<details>
<summary><b>¿Qué es la encuesta de asistencia?</b></summary>

Es un bloque que se añade al final del mensaje para que el grupo responda con **✅ voy** o **❌ no puedo**. No depende de la
IA y respeta el límite de 4000 caracteres.
</details>

<details>
<summary><b>¿Para qué sirve el token?</b></summary>

Protege el servidor de WhatsApp cuando lo abres a otros equipos de tu casa. Se envía de forma segura junto a la petición y no
se incluye en la dirección web. Si usas solo `localhost`, no necesitas configurarlo manualmente.
</details>

<details>
<summary><b>¿Mi API key está segura?</b></summary>

Por defecto vive solo en memoria y se olvida al cerrar o recargar. Si marcas **Recordar en este navegador**, se guarda en el
almacenamiento local: todas las webs de `bertmarti.github.io` comparten ese origen. Solo se envía a Google para generar el
texto. No la guardes en ordenadores compartidos, puedes revocarla en AI Studio y borrarla con **BORRAR CLAVE**.
</details>

<details>
<summary><b>¿Por qué mi mensaje pone «MODO DEMO»?</b></summary>

Porque no hay ninguna clave configurada (o pulsaste el botón de demo). Configura tu API key para que el texto lo escriba
la IA y sea distinto cada vez.
</details>

<details>
<summary><b>¿Puede WhatsApp bloquear mi cuenta?</b></summary>

Compartir con el botón 🟢 es como enviar un mensaje normal. El envío automático usa una librería **no oficial** que
controla WhatsApp Web: úsala con moderación, en tus propios grupos y sin hacer spam.
</details>

<details>
<summary><b>¿Funciona en el móvil?</b></summary>

Sí. La web se adapta a pantallas pequeñas y el botón de compartir abre directamente la app de WhatsApp.
</details>

<details>
<summary><b>Mi juego no está en la lista, ¿qué hago?</b></summary>

Elige **Personalizado** y escribe su nombre: la IA hará de narrador de ese juego.
</details>

<details>
<summary><b>¿Hay modo claro?</b></summary>

Sí, con el botón ☀️ de arriba a la derecha. La web recuerda tu elección.
</details>

## 🛡️ Aviso legal

Este proyecto usa librerías de terceros para la automatización de WhatsApp. Úsalo con responsabilidad y evita el spam.
El Administratum no se hace responsable de bloqueos por parte de Meta.

**SQUAD SUMMONER** no está afiliado con Arrowhead Game Studios, Capcom, Games Workshop, Ghost Ship Games ni Bungie. Los nombres de los juegos
pertenecen a sus dueños; las ilustraciones de la web son propias.

---

<sub>¿Quieres instalarla o colaborar? Mira la [guía de desarrollo](docs/DESARROLLO.md). · Licencia [MIT](LICENSE) © BertMarti</sub>
