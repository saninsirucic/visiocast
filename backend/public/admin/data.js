// -----------------------------
// CENTRALNI DEMO PODACI (frontend)
// Kasnije backend / prava baza
// -----------------------------

// 1) KOMITENTI (klijenti)
const komitenti = [
  {
    id: "K001",
    naziv: "NIS Gazprom",
    jib: "1234567890001",
    adresa: "Bulevar oslobođenja 1",
    grad: "Beograd",
    drzava: "Srbija",
    kontaktOsoba: "Marko Petrović",
    telefon: "+381 11 123 456",
    email: "marko.petrovic@gazprom.rs",
    napomena: "Demo komitent – ima više pumpi u BiH."
  },
  {
    id: "K002",
    naziv: "Shell BiH (demo)",
    jib: "9876543210002",
    adresa: "Zmaja od Bosne bb",
    grad: "Sarajevo",
    drzava: "BiH",
    kontaktOsoba: "Demo Kontakt",
    telefon: "+387 33 000 000",
    email: "info@shell-demo.ba",
    napomena: "Za testiranje drugih klijenata."
  }
];

// 2) POSLOVNICE (pumpe) – vezane na komitente
const poslovnice = [
  {
    id: "P001",
    komitentId: "K001",
    naziv: "Gazprom Doboj Jug",
    lokacija: "Doboj Jug",
    status: "online",
    reklama: "Energy drink promo",
    signal: 28,
    lastMinutes: 60 * 8 // 8 sati
  },
  {
    id: "P002",
    komitentId: "K001",
    naziv: "Gazprom Ilidža",
    lokacija: "Ilidža, Sarajevo",
    status: "online",
    reklama: "Akcija - kafa 1 KM",
    signal: 82,
    lastMinutes: 15
  },
  {
    id: "P003",
    komitentId: "K001",
    naziv: "Gazprom Lukavica",
    lokacija: "Istočno Sarajevo",
    status: "online",
    reklama: "Akcija - kafa 1 KM",
    signal: 45,
    lastMinutes: 35
  },
  {
    id: "P004",
    komitentId: "K001",
    naziv: "Gazprom Grbavica",
    lokacija: "Grbavica, Sarajevo",
    status: "offline",
    reklama: "Energy drink promo",
    signal: 0,
    lastMinutes: 60 * 24 * 10 // 10 dana
  },
  {
    id: "P005",
    komitentId: "K001",
    naziv: "Gazprom Stup",
    lokacija: "Stup, Sarajevo",
    status: "offline",
    reklama: "Zimske gume",
    signal: 0,
    lastMinutes: 60 * 24 // 1 dan
  }
];

// 3) EKRANI – svaki ekran je vezan na poslovnicu
const ekrani = [
  {
    id: "E001",
    poslovnicaId: "P001",
    naziv: "Doboj Jug – Ekran 1",
    pozicija: "Ulaz",
    konekcija: "sim",
    status: "warning", // online | offline | warning
    signal: 28,
    lastContactMinutes: 12,
    health: 78,
    aktivnaReklama: "Energy drink promo"
  },
  {
    id: "E002",
    poslovnicaId: "P002",
    naziv: "Ilidža – Ekran 1",
    pozicija: "Unutrašnjost",
    konekcija: "wifi",
    status: "online",
    signal: 82,
    lastContactMinutes: 5,
    health: 96,
    aktivnaReklama: "Akcija - kafa 1 KM"
  },
  {
    id: "E003",
    poslovnicaId: "P002",
    naziv: "Ilidža – Ekran 2 (unutra)",
    pozicija: "Kod kase",
    konekcija: "wifi",
    status: "online",
    signal: 54,
    lastContactMinutes: 3,
    health: 91,
    aktivnaReklama: "Sniženje deterdženata"
  },
  {
    id: "E004",
    poslovnicaId: "P003",
    naziv: "Lukavica – Ekran 1",
    pozicija: "Ulaz",
    konekcija: "sim",
    status: "online",
    signal: 65,
    lastContactMinutes: 18,
    health: 84,
    aktivnaReklama: "Akcija - kafa 1 KM"
  },
  {
    id: "E005",
    poslovnicaId: "P004",
    naziv: "Grbavica – Ekran 1",
    pozicija: "Izlog",
    konekcija: "wifi",
    status: "offline",
    signal: 0,
    lastContactMinutes: 60 * 24, // 1 dan
    health: 40,
    aktivnaReklama: "Akcija - kafa 1 KM"
  },
  {
    id: "E006",
    poslovnicaId: "P005",
    naziv: "Stup – Ekran 1",
    pozicija: "Ulaz",
    konekcija: "lan",
    status: "online",
    signal: 65,
    lastContactMinutes: 8,
    health: 88,
    aktivnaReklama: "Zimske gume"
  }
];

// 4) Reklame – minimalno, za kasnije vezanje na kampanje
const reklame = [
  {
    id: "R001",
    naziv: "Akcija kafa",
    tip: "video",
    trajanjeSek: 15
  },
  {
    id: "R002",
    naziv: "Zimske gume",
    tip: "video",
    trajanjeSek: 10
  },
  {
    id: "R003",
    naziv: "Sniženje deterdženata",
    tip: "slika",
    trajanjeSek: 8
  },
  {
    id: "R004",
    naziv: "Energy drink promo",
    tip: "video",
    trajanjeSek: 12
  }
];

// 5) Alias da stari kod radi (pumpe.html koristi "pumpe")
const pumpe = poslovnice;

// DEMO EKRENI (box uređaji)
window.demoEkrani = [
  {
    id: 1,
    naziv: "Ulazni ekran - Ilidža",
    poslovnica: "Gazprom Ilidža",
    status: "online",
    signal: 82,
    konekcija: "WiFi",
    zadnjiSignal: "5 min",
    aktivnaReklama: "Akcija kafa 1 KM"
  },
  {
    id: 2,
    naziv: "Unutrašnji ekran - Grbavica",
    poslovnica: "Gazprom Grbavica",
    status: "offline",
    signal: 0,
    konekcija: "SIM",
    zadnjiSignal: "10 d",
    aktivnaReklama: "Energy drink promo"
  },
  {
    id: 3,
    naziv: "Ulazni ekran - Doboj Jug",
    poslovnica: "Gazprom Doboj Jug",
    status: "online",
    signal: 45,
    konekcija: "WiFi",
    zadnjiSignal: "35 min",
    aktivnaReklama: "Akcija – kafa 1 KM"
  },
  {
    id: 4,
    naziv: "Unutrašnji ekran - Lukavica",
    poslovnica: "Gazprom Lukavica",
    status: "online",
    signal: 74,
    konekcija: "SIM",
    zadnjiSignal: "12 min",
    aktivnaReklama: "Zimske gume"
  }
];
