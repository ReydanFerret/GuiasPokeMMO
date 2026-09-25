/* ===== Datos (gimnasios, entrenadores, alto mando) ===== */
class Gym {
    constructor(id, region, city, name, profit) {
        this.id = id;
        this.region = region;
        this.city = city;
        this.name = name;
        this.profit = profit;
    }
}

const GYMS = [
    // Kanto
    new Gym("gk1", "Kanto", "Ciudad Plateada", "Brock", 8632),
    new Gym("gk2", "Kanto", "Ciudad Celeste", "Misty", 8736),
    new Gym("gk3", "Kanto", "Ciudad Carmín", "Teniente Surge", 8840),
    new Gym("gk4", "Kanto", "Ciudad Azulona", "Erika", 8944),
    new Gym("gk5", "Kanto", "Ciudad Fucsia", "Koga", 9048),
    new Gym("gk6", "Kanto", "Ciudad Azafrán", "Sabrina", 9152),
    new Gym("gk7", "Kanto", "Isla Canela", "Blaine", 9256),

    // Hoenn
    new Gym("gh1", "Hoenn", "Ciudad Férrica", "Petra", 8632),
    new Gym("gh2", "Hoenn", "Pueblo Azuliza", "Marcial", 8736),
    new Gym("gh3", "Hoenn", "Ciudad Malvalona", "Erico", 8840),
    new Gym("gh4", "Hoenn", "Pueblo Lavacalda", "Candela", 8944),
    new Gym("gh5", "Hoenn", "Ciudad Petalia", "Norman", 9048),
    new Gym("gh6", "Hoenn", "Ciudad Arborada", "Alana", 9152),
    new Gym("gh7", "Hoenn", "Ciudad Algaria", "Vito y Leti", 9256),
    new Gym("gh8", "Hoenn", "Arrecípolis", "Plubio", 9360),

    // Sinnoh
    new Gym("gs1", "Sinnoh", "Ciudad Pirita", "Roco", 8632),
    new Gym("gs2", "Sinnoh", "Ciudad Vetusta", "Gardenia", 8736),
    new Gym("gs3", "Sinnoh", "Ciudad Corazón", "Fantina", 8840),
    new Gym("gs4", "Sinnoh", "Ciudad Rocavelo", "Brega", 8944),
    new Gym("gs5", "Sinnoh", "Ciudad Pradera", "Mananti", 9048),
    new Gym("gs6", "Sinnoh", "Ciudad Canal", "Acerón", 9152),
    new Gym("gs7", "Sinnoh", "Ciudad Puntaneva", "Inverna", 9256),
    new Gym("gs8", "Sinnoh", "Ciudad Marina", "Lectro", 9360),

    // Teselia
    new Gym("gu1f", "Teselia", "Ciudad Gres", "Zeo", 8632),
    new Gym("gu1g", "Teselia", "Ciudad Gres", "Millo", 8632),
    new Gym("gu1w", "Teselia", "Ciudad Gres", "Maíz", 8632),
    new Gym("gu2", "Teselia", "Ciudad Esmalte", "Aloe", 8736),
    new Gym("gu3", "Teselia", "Ciudad Porcelana", "Camus", 8840),
    new Gym("gu4", "Teselia", "Ciudad Mayólica", "Camila", 8944),
    new Gym("gu5", "Teselia", "Ciudad Fayenza", "Yakón", 9048),
    new Gym("gu6", "Teselia", "Ciudad Loza", "Skyla", 9152),
    new Gym("gu7", "Teselia", "Ciudad Teja", "Junco", 9256),
    new Gym("gu8", "Teselia", "Ciudad Caolín", "Iris", 9360),

    // Johto
    new Gym("gj1", "Johto", "Ciudad Malva", "Pegaso", 8632),
    new Gym("gj2", "Johto", "Pueblo Azalea", "Antón", 8736),
    new Gym("gj3", "Johto", "Ciudad Trigal", "Blanca", 8840),
    new Gym("gj4", "Johto", "Ciudad Iris", "Morti", 8944),
    new Gym("gj5", "Johto", "Ciudad Orquídea", "Aníbal", 9048),
    new Gym("gj6", "Johto", "Ciudad Olivo", "Yasmina", 9152),
    new Gym("gj7", "Johto", "Ciudad Caoba", "Fredo", 9256),
    new Gym("gj8", "Johto", "Ciudad Endrino", "Débora", 9360),
];

