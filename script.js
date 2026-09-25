const botones = [
  {nombre:"Red", archivo:"https://reydanferret.github.io/GuiasPokeMMO/RED_By_Flambeo.html"},
  {nombre:"Halloween (info 2025)", archivo:"https://reydanferret.github.io/GuiasPokeMMO/PokeMMO_Halloween_2025_Event_Terminal_V6_PROGRESO_PERSISTENTE.html"},
  {nombre:"Evs", archivo:"https://reydanferret.github.io/GuiasPokeMMO/guia-evs-snowold.html"}
  {nombre:"Amuletos", archivo:"https://reydanferret.github.io/GuiasPokeMMO/Amuleto/index.html"}
];

function generarNieve(){
  const copos = "❄❅❆•";
  const cantidad = 35;
  for(let i=0;i<cantidad;i++){
    const copo = document.createElement("span");
    copo.className = "nieve";
    copo.textContent = copos[Math.floor(Math.random()*copos.length)];
    const tam = 10 + Math.random()*18;
    copo.style.left = Math.random()*100 + "vw";
    copo.style.fontSize = tam + "px";
    copo.style.opacity = 0.4 + Math.random()*0.6;
    copo.style.setProperty("--deriva", (Math.random()*80-40)+"px");
    const duracion = 8 + Math.random()*10;
    copo.style.animationDuration = duracion + "s";
    copo.style.animationDelay = (Math.random()*duracion) + "s";
    document.body.appendChild(copo);
  }
}
generarNieve();

function render(){
  const cont = document.getElementById("contenedor");
  cont.innerHTML = "";
  botones.forEach((b) => {
    const tarjeta = document.createElement("div");
    tarjeta.className = "tarjeta";
    tarjeta.innerHTML = `
      <button class="btn ir">▶ ${escapeHtml(b.nombre)}</button>
    `;
    tarjeta.querySelector(".ir").addEventListener("click", ()=>{
      window.open(b.archivo, "_blank");
    });
    cont.appendChild(tarjeta);
  });
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

render();
