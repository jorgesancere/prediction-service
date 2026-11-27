const mongoose = require("mongoose");
const app = require("./src/app");
const predictionService = require("./src/services/prediction.service");

const PORT = 3002;
const MONGO_URI = "mongodb://localhost:27017/prediction-service";

async function iniciar() {
    // Conectar a MongoDB
    await mongoose.connect(MONGO_URI);
    console.log("Conexión a MongoDB establecida");

    // Inicializar modelo ONNX antes de aceptar peticiones
    await predictionService.initModel();

    // Arrancar servidor HTTP
    app.listen(PORT, () => {
        console.log(`Servidor en http://localhost:${PORT}`);
    });
}

iniciar().catch(error => {
    console.error("Error al iniciar el servidor:", error);
    process.exit(1);
});