class Trainer {
    constructor(id, region, location, name, profit) {
        this.id = id;
        this.region = region;
        this.location = location;
        this.name = name;
        this.profit = profit;
    }
}

const TRAINERS = [
    new Trainer("tu1", "Teselia", "Ruta 13 (Undella)", "Socialité Mariana", 5400),
    new Trainer("tu2", "Teselia", "Ruta 13 (Undella)", "Caballero Yan", 5400),
    new Trainer("tu3", "Teselia", "Ruta 9 (Centro Comercial)", "Niño Rico Manuel", 4080),
    new Trainer("tu4", "Teselia", "Ruta 9 (Centro Comercial)", "Señorita Isabel", 4080),
    new Trainer("tu5", "Teselia", "Ciudad Porcelana", "Morimoto", 15660),
    new Trainer("tu6", "Teselia", "Undella", "Cintia", 16560),
    new Trainer("ts1", "Sinnoh", "Ruta 214", "Investigador Carlos", 6000),
    new Trainer("ts2", "Sinnoh", "Ruta 210", "Abuelos", 5264),
    new Trainer("tj1", "Johto", "Monte Plateado", "Rojo", 110400),
    new Trainer("tj2", "Johto", "Faro (Ciudad Olivo)", "Caballero Alfredo", 4300),
    new Trainer("tj3", "Johto", "Ruta 38 (Ciudad Iris)", "Caballero Milton", 4300)
];

class Team {
    constructor(id, region, profit) {
        this.id = id;
        this.region = region;
        this.profit = profit;
    }
}

const ELITEFOUR = [
    new Team("ek", "Kanto", 66000),
    new Team("ej", "Johto", 66000),
    new Team("eh", "Hoenn", 66000),
    new Team("es", "Sinnoh", 66000),
    new Team("eu", "Teselia", 66000)
];


/* ===== Generación de tablas ===== */

let regions = [];
function add_sub_table(region, name) {
    let div = document.querySelector(`#${name}s`);

    // Columna de Bootstrap: 1 por fila en mobile, 2 en tablet, 3 en desktop.
    // Bootstrap ya estira todas las columnas de una misma fila a la altura
    // de la más alta, así que ninguna tarjeta queda "corta".
    let colWrapper = document.createElement("div");
    colWrapper.classList.add("col-12", "col-sm-6", "col-lg-4");

    // Tarjeta interna: ocupa toda la altura de la columna (ver .region-card
    // en styles.css) para que no quede un hueco vacío al lado de otra región.
    let cardWrapper = document.createElement("div");
    cardWrapper.classList.add("region-card", "d-flex", "flex-column", "p-2");

    // Encabezado de la región (H3)
    let header = document.createElement("h3");
    header.innerHTML = region;
    header.classList.add("fs-5", "mb-2", "mt-0");
    cardWrapper.appendChild(header);

    // Tabla limpia sin 'table-fixed'
    let table = document.createElement("table");
    table.setAttribute("id", `${region.toLowerCase()}-${name}s`);
    table.classList.add("table", "table-sm", "m-0");
    
    if(name == "trainer") {
        table.innerHTML="<tr><th></th><th>Ubicación</th><th>Entrenador</th><th>Ganancia</th></tr>";
    } else if (name == "gym") {
        table.innerHTML="<tr><th></th><th>Ciudad</th><th>Líder</th><th>Ganancia</th></tr>";
    }
    
    cardWrapper.appendChild(table);
    colWrapper.appendChild(cardWrapper);
    div.appendChild(colWrapper);
    
    regions.push(name+region);
}

// Función encargada de llenar las filas
function fill_table(unit, name) {
    if(!regions.includes(name+unit.region)){
        add_sub_table(unit.region, name);
    }
    let table = document.querySelector(`#${unit.region.toLowerCase()}-${name}s`);
    let row = table.insertRow();
    let check_cell = row.insertCell();
    let check_input = document.createElement("input");
    check_input.type = "checkbox";
    check_input.id = unit.id;
    check_input.name = unit.name;
    check_input.value = unit.profit;
    check_input.classList.add("form-check-input");
    check_cell.appendChild(check_input);

    delete unit.region;
    Object.keys(unit).filter(v => v != "id").forEach((k, i) => {
        let cell = row.insertCell();
        let text = document.createTextNode(unit[k]);
        cell.appendChild(text);
    });
}

