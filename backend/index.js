const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Pool de conexiones a TiDB Cloud
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: false
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Probar conexión al arrancar
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Error conectando a MySQL:', err.message);
  } else {
    console.log('✅ Conectado exitosamente a la base de datos MySQL (TiDB)');
    connection.release();
  }
});

app.get('/', (req, res) => {
  res.send('Backend de Mystikal-AI funcionando correctamente');
});

// Endpoint Registro
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';

  db.query(query, [name, email, password], (err, result) => {
    if (err) {
      console.error('❌ Error al guardar usuario:', err);
      return res.status(500).json({ error: 'Error al registrar en la base de datos' });
    }
    console.log('👤 Usuario guardado con ID:', result.insertId);
    res.status(201).json({ message: 'Usuario registrado con éxito', id: result.insertId });
  });
});

// Endpoint Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  const query = 'SELECT * FROM users WHERE email = ?';

  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('❌ Error al buscar usuario:', err);
      return res.status(500).json({ error: 'Error en el servidor al consultar credenciales' });
    }

    if (results.length === 0 || results[0].password !== password) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const user = results[0];
    res.status(200).json({
      message: 'Inicio de sesión exitoso',
      user: { id: user.id, name: user.name, email: user.email }
    });
  });
});

// Endpoint Generación de Imágenes (Stable Diffusion + LoRA Style Modifiers)
app.post('/api/generate', async (req, res) => {
  const { prompt, style, aspectRatio } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'El prompt es requerido' });
  }

  // Mapeo de Aspect Ratios a dimensiones
  const dimensions = {
    '1:1': { width: 1024, height: 1024 },
    '16:9': { width: 1280, height: 720 },
    '9:16': { width: 720, height: 1280 },
    '4:3': { width: 1024, height: 768 },
  };

  const { width, height } = dimensions[aspectRatio] || dimensions['1:1'];

  // Modificadores de estilo tipo LoRA / PixAI
  const stylePrompts = {
    'Photoreal': 'photorealistic, 8k resolution, highly detailed, RAW photo, masterpiece',
    'Anime': 'pixai style, anime masterpiece, dynamic pose, vibrant colors, studio quality, detailed lines',
    '3D Render': 'octane render, 3d render, unreal engine 5, ray tracing, cinematic lighting',
    'Retro': '90s retro style, synthwave, vintage aesthetic, grainy texture, nostalgic',
    'Cyberpunk': 'cyberpunk style, neon lights, futuristic city, high tech, dramatic backlight',
    'Concept Art': 'digital painting, concept art, trend on artstation, fantasy environment, sharp focus'
  };

  const extraStyle = stylePrompts[style] || stylePrompts['Photoreal'];
  const fullPrompt = `${prompt}, ${extraStyle}`;

  try {
    // Generación dinámica mediante servidor Stable Diffusion
    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(fullPrompt)}?width=${width}&height=${height}&seed=${seed}&model=flux`;

    res.json({ imageUrl });
  } catch (error) {
    console.error('❌ Error generando la imagen:', error);
    res.status(500).json({ error: 'Error interno al procesar la imagen' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});