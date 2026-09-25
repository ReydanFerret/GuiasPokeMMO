const botones = [
  { nombre: "Red", archivo: "RED_By_Flambeo.html" },
  { nombre: "Halloween (info 2025)", archivo: "PokeMMO_Halloween_2025_Event_Terminal_V6_PROGRESO_PERSISTENTE.html" },
  { nombre: "Evs", archivo: "EVs/guia-evs-snowold.html" },
  { nombre: "Amuletos", archivo: "Amuleto/amuleto.html" }
];

function generarNieve() {
  const copos = "❄❅❆•";
  const cantidad = 35;

  for (let i = 0; i < cantidad; i++) {
    const copo = document.createElement("span");

    copo.className = "nieve";
    copo.textContent = copos[Math.floor(Math.random() * copos.length)];

    const tam = 10 + Math.random() * 18;

    copo.style.left = Math.random() * 100 + "vw";
    copo.style.fontSize = tam + "px";
    copo.style.opacity = 0.4 + Math.random() * 0.6;

    copo.style.setProperty(
      "--deriva",
      (Math.random() * 80 - 40) + "px"
    );

    const duracion = 8 + Math.random() * 10;

    copo.style.animationDuration = duracion + "s";
    copo.style.animationDelay = (Math.random() * duracion) + "s";

    document.body.appendChild(copo);
  }
}

generarNieve();

function render() {
  const cont = document.getElementById("contenedor");

  cont.innerHTML = "";

  botones.forEach((b) => {
    const tarjeta = document.createElement("div");

    tarjeta.className = "tarjeta";

    tarjeta.innerHTML = `
      <a class="btn ir" href="${escapeHtml(b.archivo)}">
        ▶ ${escapeHtml(b.nombre)}
      </a>
    `;

    cont.appendChild(tarjeta);
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

render();