GYMS.forEach(gym => {fill_table(gym, "gym");});
TRAINERS.forEach(trainer => {fill_table(trainer, "trainer");});

const eliteFourDiv = document.querySelector('#elite-four');
let eliteFourTable = document.createElement("table");
eliteFourTable.setAttribute("id","elite-four-table");
eliteFourTable.classList.add("table","table-sm","table-fixed","gym-table");
eliteFourTable.innerHTML="<tr><th></th><th>Región</th><th>Ganancia Base</th></tr>";
eliteFourDiv.appendChild(eliteFourTable);

ELITEFOUR.forEach(team =>{
    let eliteFourTable = document.querySelector('#elite-four-table');
    let row = eliteFourTable.insertRow();
    let check_cell = row.insertCell();
    let check_input = document.createElement("input");

    check_input.type = "checkbox";
    check_input.id = team.id;
    check_input.name = team.region;
    check_input.value = team.profit;
    check_input.classList.add("form-check-input");

    check_cell.appendChild(check_input);
    Object.keys(team).filter(v => v != "id").forEach((k, i) => {
        let cell = row.insertCell();
        let text = document.createTextNode(team[k]);
        cell.appendChild(text);
    });
});


/* ===== Lógica de cálculo y eventos ===== */
class Item {
    constructor(name,id,bp){
        this.name = name;
        this.id = id;
    }
}

const items = [
    new Item("Moneda Amuleto", "5223"),
    new Item("Amuleto Riqueza 75%", "1412"),
    new Item("Amuleto Riqueza 100%", "1413"),
];

