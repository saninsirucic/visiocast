// server.js

const path = require("path");

// ⬇️ UČITAVA backend/.env (POUZDANO)
require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

const express = require("express");
const cors = require("cors");

const connectDB = require("./db");
const authRoutes = require("./routes/auth");

// ⬇️ AUTH MIDDLEWARE
const { auth, requireRole } = require("./middleware/auth");

// ⬇️ MONGO MODEL (KOMITENTI)
const Komitent = require("./models/Komitent");

const app = express();
const PORT = process.env.PORT || 5000;

// ------------------------
// MIDDLEWARE
// ------------------------
app.use(cors());
app.use(express.json());

// ------------------------
// AUTH ROUTES (OTVORENO)
// ------------------------
app.use("/api/auth", authRoutes);

// ------------------------
// ADMIN GUARD
// - /api/auth/*   -> slobodno
// - /api/player/* -> slobodno (ekrani)
// - sve ostalo /api/* -> token + admin
// ------------------------
function adminOnly(req, res, next) {
  // auth endpointi slobodni
  if (req.path.startsWith("/api/auth")) return next();

  // player endpointi slobodni (ekrani)
  if (req.path.startsWith("/api/player")) return next();

  // štiti samo /api/*
  if (req.path.startsWith("/api/")) {
    return auth(req, res, () => requireRole("admin")(req, res, next));
  }

  return next();
}

app.use(adminOnly);

// ------------------------
// SERVIRAJ STATIC (RENDER/PROD SAFE)
// ------------------------
// 1) Public root (ako imaš neke fajlove direktno u public)
app.use(express.static(path.join(__dirname, "public")));

// 2) Admin HTML: /admin/...
app.use("/admin", express.static(path.join(__dirname, "public", "admin")));

// 3) Media fajlovi: /media/...
//    ✅ OČEKUJE: backend/public/media  (ne admin/media)
app.use("/media", express.static(path.join(__dirname, "public", "media")));

// --------------------------------------------------
// POMOĆNA FUNKCIJA: normalizacija URL-a za fajl
// --------------------------------------------------
function normalizeMediaUrl(fajlUrl) {
  if (!fajlUrl) return fajlUrl;

  const str = String(fajlUrl).trim();
  if (str.startsWith("http://") || str.startsWith("https://")) return str;
  if (str.startsWith("/media/")) return str;

  return "/media/" + str.replace(/^\/+/, "");
}

// ------------------------
// DEMO PODACI (NETAKNUTO za ostalo)
// ------------------------

// ✅ KOMITENTI (demo samo za seed u Mongo)
const demoKomitenti = [
  {
    naziv: "NIS Gazprom",
    grad: "Beograd",
    kontakt: "Marko Petrović",
    telefon: "+381 11 123 456",
    napomena: "Demo komitent – ima više pumpi u BiH.",
  },
  {
    naziv: "Shell BiH (demo)",
    grad: "Sarajevo",
    kontakt: "Demo Kontakt",
    telefon: "+387 33 000 000",
    napomena: "Za testiranje drugih klijenata.",
  },
];

// POSLOVNICE (ostaje array kao i prije)
let poslovnice = [
  {
    id: "bp-doboj-jug",
    komitentId: "k1",
    naziv: "Gazprom Doboj Jug",
    grad: "Doboj Jug",
    adresa: "Doboj Jug",
    status: "online",
    aktivnaReklamaId: "r1",
  },
  {
    id: "bp-ilidza",
    komitentId: "k1",
    naziv: "Gazprom Ilidža",
    grad: "Sarajevo",
    adresa: "Ilidža, Sarajevo",
    status: "online",
    aktivnaReklamaId: "r2",
  },
  {
    id: "bp-lukavica",
    komitentId: "k1",
    naziv: "Gazprom Lukavica",
    grad: "Istočno Sarajevo",
    adresa: "Lukavica",
    status: "online",
    aktivnaReklamaId: "r2",
  },
  {
    id: "bp-grbavica",
    komitentId: "k1",
    naziv: "Gazprom Grbavica",
    grad: "Sarajevo",
    adresa: "Grbavica",
    status: "offline",
    aktivnaReklamaId: "r1",
  },
  {
    id: "bp-stup",
    komitentId: "k1",
    naziv: "Gazprom Stup",
    grad: "Sarajevo",
    adresa: "Stup",
    status: "offline",
    aktivnaReklamaId: "r3",
  },
];

