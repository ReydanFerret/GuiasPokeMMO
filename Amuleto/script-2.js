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
	new Gym("gk1", "Kanto", "Pewter", "Brock", 8632),
	new Gym("gk2", "Kanto", "Cerulean", "Misty", 8736),
	new Gym("gk3", "Kanto", "Vermillion", "Lt. Surge", 8840),
	new Gym("gk4", "Kanto", "Celadon", "Erika", 8944),
	new Gym("gk5", "Kanto", "Fuchsia", "Koga", 9048),
	new Gym("gk6", "Kanto", "Saffron", "Sabrina", 9152),
	new Gym("gk7", "Kanto", "Cinnabar", "Blaine", 9256),

	new Gym("gh1", "Hoenn", "Rustboro", "Roxane", 8632),
	new Gym("gh2", "Hoenn", "Dewford", "Brawly", 8736),
	new Gym("gh3", "Hoenn", "Mauville", "Wattson", 8840),
	new Gym("gh4", "Hoenn", "Lavaridge", "Flannery", 8944),
	new Gym("gh5", "Hoenn", "Petalburg", "Norman", 9048),
	new Gym("gh6", "Hoenn", "Fortree", "Winona", 9152),
	new Gym("gh7", "Hoenn", "Mossdeep", "Liza & Tate", 9256),
	new Gym("gh8", "Hoenn", "Sootopolis", "Juan", 9360),

	new Gym("gs1", "Sinnoh", "Oreburgh", "Roark", 8632),
	new Gym("gs2", "Sinnoh", "Eterna", "Gardenia", 8736),
	new Gym("gs3", "Sinnoh", "Hearthome", "Fantina", 8840),
	new Gym("gs4", "Sinnoh", "Veilstone", "Maylene", 8944),
	new Gym("gs5", "Sinnoh", "Pastoria", "Crasher Wake", 9048),
	new Gym("gs6", "Sinnoh", "Canalave", "Byron", 9152),
	new Gym("gs7", "Sinnoh", "Snowpoint", "Candice", 9256),
	new Gym("gs8", "Sinnoh", "Sunyshore", "Volkner", 9360),

	new Gym("gu1f", "Teselia", "Striation", "Chili", 8632), // Fire
	new Gym("gu1g", "Teselia", "Striation", "Cilian", 8632), // Grass
	new Gym("gu1w", "Teselia", "Striation", "Cress", 8632), // Water
	new Gym("gu2", "Teselia", "Nacrene", "Lenora", 8736),
	new Gym("gu3", "Teselia", "Castelia", "Burgh", 8840),
	new Gym("gu4", "Teselia", "Nimbasa", "Elesa", 8944),
	new Gym("gu5", "Teselia", "Driftveil", "Clay", 9048),
	new Gym("gu6", "Teselia", "Mistralton", "Skyla", 9152),
	new Gym("gu7", "Teselia", "Icirrus", "Brycen", 9256),
	new Gym("gu8", "Teselia", "Opelucid", "Iris", 9360),

	new Gym("gj1", "Johto", "Violet City", "Falkner", 8632), // Fire
	new Gym("gj2", "Johto", "Azalea Town", "Bugsy", 8736),
	new Gym("gj3", "Johto", "Goldenrod City", "Whitney", 8840),
	new Gym("gj4", "Johto", "Ecruteak City", "Morty", 8944),
	new Gym("gj5", "Johto", "Cianwood City", "Chuck", 9048),
	new Gym("gj6", "Johto", "Olivine City", "Jasmine", 9152),
	new Gym("gj7", "Johto", "Mahogany Town", "Pryce", 9256),
	new Gym("gj8", "Johto", "Blackthorn City", "Clair", 9360),
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
	new Trainer("tu1", "Teselia", "Route 13 (Undella)", "Socialite Marian", 5400),
	new Trainer("tu2", "Teselia", "Route 13 (Undella)", "Gentleman Yan", 5400),
	new Trainer("tu3", "Teselia", "Route 9 (Mall)", "Rich Boy Manuel", 4080),
	new Trainer("tu4", "Teselia", "Route 9 (Mall)", "Lady Isabel", 4080),
	new Trainer("tu5", "Teselia", "Castelia", "Morimoto", 15660),
	new Trainer("tu6", "Teselia", "Undella", "Cynthia", 16560),
	new Trainer("ts1", "Sinnoh", "Route 214", "PI Carlos", 6000),
	new Trainer("ts2", "Sinnoh", "Route 210", "Belle & Pa", 5264),
	new Trainer("tj1", "Johto", "Mt. Silver", "Red", 110400),
	new Trainer("tj2", "Johto", "Lighthouse (Olivine)", "Gentleman Alfred", 4300),
	new Trainer("tj3", "Johto", "Route 38 (Ecruteak)", "Gentleman Milton", 4300)
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
]


