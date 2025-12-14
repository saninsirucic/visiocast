const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Staticki fajlovi za admin panel
app.use(
  "/admin",
  express.static(path.join(__dirname, "..", "public", "admin"))
);

// ---- FAKE POSLOVNICE (dok ne povežemo pravu bazu) ----
const poslovnice = [
  { id: 1, naziv: "BP Sarajevo - Stup" },
  { id: 2, naziv: "BP Sarajevo - Otoka" },
  { id: 3, naziv: "BP Zenica" },
  { id: 4, naziv: "BP Mostar" }
];

// --- FAKE PODACI ZA SAD (kasnije ide prava baza) ---
let reklame = [
  {
    id: 1,
    naziv: "Akcija kafa",
    tip: "video",
    fajlUrl: "https://example.com/video1.mp4",
    trajanjeSekundi: 15,
    datumOd: "2025-12-01",
    datumDo: "2025-12-31",
    timeSlots: [
      { from: "09:00", to: "10:00" },
      { from: "15:00", to: "16:00" }
    ],
    poslovniceIds: [1, 2]
  },
  {
    id: 2,
    naziv: "Sniženje deterdženata",
    tip: "slika",
    fajlUrl: "https://example.com/slika1.jpg",
    trajanjeSekundi: 8,
    datumOd: "2025-12-05",
    datumDo: "2025-12-20",
    timeSlots: [{ from: "10:00", to: "12:00" }],
    poslovniceIds: [2, 3, 4]
  }
];

// Health check – da vidimo da server radi
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Backend radi ✅" });
});

// Poslovnice – za formu (checkboxi)
app.get("/api/poslovnice", (req, res) => {
  res.json(poslovnice);
});

// Lista reklama
app.get("/api/reklame", (req, res) => {
  res.json(reklame);
});

// Dodavanje nove reklame
app.post("/api/reklame", (req, res) => {
  const {
    naziv,
    tip,
    fajlUrl,
    trajanjeSekundi,
    datumOd,
    datumDo,
    timeSlots,
    poslovniceIds
  } = req.body;

  if (!naziv || !tip || !fajlUrl || !trajanjeSekundi) {
    return res.status(400).json({ message: "Nedostaju osnovni podaci." });
  }

  const novaReklama = {
    id: reklame.length ? reklame[reklame.length - 1].id + 1 : 1,
    naziv,
    tip, // "video" ili "slika"
    fajlUrl,
    trajanjeSekundi: Number(trajanjeSekundi),
    datumOd: datumOd || null,
    datumDo: datumDo || null,
    timeSlots: Array.isArray(timeSlots) ? timeSlots : [],
    poslovniceIds: Array.isArray(poslovniceIds)
      ? poslovniceIds.map((n) => Number(n))
      : []
  };

  reklame.push(novaReklama);

  return res.status(201).json(novaReklama);
});

// Brisanje reklame
app.delete("/api/reklame/:id", (req, res) => {
  const id = Number(req.params.id);

  const postoji = reklame.some((r) => r.id === id);
  if (!postoji) {
    return res.status(404).json({ message: "Reklama nije pronađena." });
  }

  reklame = reklame.filter((r) => r.id !== id);
  return res.json({ message: "Reklama obrisana." });
});

module.exports = app;
