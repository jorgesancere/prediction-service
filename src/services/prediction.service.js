const ort = require("onnxruntime-node");
const path = require("path");
const fs = require("fs");
const Prediction = require("../models/prediction.model");

// Rutas de los archivos del modelo
const modelPath = path.join(
    __dirname, "../../modelo/modelo.onnx"
);

const normPath = path.join(
    __dirname, "../../modelo/normalizacion.json"
);

// Cargar parámetros de normalización
const norm = JSON.parse(
    fs.readFileSync(normPath, "utf8")
);

let session = null;

// Inicializar el modelo
async function initModel() {
    session = await ort.InferenceSession.create(modelPath);
    console.log("Modelo ONNX cargado correctamente");
}

// Comprobar si el modelo está cargado en memoria
function isReady() {
    return session !== null;
}

// Obtener nombres de las características
function getFeatures() {
    return norm.features;
}

// Realizar predicción y guardarla en MongoDB
async function predict(features, meta = {}) {
    // Comprobar disponibilidad del modelo
    if (!isReady()) {
        const error = new Error("Model is not ready");
        error.status = 503;
        throw error;
    }

    // Validar entrada
    if (
        !Array.isArray(features) ||
        features.length !== norm.mean.length ||
        !features.every(v =>
            typeof v === "number" && Number.isFinite(v)
        )
    ) {
        const error = new Error(
            `Se esperan ${norm.mean.length} valores numéricos`
        );
        error.status = 400;
        throw error;
    }

    // Iniciar medición del tiempo
    const inicio = performance.now();

    // Normalizar las entradas
    const datos = features.map((valor, i) =>
        (valor - norm.mean[i]) / norm.scale[i]
    );

    // Construir tensor de entrada
    const tensor = new ort.Tensor(
        "float32",
        Float32Array.from(datos),
        [1, datos.length]
    );

    // Ejecutar inferencia
    const resultado = await session.run({
        [session.inputNames[0]]: tensor
    });

    // Calcular latencia
    const latencyMs = Number(
        (performance.now() - inicio).toFixed(2)
    );

    const prediction = Number(resultado[session.outputNames[0]].data[0]);

    // Guardar en MongoDB
    const registro = new Prediction({
        dataId: meta.dataId || null,
        features,
        prediction,
        featureCount: features.length,
        source: meta.source || null,
        correlationId: meta.correlationId || null,
        latencyMs
    });

    const guardado = await registro.save();

    return {
        predictionId: guardado._id.toString(),
        prediction: guardado.prediction,
        timestamp: guardado.timestamp.toISOString(),
        latencyMs: guardado.latencyMs
    };
}

module.exports = {
    initModel,
    isReady,
    getFeatures,
    predict
};