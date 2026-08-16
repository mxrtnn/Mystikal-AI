const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const Replicate = require('replicate');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Inicializar Replicate con la API Token de tu .env
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

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

// Probar conexión a la Base de Datos
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Error conectando a MySQL:', err.message);
  } else {
    console.log('✅ Conectado exitosamente a la base de datos MySQL (TiDB)');
    connection.release();
  }
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Backend de Mystikal-AI (Replicate Enabled) funcionando correctamente');
});

// Endpoint de Registro
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

// Endpoint de Login
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

// Mapeo de modificadores para cada estilo visual
const STYLE_PROMPTS = {
  'Photoreal': 'photorealistic 8k RAW photo, ultra detailed, cinematic lighting',
  'Anime': 'anime style, masterpiece, vibrant colors, studio quality artwork, detailed lines',
  '3D Render': 'octane render 3d, unreal engine 5, ray tracing lighting, hyper-realistic 3d model',
  'Retro': '90s retro synthwave, neon glow, nostalgic aesthetic, vintage film style',
  'Cyberpunk': 'cyberpunk aesthetic, glowing neon lights, futuristic dark city background, high tech detail',
  'Concept Art': 'digital art concept painting, trending on artstation, sharp focus, atmospheric fantasy illustration'
};

// Endpoint para generar imágenes reales mediante Replicate
app.post('/api/generate', async (req, res) => {
  const { prompt, style, aspectRatio } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'El prompt es obligatorio' });
  }

  // Mapeo de Aspect Ratio para modelos FLUX
  const ratioMap = {
    '1:1': '1:1',
    '16:9': '16:9',
    '9:16': '9:16',
    '4:3': '4:3'
  };

  const selectedRatio = ratioMap[aspectRatio] || '16:9';
  const styleModifier = STYLE_PROMPTS[style] || STYLE_PROMPTS['Photoreal'];
  const fullPrompt = `${prompt}, ${styleModifier}`;

  try {
    console.log(`🎨 Generando imagen en Replicate... Estilo: ${style} | Ratio: ${selectedRatio}`);

    // Ejecución con el modelo FLUX Schnell (Ultra rápido y gratuito/barato)
    const output = await replicate.run(
      "black-forest-labs/flux-schnell",
      {
        input: {
          prompt: fullPrompt,
          aspect_ratio: selectedRatio,
          output_format: "webp",
          output_quality: 90
        }
      }
    );

    // Replicate devuelve los resultados (file object o array con URL)
    let imageUrl = '';
    if (Array.isArray(output)) {
      imageUrl = output[0]?.url ? output[0].url() : String(output[0]);
    } else if (output && typeof output.url === 'function') {
      imageUrl = output.url();
    } else {
      imageUrl = String(output);
    }

    console.log('✨ Imagen creada con éxito:', imageUrl);
    res.json({ imageUrl });

  } catch (error) {
    console.error('❌ Error llamando a Replicate:', error);
    res.status(500).json({ error: 'Error al generar la imagen con IA' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});