/* ===== Generación de tablas ===== */

let regions = [];
function add_sub_table(region, name) {
	let div = document.querySelector(`#${name}s`)
	let header = document.createElement("h3");
	header.innerHTML = region;
	div.appendChild(header);

	let table = document.createElement("table");
	table.setAttribute("id",`${region.toLowerCase()}-${name}s`)
	table.classList.add("table","table-sm","table-fixed",`${name}-table`)
	if(name == "trainer") {
		table.innerHTML="<tr><th></th><th>Región</th><th>Entrenador</th><th>Ganancia Base</th></tr>";
	} else if (name == "gym") {
		table.innerHTML="<tr><th></th><th>Ciudad</th><th>Líder</th><th>Ganancia Base</th></tr>";
	}
	regions.push(name+region);
	div.appendChild(table);
}

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
eliteFourTable.setAttribute("id","elite-four-table")
eliteFourTable.classList.add("table","table-sm","table-fixed","gym-table")
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
	new Item("Amulet Coin", "5223"),
	new Item("Riches Charm 75%", "1412"),
	new Item("Riches Charm 100%", "1413"),
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

	let donator = ((document.getElementById("donator").checked) ? 1.05 : 1)

	let total = (gymTotal+trainerTotal+eliteFourTotal)*donator;
	let amuletCoinTotal = total*1.5-document.getElementById('amulet-coin-in').value;
	let riches75Total =	total*1.75-document.getElementById('riches-75-in').value;
	let riches100Total = total*2.0-document.getElementById('riches-100-in').value;

	let noCharm = document.querySelector('#no-charm');
	let amuletCoin = document.querySelector('#amulet-coin');
	let riches75 = document.querySelector('#riches-75');
	let riches100 = document.querySelector('#riches-100');

	noCharm.textContent = 'Sin encanto: ' + currencyFormat(total);
	amuletCoin.textContent = 'Moneda Amuleto: ' + currencyFormat(amuletCoinTotal);
	riches75.textContent = 'Riquezas 75%: ' + currencyFormat(riches75Total);
	riches100.textContent = 'Riquezas 100%: ' + currencyFormat(riches100Total);

	textToLink();
};

