// server.js
const path = require("path");
const fs = require("fs");
const multer = require("multer");

// ✅ .env učitavaš SAMO lokalno (Render koristi Environment Variables)
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const cors = require("cors");

// ✅ JWT (za admin login)
const jwt = require("jsonwebtoken");

// ✅ Admin kredencijali (Render: Environment Variables)
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "ADMIN_LOZINKA";

// ✅ JWT secret (Render: obavezno postavi JWT_SECRET)
const JWT_SECRET = process.env.JWT_SECRET || "DEV_ONLY_CHANGE_ME";

// ⬇️ osiguraj da middleware/auth vidi isti secret
process.env.JWT_SECRET = process.env.JWT_SECRET || JWT_SECRET;

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



// =========================
// UPLOAD u /public/media (lokalno)
// =========================
const mediaDir = path.join(__dirname, "public", "media");
if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, mediaDir),
  filename: (req, file, cb) => {
    const safeBase = (path.parse(file.originalname).name || "upload")
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    const ext = (path.extname(file.originalname) || "").toLowerCase();
    const stamp = Date.now();
    cb(null, `${safeBase || "upload"}-${stamp}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 300 * 1024 * 1024 }, // 300MB
});

// ------------------------
// AUTH ROUTES (OTVORENO)
// ------------------------
app.use("/api/auth", authRoutes);

// ------------------------
// ✅ LOGIN (OTVORENO) - vraća JWT token za admin panel
// POST /api/auth/login  { username, password }
// ------------------------

// Upload endpoint (vrati URL koji se može spremiti u reklamu)
app.post("/api/upload", auth, upload.single("file"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, error: "Nema fajla" });
    const url = `/media/${req.file.filename}`;
    return res.json({ ok: true, url, filename: req.file.filename });
  } catch (e) {
    console.error("UPLOAD ERROR:", e);
    return res.status(500).json({ ok: false, error: "Upload failed" });
  }
});

app.post("/api/auth/login", (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res
        .status(400)
        .json({ ok: false, message: "Fali username/password" });
    }

    if (
      String(username) !== String(ADMIN_USER) ||
      String(password) !== String(ADMIN_PASS)
    ) {
      return res
        .status(401)
        .json({ ok: false, message: "Pogrešan username ili lozinka" });
    }

    const token = jwt.sign(
      { id: "admin", username: ADMIN_USER, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({ ok: true, token });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Login greška" });
  }
});

// ------------------------
// ADMIN GUARD
// - /api/auth/*   -> slobodno
// - /api/player/* -> slobodno (ekrani)
// - sve ostalo /api/* -> token + admin
// ------------------------
function adminOnly(req, res, next) {
  if (req.path.startsWith("/api/auth")) return next();
  if (req.path.startsWith("/api/player")) return next();

  if (req.path.startsWith("/api/")) {
    return auth(req, res, () => requireRole("admin")(req, res, next));
  }

  return next();
}
app.use(adminOnly);

// ------------------------
// SERVIRAJ STATIC (RENDER/PROD SAFE)
// ------------------------
app.use(express.static(path.join(__dirname, "public")));
app.use("/admin", express.static(path.join(__dirname, "public", "admin")));
app.use("/media", express.static(path.join(__dirname, "public", "media")));

// --------------------------------------------------
// POMOĆNA FUNKCIJA: normalizacija URL-a za fajl
// --------------------------------------------------
function normalizeMediaUrl(fajlUrl) {
  if (!fajlUrl) return fajlUrl;

  const str = String(fajlUrl).trim();
  if (str.startsWith("http://") || str.startsWith("https://")) return str;
  if (str.startsWith("/media/")) return str;

  // ako dođe "sanin-test.mp4" -> "/media/sanin-test.mp4"
  return "/media/" + str.replace(/^\/+/, "");
}

// ------------------------
// DEMO PODACI
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

// POSLOVNICE (array)
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
    aktivnaReklamaId: "r1",
  },
  {
    id: "bp-lukavica",
    komitentId: "k1",
    naziv: "Gazprom Lukavica",
    grad: "Istočno Sarajevo",
    adresa: "Lukavica",
    status: "online",
    aktivnaReklamaId: "r1",
  },
  {
    id: "bp-grbavica",
    komitentId: "k1",
    naziv: "Gazprom Grbavica",
    grad: "Sarajevo",
    adresa: "Grbavica",
    status: "offline",
    aktivnaReklamaId: null,
  },
  {
    id: "bp-stup",
    komitentId: "k1",
    naziv: "Gazprom Stup",
    grad: "Sarajevo",
    adresa: "Stup",
    status: "offline",
    aktivnaReklamaId: null,
  },
];

// EKRANI (array)
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

// REKLAME (array)
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
    ekraniIds: [],
    pauzirana: false,
    status: "aktivna",
    slotovi: [],
  },
];

function findReklama(id) {
  return reklame.find((r) => String(r.id) === String(id));
}
function makeId(prefix = "r") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
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
  const item = findReklama(req.params.id);
  if (!item) return res.status(404).json({ message: "Reklama nije pronađena" });
  res.json({ ...item, fajlUrl: normalizeMediaUrl(item.fajlUrl) });
});

// ✅✅✅ OVO JE FALILO: CREATE (Nova reklama)
app.post("/api/reklame", (req, res) => {
  try {
    const body = req.body || {};

    const naziv = String(body.naziv || "").trim();
    const tip = String(body.tip || "").trim().toLowerCase();

    if (!naziv) return res.status(400).json({ message: "Naziv je obavezan." });
    if (!tip || !["video", "slika"].includes(tip)) {
      return res.status(400).json({ message: "Tip mora biti video ili slika." });
    }

    const fajlUrl = normalizeMediaUrl(body.fajlUrl || "");

    const newItem = {
      id: makeId("r"),
      naziv,
      tip,
      trajanjeSekundi: Number(body.trajanjeSekundi || 0) || 0,
      datumOd: body.datumOd || null,
      datumDo: body.datumDo || null,
      fajlUrl,
      poslovniceIds: Array.isArray(body.poslovniceIds) ? body.poslovniceIds : [],
      ekraniIds: Array.isArray(body.ekraniIds) ? body.ekraniIds : [],
      slotovi: Array.isArray(body.slotovi) ? body.slotovi : [],
      pauzirana: false,
      status: "aktivna",
    };

    reklame.unshift(newItem);

    res.status(201).json({ ok: true, reklama: newItem });
  } catch (e) {
    res.status(500).json({ message: "Greška pri dodavanju reklame." });
  }
});

// ✅✅✅ OVO JE FALILO: UPDATE (Uredi reklamu)
app.put("/api/reklame/:id", (req, res) => {
  try {
    const item = findReklama(req.params.id);
    if (!item) return res.status(404).json({ message: "Reklama nije pronađena" });

    const body = req.body || {};

    if (body.naziv !== undefined) item.naziv = String(body.naziv || "").trim();
    if (body.tip !== undefined) item.tip = String(body.tip || "").trim().toLowerCase();

    if (body.fajlUrl !== undefined) item.fajlUrl = normalizeMediaUrl(body.fajlUrl);
    if (body.datumOd !== undefined) item.datumOd = body.datumOd || null;
    if (body.datumDo !== undefined) item.datumDo = body.datumDo || null;

    if (Array.isArray(body.poslovniceIds)) item.poslovniceIds = body.poslovniceIds;
    if (Array.isArray(body.ekraniIds)) item.ekraniIds = body.ekraniIds;
    if (Array.isArray(body.slotovi)) item.slotovi = body.slotovi;

    // sigurnost: tip validacija
    if (item.tip && !["video", "slika"].includes(item.tip)) item.tip = "video";

    res.json({ ok: true, reklama: { ...item, fajlUrl: normalizeMediaUrl(item.fajlUrl) } });
  } catch (e) {
    res.status(500).json({ message: "Greška pri izmjeni reklame." });
  }
});

// EKRANI — CREATE / UPDATE / DELETE
app.post("/api/ekrani", auth, (req, res) => {
  const { naziv, poslovnicaId, lokacijaTip, napomena } = req.body || {};
  if (!naziv || !poslovnicaId) {
    return res.status(400).json({ message: "Fali naziv ili poslovnicaId" });
  }

  const novi = {
    id: "ek-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    naziv: String(naziv).trim(),
    poslovnicaId: String(poslovnicaId).trim(),
    lokacijaTip: lokacijaTip ? String(lokacijaTip).trim() : "",
    napomena: napomena ? String(napomena).trim() : "",
    status: "offline",
    aktivnaReklamaId: null,
  };

  ekrani.push(novi);
  saveData();
  res.json({ ok: true, ekran: novi });
});

app.put("/api/ekrani/:id", auth, (req, res) => {
  const item = ekrani.find((e) => e.id === req.params.id);
  if (!item) return res.status(404).json({ message: "Ekran nije pronađen" });

  const { naziv, poslovnicaId, lokacijaTip, napomena, status, aktivnaReklamaId } = req.body || {};

  if (naziv !== undefined) item.naziv = String(naziv).trim();
  if (poslovnicaId !== undefined) item.poslovnicaId = String(poslovnicaId).trim();
  if (lokacijaTip !== undefined) item.lokacijaTip = String(lokacijaTip).trim();
  if (napomena !== undefined) item.napomena = String(napomena).trim();
  if (status !== undefined) item.status = String(status).trim();
  if (aktivnaReklamaId !== undefined) item.aktivnaReklamaId = aktivnaReklamaId;

  saveData();
  res.json({ ok: true, ekran: item });
});

app.delete("/api/ekrani/:id", auth, (req, res) => {
  const idx = ekrani.findIndex((e) => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Ekran nije pronađen" });

  const removed = ekrani.splice(idx, 1)[0];
  saveData();
  res.json({ ok: true, removed });
});

// ✅✅✅ AKCIJE ZA DUGMAD (tvoj HTML ovo zove)
app.post("/api/reklame/:id/aktiviraj", (req, res) => {
  const item = findReklama(req.params.id);
  if (!item) return res.status(404).json({ message: "Reklama nije pronađena" });

  item.status = "aktivna";
  item.pauzirana = false;

  res.json({ ok: true, reklama: { ...item, fajlUrl: normalizeMediaUrl(item.fajlUrl) } });
});

app.post("/api/reklame/:id/pauziraj", (req, res) => {
  const item = findReklama(req.params.id);
  if (!item) return res.status(404).json({ message: "Reklama nije pronađena" });

  item.status = "pauzirana";
  item.pauzirana = true;

  res.json({ ok: true, reklama: { ...item, fajlUrl: normalizeMediaUrl(item.fajlUrl) } });
});

app.post("/api/reklame/:id/arhiviraj", (req, res) => {
  const item = findReklama(req.params.id);
  if (!item) return res.status(404).json({ message: "Reklama nije pronađena" });

  item.status = "arhivirana";
  item.pauzirana = false;

  res.json({ ok: true, reklama: { ...item, fajlUrl: normalizeMediaUrl(item.fajlUrl) } });
});

app.delete("/api/reklame/:id", (req, res) => {
  const id = req.params.id;
  const before = reklame.length;

  reklame = reklame.filter((r) => r.id !== id);

  if (reklame.length === before) {
    return res.status(404).json({ message: "Reklama nije pronađena" });
  }

  poslovnice = poslovnice.map((p) =>
    p.aktivnaReklamaId === id ? { ...p, aktivnaReklamaId: null } : p
  );

  res.json({ ok: true });
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
    .filter((r) => !r.pauzirana && String(r.status).toLowerCase().includes("aktiv"))
    .map((r) => ({ ...r, fajlUrl: normalizeMediaUrl(r.fajlUrl) }));

  res.json({ ok: true, poslovnicaId: poslovnicaId || null, reklame: lista });
});

// ------------------------
// START SERVER (SIGURNO) - RENDER READY
// ------------------------
(async () => {
  try {
    const ok = await connectDB();
    if (!ok) throw new Error("MongoDB nije spojen (provjeri MONGO_URI na Renderu).");

    await ensureKomitentiSeeded();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`VisioCast backend radi na portu ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Server nije startao:", err?.message || err);
    process.exit(1);
  }
})();
