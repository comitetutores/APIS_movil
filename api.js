const express = require('express');
const authRouter = require('./auth');

const app = express();

// Usar JSON en el cuerpo de las solicitudes
app.use(express.json());

// Usar el router para rutas de autenticación
app.use('/api', authRouter);

app.listen(3300, () => {
    console.log("Server is now listening on port 3300");
});
