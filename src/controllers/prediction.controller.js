const crypto = require("crypto");
const predictionService = require("../services/prediction.service");

// Comprobar que el servicio está en funcionamiento
function getHealth(req, res) {
    res.status(200).json({
        status: "ok",
        service: "prediction-service"
    });
}

// Comprobar que el modelo ONNX está cargado y listo
function getReady(req, res) {
    if (predictionService.isReady()) {
        return res.status(200).json({
            ready: true,
            modelVersion: "v1.0"
        });
    }

    return res.status(503).json({
        ready: false,
        modelVersion: "v1.0",
        message: "Model is not ready"
    });
}

// Consultar características
function getFeatures(req, res) {
    res.status(200).json({
        features: predictionService.getFeatures()
    });
}

// Procesar petición de predicción
async function predict(req, res) {
    try {
        const { features } = req.body || {};

        const { prediction, latencyMs } =
            await predictionService.predict(features);

        // Provisional hasta conectar MongoDB (donde se usará el _id generado)
        const predictionId = crypto.randomBytes(12).toString("hex");

        res.status(201).json({
            predictionId,
            prediction,
            timestamp: new Date().toISOString(),
            latencyMs
        });

    } catch (error) {
        console.error(error);

        if (error.status === 503) {
            return res.status(503).json({
                ready: false,
                modelVersion: "v1.0",
                message: "Model is not ready"
            });
        }

        res.status(error.status || 500).json({
            error: error.status === 400
                ? error.message
                : "Error al ejecutar la predicción"
        });
    }
}

module.exports = {
    getHealth,
    getReady,
    getFeatures,
    predict
};