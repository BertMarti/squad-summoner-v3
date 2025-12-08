require('dotenv').config({ path: '../.env' }); // Lee el .env de la raíz
const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Recuperamos variables del entorno
const PORT = process.env.PORT || 3000;
const GROUP_ID = process.env.WHATSAPP_GROUP_ID;

if (!GROUP_ID) {
    console.error("❌ ERROR: No se ha definido WHATSAPP_GROUP_ID en el archivo .env");
    process.exit(1);
}

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true, args: ['--no-sandbox'] }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('📲 ESCANEA EL QR PARA VINCULAR WHATSAPP');
});

client.on('ready', () => {
    console.log('✅ Cliente WhatsApp LISTO y conectado.');
});

client.initialize();

app.post('/send-mission', async (req, res) => {
    const { message } = req.body;
    
    if (!client.info) return res.status(503).json({ error: 'WhatsApp no inicializado' });

    try {
        await client.sendMessage(GROUP_ID, message);
        console.log('Mensaje enviado correctamente.');
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al enviar mensaje' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});