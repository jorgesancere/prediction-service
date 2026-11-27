const mongoose = require("mongoose");

const PredictionSchema = new mongoose.Schema({
    dataId: { type: String, default: null },
    features: { type: [Number], required: true },
    prediction: { type: Number, required: true },
    featureCount: { type: Number, required: true },
    source: { type: String, default: null },
    correlationId: { type: String, default: null },
    latencyMs: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Prediction", PredictionSchema);