const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const Replicate = require('replicate');
require('dotenv').config();

console.log(
  '🔐 REPLICATE_API_TOKEN presente:',
  !!process.env.REPLICATE_API_TOKEN
);

const app = express();

app.use(cors());
app.use(express.json());

// =====================================================
// REPLICATE
// =====================================================

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// =====================================================
// BASE DE DATOS - TiDB CLOUD
// =====================================================

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

// Verificación de conexión
db.getConnection((err, connection) => {
  if (err) {
    console.error(
      '❌ Error conectando a MySQL:',
      err.message
    );
  } else {
    console.log(
      '✅ Conectado exitosamente a la base de datos MySQL (TiDB)'
    );
    connection.release();
  }
});

// =====================================================
// RUTA PRINCIPAL
// =====================================================

app.get('/', (req, res) => {
  res.send('Backend de Mystikal-AI funcionando correctamente');
});

// =====================================================
// REGISTRO
// =====================================================

app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      error: 'Todos los campos son obligatorios'
    });
  }

  const query =
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';

  db.query(
    query,
    [name, email, password],
    (err, result) => {
      if (err) {
        console.error(
          '❌ Error al guardar usuario:',
          err
        );

        return res.status(500).json({
          error: 'Error al registrar en la base de datos'
        });
      }

      console.log(
        '👤 Usuario guardado con ID:',
        result.insertId
      );

      res.status(201).json({
        message: 'Usuario registrado con éxito',
        id: result.insertId
      });
    }
  );
});

// =====================================================
// LOGIN
// =====================================================

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'Email y contraseña son obligatorios'
    });
  }

  const query =
    'SELECT * FROM users WHERE email = ?';

  db.query(
    query,
    [email],
    (err, results) => {
      if (err) {
        console.error(
          '❌ Error al buscar usuario:',
          err
        );

        return res.status(500).json({
          error:
            'Error en el servidor al consultar credenciales'
        });
      }

      if (
        results.length === 0 ||
        results[0].password !== password
      ) {
        return res.status(401).json({
          error: 'Usuario o contraseña incorrectos'
        });
      }

      const user = results[0];

      res.status(200).json({
        message: 'Inicio de sesión exitoso',

        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      });
    }
  );
});

// =====================================================
// ESTILOS
// =====================================================

const STYLE_PROMPTS = {
  'Photoreal':
    'photorealistic 8k RAW photo, ultra detailed, cinematic lighting',

  'Anime':
    'pixai style anime portrait, masterpiece, gacha game illustration, vibrant colors, detailed lineart',

  '3D Render':
    'octane render 3d, unreal engine 5, ray tracing lighting, hyper-realistic 3d model',

  'Retro':
    '90s retro synthwave, neon glow, nostalgic aesthetic, vintage film style',

  'Cyberpunk':
    'cyberpunk aesthetic, glowing neon lights, futuristic dark city background, high tech detail',

  'Concept Art':
    'digital art concept painting, sharp focus, atmospheric fantasy illustration'
};

// =====================================================
// GENERACIÓN DE IMÁGENES - FLUX 1.1 PRO
// =====================================================

app.post('/api/generate', async (req, res) => {

  const {
    prompt,
    style,
    aspectRatio,
    width,
    height
  } = req.body;

  // ---------------------------------------------------
  // Validación del prompt
  // ---------------------------------------------------

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({
      error: 'El prompt es obligatorio'
    });
  }

  // ---------------------------------------------------
  // Ratios permitidos
  // ---------------------------------------------------

  const ratioMap = {
    '1:1': '1:1',
    '16:9': '16:9',
    '9:16': '9:16',
    '4:3': '4:3',
    'custom': 'custom'
  };

  const selectedRatio =
    ratioMap[aspectRatio] || '16:9';

  // ---------------------------------------------------
  // Estilo
  // ---------------------------------------------------

  const styleModifier =
    STYLE_PROMPTS[style] ||
    STYLE_PROMPTS['Photoreal'];

  const fullPrompt =
    `${prompt.trim()}, ${styleModifier}`;

  try {

    console.log(
      `🎨 Generando con FLUX 1.1 Pro`
    );

    console.log(
      `📝 Prompt: ${fullPrompt}`
    );

    console.log(
      `📐 Ratio: ${selectedRatio}`
    );

    // -------------------------------------------------
    // INPUT BASE PARA FLUX
    // -------------------------------------------------

    const input = {
      prompt: fullPrompt,
      aspect_ratio: selectedRatio,
      output_format: 'webp',
      output_quality: 80,

      // Mantiene los controles de seguridad
      safety_tolerance: 2,

      // Permite que FLUX optimice el prompt
      prompt_upsampling: true
    };

    // -------------------------------------------------
    // CUSTOM WIDTH / HEIGHT
    // -------------------------------------------------

    if (selectedRatio === 'custom') {

      const customWidth = Number(width);
      const customHeight = Number(height);

      // Comprobar que sean números
      if (
        !Number.isInteger(customWidth) ||
        !Number.isInteger(customHeight)
      ) {
        return res.status(400).json({
          error:
            'El ancho y el alto deben ser números enteros.'
        });
      }

      // Límites de FLUX
      if (
        customWidth < 256 ||
        customWidth > 1440 ||
        customHeight < 256 ||
        customHeight > 1440
      ) {
        return res.status(400).json({
          error:
            'Las dimensiones deben estar entre 256 y 1440 píxeles.'
        });
      }

      // Múltiplos de 32
      if (
        customWidth % 32 !== 0 ||
        customHeight % 32 !== 0
      ) {
        return res.status(400).json({
          error:
            'El ancho y el alto deben ser múltiplos de 32. Ejemplo: 1024 x 1536.'
        });
      }

      input.width = customWidth;
      input.height = customHeight;

      console.log(
        `📏 Dimensiones personalizadas: ${customWidth}x${customHeight}`
      );
    }

    // -------------------------------------------------
    // LLAMADA A FLUX 1.1 PRO
    // -------------------------------------------------

    console.log(
      '📤 Enviando solicitud a Replicate...'
    );

    const output = await replicate.run(
      'black-forest-labs/flux-1.1-pro',
      {
        input
      }
    );

    console.log(
      '📌 Salida recibida de Replicate:',
      output
    );

    // -------------------------------------------------
    // OBTENER URL DE LA IMAGEN
    // -------------------------------------------------

    let imageUrl = '';

    if (output) {

      if (typeof output.url === 'function') {

        imageUrl =
          output.url().toString();

      } else if (output.url) {

        imageUrl =
          String(output.url);

      } else {

        imageUrl =
          String(output);
      }
    }

    // -------------------------------------------------
    // Comprobar que recibimos imagen
    // -------------------------------------------------

    if (!imageUrl) {
      throw new Error(
        'Replicate no devolvió una URL de imagen.'
      );
    }

    console.log(
      '✨ Imagen creada exitosamente:',
      imageUrl
    );

    // -------------------------------------------------
    // RESPUESTA AL FRONTEND
    // -------------------------------------------------

    res.json({
      imageUrl
    });

  } catch (error) {

    console.error(
      '❌ Error en Replicate:',
      error.message || error
    );

    res.status(500).json({
      error:
        'Error al generar la imagen con IA',

      details:
        error.message || String(error)
    });
  }
});

// =====================================================
// SERVIDOR
// =====================================================

const PORT =
  process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(
    `🚀 Servidor de Mystikal-AI corriendo en el puerto ${PORT}`
  );
});