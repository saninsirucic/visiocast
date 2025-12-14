const mongoose = require("mongoose");

const poslovnicaSchema = new mongoose.Schema(
  {
    komitentId: { type: mongoose.Schema.Types.ObjectId, ref: "Komitent", required: true },
    naziv: { type: String, required: true, trim: true },
    grad: { type: String, default: "", trim: true },
    adresa: { type: String, default: "", trim: true },
    status: { type: String, default: "offline" },
    aktivnaReklamaId: { type: String, default: null }, // za sad ostavi string kao prije
  },
  { timestamps: true }
);

module.exports = mongoose.model("Poslovnica", poslovnicaSchema);
