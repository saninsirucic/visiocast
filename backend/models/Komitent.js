const mongoose = require("mongoose");

const komitentSchema = new mongoose.Schema(
  {
    naziv: { type: String, required: true, trim: true },
    grad: { type: String, default: "", trim: true },
    adresa: { type: String, default: "", trim: true },
    kontakt: { type: String, default: "", trim: true },
    telefon: { type: String, default: "", trim: true },
    napomena: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Komitent", komitentSchema);
