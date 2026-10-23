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
| 🖊️ **Personalizado** | Escribes el nombre de tu juego y la IA se mete en su papel. |

## 📸 Así se ve

<p align="center">
  <img src="docs/img/captura-escritorio.png" alt="Squad Summoner en el ordenador: selector de juegos, reclutas, hora y una transmisión de Space Marine 2 en el terminal" width="72%">
  &nbsp;
  <img src="docs/img/captura-movil.png" alt="Squad Summoner en el móvil: la transmisión generada con los botones Copiar y Compartir en WhatsApp" width="22%">
</p>

## 🕹️ Cómo se usa, paso a paso

1. **Abre la web**: <https://bertmarti.github.io/squad-summoner-v3/> (funciona en el ordenador y en el móvil).
2. **01 · Selecciona el teatro**: toca la tarjeta de tu juego.
3. **02 · Parámetros**: escribe los nombres de los reclutas (por ejemplo «Alex, Marta y Juan») y la hora.
4. Pulsa **📢 GENERAR TRANSMISIÓN** y mira cómo aparece la orden en el terminal.
5. Envíala:
   - **📋 Copiar** para pegarla donde quieras, o
   - **🟢 Compartir en WhatsApp**, que abre WhatsApp con el texto listo: solo eliges el grupo y envías.

¿Quieres otra versión? Vuelve a pulsar el botón: cada transmisión es distinta.

## 🔑 Modo demo y tu API key

- **Sin configurar nada** la web funciona en **modo demo**: usa textos de ejemplo escritos a mano, siempre marcados con
  `🧪 [MODO DEMO · texto de ejemplo, no generado por IA]`. También puedes forzarlo con el botón **🧪 MODO DEMO**.
- **Para que escriba la IA** necesitas una clave de Gemini (gratis):
  1. Entra en [Google AI Studio](https://aistudio.google.com/apikey) con tu cuenta de Google y crea una *API key*.
  2. En Squad Summoner pulsa **⚙️ CONFIGURAR API**, pégala y pulsa **GUARDAR**.
- Tu clave **solo se guarda en tu navegador** y solo se envía a Google. La web publicada no lleva ninguna clave dentro.
  Si quieres quitarla, abre la misma ventana y pulsa **BORRAR CLAVE**.

## 📲 Envío automático a tu grupo (opcional)

La web pública comparte por WhatsApp, pero eres tú quien pulsa «enviar». Si quieres que el mensaje llegue **solo** a un
grupo concreto, Squad Summoner incluye una pequeña «torre de comunicaciones» que se ejecuta **en tu ordenador**:
la arrancas, escaneas un código QR con WhatsApp (como en WhatsApp Web) y aparece el botón **📲 ENVIAR AL GRUPO**.

Necesita algo de instalación; los pasos están en la [guía de desarrollo](docs/DESARROLLO.md#servidor-de-whatsapp).

## ❓ Preguntas frecuentes

<details>
<summary><b>¿Es gratis?</b></summary>

Sí. La web es gratuita y de código abierto, y Google ofrece claves de Gemini con un uso gratuito más que suficiente para
convocar a tu escuadrón. En modo demo no necesitas ni eso.
</details>

<details>
<summary><b>¿Mi API key está segura?</b></summary>

Se guarda solo en el almacenamiento local de tu navegador y viaja únicamente a los servidores de Google para generar el
texto. Nadie más la ve. Aun así, no la uses en ordenadores compartidos y bórrala con **BORRAR CLAVE** si hace falta.
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

**SQUAD SUMMONER** no está afiliado con Arrowhead Game Studios, Capcom ni Games Workshop. Los nombres de los juegos
pertenecen a sus dueños; las ilustraciones de la web son propias.

---

<sub>¿Quieres instalarla o colaborar? Mira la [guía de desarrollo](docs/DESARROLLO.md). · Licencia [MIT](LICENSE) © BertMarti</sub>