function currencyFormat(x) {
    return x.toLocaleString("es", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
};

function updateTotal() {
    let gymTotal = 0;
    let trainerTotal = 0;
    let eliteFourTotal = 0;

    document.querySelectorAll('#gyms input[type="checkbox"]:checked')
    .forEach((checkbox) => {
        gymTotal += parseInt(checkbox.value);
    });

    document.querySelectorAll('#trainers input[type="checkbox"]:checked')
    .forEach((checkbox) => {
        trainerTotal += parseInt(checkbox.value);
    });
    document.querySelectorAll('#elite-four input[type="checkbox"]:checked')
    .forEach((checkbox) => {
        eliteFourTotal += parseInt(checkbox.value);
    });

    let donator = ((document.getElementById("donator").checked) ? 1.05 : 1);

    let total = (gymTotal+trainerTotal+eliteFourTotal)*donator;
    let amuletCoinTotal = total*1.5-document.getElementById('amulet-coin-in').value;
    let riches75Total =    total*1.75-document.getElementById('riches-75-in').value;
    let riches100Total = total*2.0-document.getElementById('riches-100-in').value;

    let noCharm = document.querySelector('#no-charm');
    let amuletCoin = document.querySelector('#amulet-coin');
    let riches75 = document.querySelector('#riches-75');
    let riches100 = document.querySelector('#riches-100');

    noCharm.textContent = 'Sin amuleto: ' + currencyFormat(total);
    amuletCoin.textContent = 'Moneda Amuleto: ' + currencyFormat(amuletCoinTotal);
    riches75.textContent = 'Riquezas 75%: ' + currencyFormat(riches75Total);
    riches100.textContent = 'Riquezas 100%: ' + currencyFormat(riches100Total);

    textToLink();
};

function updateGymCount() {
    var section = document.getElementById('gyms');
    var checkboxes = section.querySelectorAll('input[type="checkbox"]');
    var headingBeforeSection = section.previousElementSibling;

    var checkedCount = 0;
    checkboxes.forEach(function(checkbox) {
if (checkbox.checked) {checkedCount++;}});if(checkedCount==0) {headingBeforeSection.textContent = "Gimnasios";} else {headingBeforeSection.textContent = "Gimnasios [" + checkedCount + "]";}}function updateEliteFourCount() {var section = document.getElementById('elite-four');var checkboxes = section.querySelectorAll('input[type="checkbox"]');var headingBeforeSection = section.previousElementSibling;var checkedCount = 0;checkboxes.forEach(function(checkbox) {if (checkbox.checked) {checkedCount++;}});if(checkedCount==0) {headingBeforeSection.textContent = "Alto Mando";} else {headingBeforeSection.textContent = "Alto Mando [" + checkedCount + "]";}}function updateTrainerCount() {var section = document.getElementById('trainers');var checkboxes = section.querySelectorAll('input[type="checkbox"]');var headingBeforeSection = section.previousElementSibling;var checkedCount = 0;checkboxes.forEach(function(checkbox) {if (checkbox.checked) {checkedCount++;}});if(checkedCount==0) {headingBeforeSection.textContent = "Entrenadores";} else {headingBeforeSection.textContent = "Entrenadores [" + checkedCount + "]";}}document.addEventListener("DOMContentLoaded", function(event) {//load url paramsconst valsParam = getParameterByName("vals");let vals = [];if(valsParam) {vals = valsParam.split(",");vals.forEach((k,i) => {document.getElementById(k).checked=true;})}const checkedBoxes = document.querySelectorAll('input[type=checkbox]:checked');var checkedBoxIDs = [];checkedBoxes.forEach((k,i)=> {checkedBoxIDs.push(k.id);})if(checkedBoxes.length!=0){updateTotal();updateGymCount();updateTrainerCount();updateEliteFourCount();}document.querySelector('#gyms').addEventListener('change', () => {updateTotal();updateGymCount();});document.querySelector('#trainers').addEventListener('change', () => {updateTotal();updateTrainerCount();});document.querySelector('#elite-four').addEventListener('change', () => {updateTotal();updateEliteFourCount();});document.querySelector('#charm-form').addEventListener('input', () => {updateTotal();});getItemPrices(items);});function textToLink() {document.querySelector("#link").value = createURL();}function createURL() {const checkedBoxes = document.querySelectorAll('input[type=checkbox]:checked');let checkedBoxIDs = [];checkedBoxes.forEach((k,i)=> {checkedBoxIDs.push(k.id);});let idstring = checkedBoxIDs.join(",");idstring = idstring.replace("donator,","");idstring = idstring.replace("donator","");let s = window.location.origin+window.location.pathname+"?vals="+idstring;return s;}function getParameterByName(name, url = window.location.href) {name = name.replace(/[[]]/g, '$&');var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),results = regex.exec(url);if (!results) return null;if (!results[2]) return '';return decodeURIComponent(results[2].replace(/+/g, ' '));}function getItemPrices(items){let itemsWithPrices = [];fetch('fiereu.de').then(response => {if (!response.ok) {throw new Error('Network response was not ok');}return response.json();}).then(data => {for (let item of items) {let searchId = item.id;let foundItem = null;let itemPriceArray = data;for (let j = 0; j < itemPriceArray.length; j++) {if (itemPriceArray[j].item_id == searchId) {foundItem = itemPriceArray[j];break;}}if (foundItem) {let price = foundItem.price;item.price = price;itemsWithPrices.push(item);} else {console.log('Objeto no encontrado');}}if (itemsWithPrices.length === items.length) {document.getElementById('amulet-coin-in').value = itemsWithPrices.find(item => item.id === "5223")?.price;document.getElementById('riches-75-in').value = itemsWithPrices.find(item => item.id === "1412")?.price;document.getElementById('riches-100-in').value = itemsWithPrices.find(item => item.id === "1413")?.price;}}).catch(error => {console.error('Hubo un problema con la petición:', error);});}/* ===== Efecto de nieve ===== */function generarNieve(){const copos = "❄❅❆•";const cantidad = 35;for(let i=0;i<cantidad;i++){const copo = document.createElement("span");copo.className = "nieve";copo.textContent = copos[Math.floor(Math.random()*copos.length)];const tam = 10 + Math.random()*18;copo.style.left = Math.random()*100 + "vw";copo.style.fontSize = tam + "px";copo.style.opacity = 0.4 + Math.random()*0.6;copo.style.setProperty("--deriva", (Math.random()*80-40)+"px");const duracion = 8 + Math.random()*10;copo.style.animationDuration = duracion + "s";copo.style.animationDelay = (Math.random()*duracion) + "s";document.body.appendChild(copo);}}generarNieve();
    })}
