// server.js
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 4000; // backend na 4000, frontend može ostati na 5000

app.use(cors());
app.use(express.json());

// ------------------------
// DEMO PODACI (umjesto baze za početak)
// Kasnije ovo prebacimo u Mongo / pravu bazu.
// ------------------------

// KOMITENTI
let komitenti = [
  {
    id: "k1",
    naziv: "NIS Gazprom",
    grad: "Beograd",
    kontakt: "Marko Petrović",
    telefon: "+381 11 123 456",
    napomena: "Demo komitent – ima više pumpi u BiH.",
  },
  {
    id: "k2",
    naziv: "Shell BiH (demo)",
    grad: "Sarajevo",
    kontakt: "Demo Kontakt",
    telefon: "+387 33 000 000",
    napomena: "Za testiranje drugih klijenata.",
  },
];

// POSLOVNICE (pumpe)
let poslovnice = [
  {
    id: "bp-doboj-jug",
    komitentId: "k1",
    naziv: "Gazprom Doboj Jug",
    grad: "Doboj Jug",
    adresa: "Doboj Jug",
    status: "online", // online/offline
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

// EKRANI (po pumpama)
let ekrani = [
  {
    id: "scr-doboj-1",
    naziv: "Doboj Jug – Ekran 1",
    poslovnicaId: "bp-doboj-jug",
    lokacijaOpis: "Ulazni ekran",
    status: "online",
    aktivnaReklamaId: null,
  },
  {
    id: "scr-grbavica-1",
    naziv: "Grbavica – Ekran 1",
    poslovnicaId: "bp-grbavica",
    lokacijaOpis: "Unutrašnji ekran",
    status: "offline",
    aktivnaReklamaId: null,
  },
  {
    id: "scr-ilidza-1",
    naziv: "Ilidža – Ekran 1",
    poslovnicaId: "bp-ilidza",
    lokacijaOpis: "Ulazni ekran",
    status: "online",
    aktivnaReklamaId: null,
  },
  {
    id: "scr-ilidza-2",
    naziv: "Ilidža – Ekran 2 (unutra)",
    poslovnicaId: "bp-ilidza",
    lokacijaOpis: "Unutrašnji ekran",
    status: "online",
    aktivnaReklamaId: null,
  },
];

// REKLAME (kampanje)
let reklame = [
  {
    id: "r1",
    naziv: "Akcija kafa",
    tip: "video", // "video" ili "slika"
    trajanjeSekundi: 15,
    datumOd: "2025-12-01",
    datumDo: "2025-12-31",
    fajlUrl: "https://example.com/video1.mp4",
    // slotovi po danu
    slotovi: [
      { od: "09:00", do: "10:00" },
      { od: "15:00", do: "16:00" },
    ],
    // na kojim pumpama ide reklam
    poslovniceIds: ["bp-ilidza", "bp-lukavica"],
    pauzirana: false, // ako je true → status Pauzirana
  },
  {
    id: "r2",
    naziv: "Sniženje deterđenata",
    tip: "slika",
    trajanjeSekundi: 8,
    datumOd: "2025-12-05",
    datumDo: "2025-12-20",
    fajlUrl: "https://example.com/slika1.jpg",
    slotovi: [{ od: "10:00", do: "12:00" }],
    poslovniceIds: ["bp-doboj-jug", "bp-grbavica", "bp-stup"],
    pauzirana: false,
  },
  {
    id: "r3",
    naziv: "Zimske gume",
    tip: "video",
    trajanjeSekundi: 12,
    datumOd: "2025-11-20",
    datumDo: "2025-12-10",
    fajlUrl: "https://example.com/video2.mp4",
    slotovi: [{ od: "08:00", do: "20:00" }],
    poslovniceIds: ["bp-stup"],
    pauzirana: true,
  },
];

// helper za status reklame (Aktivna / Pauzirana / Istekla / Zakazana)
function izracunajStatus(reklama) {
  const danas = new Date();

  const od = reklama.datumOd ? new Date(reklama.datumOd) : null;
  const dO = reklama.datumDo ? new Date(reklama.datumDo) : null;

  // 1) ako je pauzirana – uvijek Pauzirana
  if (reklama.pauzirana) return "Pauzirana";

  // 2) ako postoji datum OD u budućnosti → Zakazana
  if (od && danas < od) return "Zakazana";

  // 3) ako postoji datum DO u prošlosti → Istekla
  if (dO && danas > dO) return "Istekla";

  // 4) sve ostalo → Aktivna
  return "Aktivna";
}


// ------------------------
// API – KOMITENTI
// ------------------------
app.get("/api/komitenti", (req, res) => {
  res.json(komitenti);
});

// ------------------------
// API – POSLOVNICE
// ------------------------
app.get("/api/poslovnice", (req, res) => {
  res.json(poslovnice);
});

// ------------------------
// API – EKRANI
// ------------------------
app.get("/api/ekrani", (req, res) => {
  res.json(ekrani);
});

// ------------------------
// API – REKLAME (CRUD)
// ------------------------

// LISTA REKLAMA
app.get("/api/reklame", (req, res) => {
  const data = reklame.map((r) => ({
    ...r,
    status: izracunajStatus(r),
  }));
  res.json(data);
});

// DODAJ NOVU REKLAMU
app.post("/api/reklame", (req, res) => {
  const body = req.body;

  const novaReklama = {
    id: "r" + (Date.now().toString(36)), // jednostavan ID
    naziv: body.naziv,
    tip: body.tip,
    trajanjeSekundi: body.trajanjeSekundi,
    datumOd: body.datumOd,
    datumDo: body.datumDo,
    fajlUrl: body.fajlUrl,
    slotovi: body.slotovi || [],
    poslovniceIds: body.poslovniceIds || [],
    pauzirana: false,
  };

  reklame.push(novaReklama);

  res.status(201).json({
    ...novaReklama,
    status: izracunajStatus(novaReklama),
  });
});

// UREDI REKLAMU
app.put("/api/reklame/:id", (req, res) => {
  const id = req.params.id;
  const body = req.body;

  const idx = reklame.findIndex((r) => r.id === id);
  if (idx === -1) return res.status(404).json({ message: "Reklama nije pronađena" });

  reklame[idx] = {
    ...reklame[idx],
    naziv: body.naziv ?? reklame[idx].naziv,
    tip: body.tip ?? reklame[idx].tip,
    trajanjeSekundi: body.trajanjeSekundi ?? reklame[idx].trajanjeSekundi,
    datumOd: body.datumOd ?? reklame[idx].datumOd,
    datumDo: body.datumDo ?? reklame[idx].datumDo,
    fajlUrl: body.fajlUrl ?? reklame[idx].fajlUrl,
    slotovi: body.slotovi ?? reklame[idx].slotovi,
    poslovniceIds: body.poslovniceIds ?? reklame[idx].poslovniceIds,
  };

  res.json({
    ...reklame[idx],
    status: izracunajStatus(reklame[idx]),
  });
});

// PAUZIRAJ / AKTIVIRAJ
app.post("/api/reklame/:id/pauziraj", (req, res) => {
  const id = req.params.id;
  const reklama = reklame.find((r) => r.id === id);
  if (!reklama) return res.status(404).json({ message: "Reklama nije pronađena" });

  reklama.pauzirana = true;
  res.json({ ...reklama, status: izracunajStatus(reklama) });
});

app.post("/api/reklame/:id/aktiviraj", (req, res) => {
  const { id } = req.params;
  const { exclusive } = req.body || {};
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

  const reklama = reklame.find(r => r.id === id);
  if (!reklama) {
    return res.status(404).json({ message: "Reklama nije pronađena" });
  }

  // Ako želiš da ova bude jedina aktivna – sve ostale pauziraj
  if (exclusive) {
    reklame.forEach(r => {
      if (r.id !== id) {
        r.pauzirana = true;
      }
    });
  }

  // Skini pauzu sa ove
  reklama.pauzirana = false;

  // Ako nema period OD → stavi od danas
  if (!reklama.datumOd) {
    reklama.datumOd = today;
  }

  // Ako je DO u prošlosti, izbriši ga (otvorena kampanja)
  if (reklama.datumDo && reklama.datumDo < today) {
    reklama.datumDo = null;
  }

  return res.json({
    ...reklama,
    status: izracunajStatus(reklama),
  });
});


// OBRIŠI
app.delete("/api/reklame/:id", (req, res) => {
  const id = req.params.id;
  const prije = reklame.length;
  reklame = reklame.filter((r) => r.id !== id);

  if (reklame.length === prije) {
    return res.status(404).json({ message: "Reklama nije pronađena" });
  }

  res.json({ success: true });
});

// ------------------------
// API ZA PLAYER
// /api/player/playlist?ekranId=...
// vraća listu fajlova koji trenutno trebaju da se vrte na tom ekranu
// ------------------------
app.get("/api/player/playlist", (req, res) => {
  const { ekranId } = req.query;
  if (!ekranId) return res.status(400).json({ message: "Nedostaje ekranId" });

  const ekran = ekrani.find((e) => e.id === ekranId);
  if (!ekran) return res.status(404).json({ message: "Ekran nije pronađen" });

  const posId = ekran.poslovnicaId;

  const sada = new Date();
  const nowTime = sada.toTimeString().slice(0, 5); // "HH:MM"

  // helper da provjerimo da li je vrijeme u slotu
  function jeUSlotu(reklama, timeStr) {
    if (!reklama.slotovi || reklama.slotovi.length === 0) return true;
    return reklama.slotovi.some((s) => s.od <= timeStr && timeStr <= s.do);
  }

  const aktivneReklame = reklame.filter((r) => {
    if (r.pauzirana) return false;
    if (!r.poslovniceIds.includes(posId)) return false;

    const od = new Date(r.datumOd);
    const dO = new Date(r.datumDo);
    if (sada < od || sada > dO) return false;

    if (!jeUSlotu(r, nowTime)) return false;

    return true;
  });

  // playlist format koji playeru treba
  const playlist = aktivneReklame.map((r) => ({
    id: r.id,
    naziv: r.naziv,
    tip: r.tip,
    trajanjeSekundi: r.trajanjeSekundi,
    fajlUrl: r.fajlUrl,
  }));

  res.json({ ekranId, playlist });
});

// ------------------------
app.listen(PORT, () => {
  console.log(`VisioCast backend radi na http://localhost:${PORT}`);
});