function updateGymCount() {// Get the parent element
    var section = document.getElementById('gyms');
    var checkboxes = section.querySelectorAll('input[type="checkbox"]');
    var headingBeforeSection = section.previousElementSibling;


		var checkedCount = 0;
    checkboxes.forEach(function(checkbox) {
        if (checkbox.checked) {
            checkedCount++;
        }
    });

		if(checkedCount==0) {
			headingBeforeSection.textContent = "Gimnasios";
		} else {
			headingBeforeSection.textContent = "Gimnasios [" + checkedCount + "]";
		}
}
function updateEliteFourCount() {
	var section = document.getElementById('elite-four');
	var checkboxes = section.querySelectorAll('input[type="checkbox"]');
	var headingBeforeSection = section.previousElementSibling;


	var checkedCount = 0;
	checkboxes.forEach(function(checkbox) {
			if (checkbox.checked) {
					checkedCount++;
			}
	});

	if(checkedCount==0) {
		headingBeforeSection.textContent = "Alto Mando";
	} else {
		headingBeforeSection.textContent = "Alto Mando [" + checkedCount + "]";
	}

}
function updateTrainerCount() {
	var section = document.getElementById('trainers');
	var checkboxes = section.querySelectorAll('input[type="checkbox"]');
	var headingBeforeSection = section.previousElementSibling;


	var checkedCount = 0;
	checkboxes.forEach(function(checkbox) {
			if (checkbox.checked) {
					checkedCount++;
			}
	});

	if(checkedCount==0) {
		headingBeforeSection.textContent = "Entrenadores";
	} else {
		headingBeforeSection.textContent = "Entrenadores [" + checkedCount + "]";
	}
}
document.addEventListener("DOMContentLoaded", function(event) {
	//load url params
	const valsParam = getParameterByName("vals");
	let vals = [];
	if(valsParam) {
	vals = valsParam.split(",");
		vals.forEach((k,i) => {
			document.getElementById(k).checked=true;
		})
	}

	const checkedBoxes = document.querySelectorAll('input[type=checkbox]:checked');
	var checkedBoxIDs = [];
	checkedBoxes.forEach((k,i)=> {
		checkedBoxIDs.push(k.id);
	})
	if(checkedBoxes.length!=0){
		updateTotal();
		updateGymCount();
		updateTrainerCount();
		updateEliteFourCount();
	}

	document.querySelector('#gyms')
	.addEventListener('change', () => {
		updateTotal();
		updateGymCount();
	});
	document.querySelector('#trainers')
	.addEventListener('change', () => {
		updateTotal();
		updateTrainerCount();
	});
	document.querySelector('#elite-four')
	.addEventListener('change', () => {
		updateTotal();
		updateEliteFourCount();
	});
	document.querySelector('#charm-form')
	.addEventListener('input', () => {
		updateTotal();
	});

	getItemPrices(items);
	//5223 - amulet coin
	//1412 - riches charm 75%
	//1413 - riches charm 100%

});

function textToLink() {
	document.querySelector("#link").value = createURL();
}

function createURL() {
	const checkedBoxes = document.querySelectorAll('input[type=checkbox]:checked');
	let checkedBoxIDs = [];
	checkedBoxes.forEach((k,i)=> {
		checkedBoxIDs.push(k.id);
	});

	let idstring = checkedBoxIDs.join(",");
	idstring = idstring.replace("donator,","");
	idstring = idstring.replace("donator","");

	let s = window.location.origin+window.location.pathname+"?vals="+idstring;

	return s;
}

function getParameterByName(name, url = window.location.href) {
	name = name.replace(/[\[\]]/g, '\\$&');
	var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
		results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function getItemPrices(items){
	let itemsWithPrices = [];

	fetch('https://apis.fiereu.de/pokemmoprices/v1/items')
	  .then(response => {
	    if (!response.ok) {
	      throw new Error('Network response was not ok');
	    }
	    return response.json(); // Parse the JSON response
	  })
	  .then(data => {
			for (let item of items) {
				let searchId = item.id;
				let foundItem = null;
				let itemPriceArray = data;
				for (let j = 0; j < itemPriceArray.length; j++) {
				  if (itemPriceArray[j].item_id == searchId) {
				    foundItem = itemPriceArray[j];
				    break;
				  }
				}
				if (foundItem) {
					let price = foundItem.price;
					item.price = price;
					itemsWithPrices.push(item);
				} else {
				  console.log('Objeto no encontrado');
				}

			}

				if (itemsWithPrices.length === items.length) {
					document.getElementById('amulet-coin-in').value = itemsWithPrices.find(item => item.id === "5223")?.price;
					document.getElementById('riches-75-in').value = itemsWithPrices.find(item => item.id === "1412")?.price;
					document.getElementById('riches-100-in').value = itemsWithPrices.find(item => item.id === "1413")?.price;
				}
	  })
	  .catch(error => {
	    console.error('Hubo un problema con la petición:', error);
	  });
}

/* ===== Efecto de nieve ===== */
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