// EKRANI (ostaje array)
let ekrani = [
  {
    id: "scr-doboj-1",
    naziv: "Doboj Jug – Ekran 1",
    poslovnicaId: "bp-doboj-jug",
    lokacijaOpis: "Ulazni ekran",
    status: "online",
    aktivnaReklamaId: null,
    tip: "Ulaz",
    napomena: "",
  },
  {
    id: "scr-grbavica-1",
    naziv: "Grbavica – Ekran 1",
    poslovnicaId: "bp-grbavica",
    lokacijaOpis: "Unutrašnji ekran",
    status: "offline",
    aktivnaReklamaId: null,
    tip: "Unutra",
    napomena: "",
  },
  {
    id: "scr-ilidza-1",
    naziv: "Ilidža – Ekran 1",
    poslovnicaId: "bp-ilidza",
    lokacijaOpis: "Ulazni ekran",
    status: "online",
    aktivnaReklamaId: null,
    tip: "Ulaz",
    napomena: "",
  },
  {
    id: "scr-ilidza-2",
    naziv: "Ilidža – Ekran 2 (unutra)",
    poslovnicaId: "bp-ilidza",
    lokacijaOpis: "Unutrašnji ekran",
    status: "online",
    aktivnaReklamaId: null,
    tip: "Unutra",
    napomena: "",
  },
];

// REKLAME (ostaje array)
let reklame = [
  {
    id: "r1",
    naziv: "Sanin test",
    tip: "video",
    trajanjeSekundi: 15,
    datumOd: "2025-12-01",
    datumDo: "2025-12-31",
    fajlUrl: "sanin-test.mp4",
    poslovniceIds: ["bp-ilidza", "bp-lukavica"],
    pauzirana: false,
    status: "aktivna",
  },
];

function findReklama(id) {
  return reklame.find((r) => r.id === id);
}

// ------------------------
// KOMITENTI: helperi + seed + CRUD (MONGO)
// ------------------------
function mapKomitent(doc) {
  return {
    id: doc._id.toString(),
    naziv: doc.naziv,
    grad: doc.grad || "",
    adresa: doc.adresa || "",
    kontakt: doc.kontakt || "",
    telefon: doc.telefon || "",
    napomena: doc.napomena || "",
  };
}

async function ensureKomitentiSeeded() {
  const count = await Komitent.countDocuments();
  if (count === 0) {
    await Komitent.insertMany(demoKomitenti);
    console.log("✅ Seed: komitenti ubačeni u Mongo (prvi put)");
  }
}

// ------------------------
// API – KOMITENTI (MONGO)
// ------------------------
app.get("/api/komitenti", async (req, res) => {
  try {
    const docs = await Komitent.find().sort({ createdAt: -1 });
    res.json(docs.map(mapKomitent));
  } catch (err) {
    res.status(500).json({ message: "Greška pri čitanju komitenata" });
  }
});

app.post("/api/komitenti", async (req, res) => {
  try {
    const body = req.body || {};

    if (!body.naziv || !String(body.naziv).trim()) {
      return res.status(400).json({ message: "Naziv komitenta je obavezan." });
    }

    const doc = await Komitent.create({
      naziv: String(body.naziv).trim(),
      grad: String(body.grad || "").trim(),
      adresa: String(body.adresa || "").trim(),
      kontakt: String(body.kontakt || "").trim(),
      telefon: String(body.telefon || "").trim(),
      napomena: String(body.napomena || "").trim(),
    });

    res.status(201).json(mapKomitent(doc));
  } catch (err) {
    res.status(500).json({ message: "Greška pri dodavanju komitenta" });
  }
});

app.put("/api/komitenti/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    const naziv = String(body.naziv || "").trim();
    if (!naziv) {
      return res.status(400).json({ message: "Naziv komitenta je obavezan." });
    }

    const updated = await Komitent.findByIdAndUpdate(
      id,
      {
        naziv,
        grad: String(body.grad || "").trim(),
        adresa: String(body.adresa || "").trim(),
        kontakt: String(body.kontakt || "").trim(),
        telefon: String(body.telefon || "").trim(),
        napomena: String(body.napomena || "").trim(),
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Komitent nije pronađen" });
    }

    res.json(mapKomitent(updated));
  } catch (err) {
    res.status(500).json({ message: "Greška pri izmjeni komitenta" });
  }
});

