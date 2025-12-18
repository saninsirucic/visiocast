// VisioCast – Admin Auth Guard
// Cilj: nijedna admin stranica se ne otvara bez prijave.
// Token se čuva u sessionStorage (nestaje kad zatvoriš browser).

(function () {
  try {
    // Ako si na login stranici – ne guardamo
    if (location.pathname.endsWith("/admin/login.html")) return;

    const token = sessionStorage.getItem("token");
    if (!token) {
      // Očisti sve "stare" tokene, za svaki slučaj
      try { localStorage.removeItem("token"); } catch(e) {}
      try { sessionStorage.removeItem("token"); } catch(e) {}

      // Prebaci na login
      location.replace("/admin/login.html");
    }
  } catch (e) {
    // Ako browser blokira storage, radije ga vrati na login
    location.replace("/admin/login.html");
  }
})();
