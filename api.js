const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRouter = require('./auth');
const pool = require('./connection');

const app = express();
const port = process.env.PORT || 3300;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Ruta base
app.use('/api', authRouter);

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