app.delete("/api/komitenti/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Komitent.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Komitent nije pronađen" });
    }

    // ⚠️ Za sada: kaskadno brišemo samo iz ARRAY dijela (poslovnice/ekrani su još demo)
    const posIds = poslovnice
      .filter((p) => p.komitentId === id)
      .map((p) => p.id);

    poslovnice = poslovnice.filter((p) => p.komitentId !== id);
    ekrani = ekrani.filter((e) => !posIds.includes(e.poslovnicaId));

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Greška pri brisanju komitenta" });
  }
});

/* =========================================================
   ⬇️ SVE TVOJE POSTOJEĆE API RUTE OSTAJU ISPOD
   (poslovnice, ekrani, reklame, player…)
   ========================================================= */

// ------------------------
// API – POSLOVNICE (DEMO ARRAY)
// ------------------------
app.get("/api/poslovnice", (req, res) => {
  const { komitentId } = req.query;
  if (komitentId) {
    return res.json(
      poslovnice.filter((p) => String(p.komitentId) === String(komitentId))
    );
  }
  res.json(poslovnice);
});

app.get("/api/poslovnice/:id", (req, res) => {
  const item = poslovnice.find((p) => p.id === req.params.id);
  if (!item) return res.status(404).json({ message: "Poslovnica nije pronađena" });
  res.json(item);
});

app.post("/api/poslovnice", (req, res) => {
  const body = req.body || {};
  if (!body.naziv) return res.status(400).json({ message: "Naziv je obavezan" });

  const id = body.id || `bp-${Date.now()}`;
  const newItem = {
    id,
    komitentId: body.komitentId || "",
    naziv: body.naziv,
    grad: body.grad || "",
    adresa: body.adresa || "",
    status: body.status || "offline",
    aktivnaReklamaId: body.aktivnaReklamaId || null,
  };

  poslovnice.unshift(newItem);
  res.status(201).json(newItem);
});

app.put("/api/poslovnice/:id", (req, res) => {
  const idx = poslovnice.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Poslovnica nije pronađena" });

  poslovnice[idx] = { ...poslovnice[idx], ...(req.body || {}) };
  res.json(poslovnice[idx]);
});

app.delete("/api/poslovnice/:id", (req, res) => {
  const id = req.params.id;
  ekrani = ekrani.filter((e) => e.poslovnicaId !== id);
  poslovnice = poslovnice.filter((p) => p.id !== id);
  res.json({ success: true });
});

// ------------------------
// API – EKRANI (DEMO ARRAY)
// ------------------------
app.get("/api/ekrani", (req, res) => {
  const { poslovnicaId } = req.query;
  if (poslovnicaId) {
    return res.json(ekrani.filter((e) => e.poslovnicaId === poslovnicaId));
  }
  res.json(ekrani);
});

app.get("/api/ekrani/:id", (req, res) => {
  const item = ekrani.find((e) => e.id === req.params.id);
  if (!item) return res.status(404).json({ message: "Ekran nije pronađen" });
  res.json(item);
});

// ------------------------
// API – REKLAME (DEMO ARRAY)
// ------------------------
app.get("/api/reklame", (req, res) => {
  res.json(reklame.map((r) => ({ ...r, fajlUrl: normalizeMediaUrl(r.fajlUrl) })));
});

app.get("/api/reklame/:id", (req, res) => {
  const item = reklame.find((r) => r.id === req.params.id);
  if (!item) return res.status(404).json({ message: "Reklama nije pronađena" });
  res.json({ ...item, fajlUrl: normalizeMediaUrl(item.fajlUrl) });
});

// ------------------------
// API – PLAYER (OTVORENO, za displeje)
// ------------------------
app.get("/api/player", (req, res) => {
  const { poslovnicaId } = req.query;

  let lista = reklame;

  if (poslovnicaId) {
    lista = reklame.filter(
      (r) =>
        Array.isArray(r.poslovniceIds) &&
        r.poslovniceIds.includes(poslovnicaId)
    );
  }

  lista = lista
    .filter((r) => !r.pauzirana && r.status === "aktivna")
    .map((r) => ({ ...r, fajlUrl: normalizeMediaUrl(r.fajlUrl) }));

  res.json({ ok: true, poslovnicaId: poslovnicaId || null, reklame: lista });
});

// ------------------------
// START SERVER (SIGURNO) - RENDER READY
// ------------------------
(async () => {
  try {
    await connectDB();
    await ensureKomitentiSeeded();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`VisioCast backend radi na portu ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Server nije startao:", err?.message || err);
    process.exit(1);
  }
})();
