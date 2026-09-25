const CLAVE = "panelPokeMMO_botones";

function cargar(){
  const datos = localStorage.getItem(CLAVE);
  if(datos) return JSON.parse(datos);
  return [
    {nombre:"Red", archivo:"RED_By_Flambeo.html"},
    {nombre:"Halloween (info 2025)", archivo:"PokeMMO_Halloween_2025_Event_Terminal_V6_PROGRESO_PERSISTENTE.html"},
    {nombre:"Evs", archivo:"guia-evs-snowold.html"}
  ];
}

function guardarTodo(lista){
  localStorage.setItem(CLAVE, JSON.stringify(lista));
}

let botones = cargar();

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
  botones.forEach((b, i) => {
    const tarjeta = document.createElement("div");
    tarjeta.className = "tarjeta";
    tarjeta.innerHTML = `
      <input type="text" value="${escapeHtml(b.nombre)}" placeholder="Nombre del botón" data-tipo="nombre" data-i="${i}">
      <input type="text" value="${escapeHtml(b.archivo)}" placeholder="archivo.html o carpeta/archivo.html" data-tipo="archivo" data-i="${i}">
      <div class="fila-botones">
        <button class="btn ir" data-i="${i}">▶ Ir</button>
        <button class="btn guardar" data-i="${i}">💾 Guardar</button>
        <button class="btn borrar" data-i="${i}">🗑 Borrar</button>
      </div>
    `;
    cont.appendChild(tarjeta);
  });

  cont.querySelectorAll(".ir").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const i = btn.dataset.i;
      const ruta = botones[i].archivo.trim();
      if(!ruta){ alert("Completá el archivo antes de ir."); return; }
      window.open(ruta, "_blank");
    });
  });

  cont.querySelectorAll(".guardar").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const i = btn.dataset.i;
      const nombreInput = cont.querySelector(`input[data-tipo="nombre"][data-i="${i}"]`);
      const archivoInput = cont.querySelector(`input[data-tipo="archivo"][data-i="${i}"]`);
      botones[i].nombre = nombreInput.value;
      botones[i].archivo = archivoInput.value;
      guardarTodo(botones);
      btn.textContent = "✓ Guardado";
      setTimeout(()=>btn.textContent="💾 Guardar", 900);
    });
  });

  cont.querySelectorAll(".borrar").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const i = btn.dataset.i;
      if(confirm("¿Borrar este botón?")){
        botones.splice(i,1);
        guardarTodo(botones);
        render();
      }
    });
  });
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

document.getElementById("agregar").addEventListener("click", ()=>{
  botones.push({nombre:"Nueva guía", archivo:""});
  guardarTodo(botones);
  render();
});

render();
