const sopa = document.getElementById("sopa");
const resultado = document.getElementById("resultado");
const TAM = 10;

let direccionFija = null; // para bloquear la dirección en drag

let tablero = Array.from({ length: TAM }, () =>
  Array.from({ length: TAM }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26))
  )
);

let palabras = [];
let palabrasEncontradas = [];
let seleccion = [];
let dragging = false;
let seleccionManual = "";
let coordenadasPrimeraLetra = {}; // para pistas reales

// Cargar palabras desde JSON
fetch("palabras.json")
  .then((res) => res.json())
  .then((data) => {
    palabras = data.map((p) => ({
      palabra: p.palabra.toUpperCase(),
      link: p.link,
    }));

    palabras.forEach(({ palabra }) => insertarPalabra(palabra));
    renderTablero();
  });

function insertarPalabra(palabra) {
  const horizontal = Math.random() < 0.5;
  if (horizontal) {
    const fila = Math.floor(Math.random() * TAM);
    const inicio = Math.floor(Math.random() * (TAM - palabra.length));
    for (let i = 0; i < palabra.length; i++) {
      tablero[fila][inicio + i] = palabra[i];
    }
    coordenadasPrimeraLetra[palabra] = { y: fila, x: inicio };
  } else {
    const columna = Math.floor(Math.random() * TAM);
    const inicio = Math.floor(Math.random() * (TAM - palabra.length));
    for (let i = 0; i < palabra.length; i++) {
      tablero[inicio + i][columna] = palabra[i];
    }
    coordenadasPrimeraLetra[palabra] = { y: inicio, x: columna };
  }
}

function renderTablero() {
  sopa.innerHTML = "";
  sopa.style.gridTemplateColumns = `repeat(${TAM}, 2em)`;

  for (let y = 0; y < TAM; y++) {
    for (let x = 0; x < TAM; x++) {
      const letra = tablero[y][x];
      const celda = document.createElement("div");
      celda.classList.add("celda");
      celda.textContent = letra;
      celda.dataset.pos = `${y}-${x}`;
      celda.dataset.y = y;
      celda.dataset.x = x;
      celda.dataset.letra = letra;



      /*mousedrag*/
      
      celda.addEventListener("mousedown", () => {
        dragging = true;
        seleccion = [{ y, x, letra, celda }];
        seleccionManual = letra;
        celda.classList.add("seleccionada");
      });

      celda.addEventListener("mouseenter", () => {
        if (dragging) {
          seleccion.push({ y, x, letra, celda });
          seleccionManual += letra;
          celda.classList.add("seleccionada");
        }
      });

      celda.addEventListener("mouseup", () => {
        dragging = false;
        comprobarSeleccion();
      });



      /*mouse click*/

      celda.addEventListener("click", () => {
        if (!dragging) {
          const yaSeleccionada = seleccion.find((s) => s.y === y && s.x === x);
          if (!yaSeleccionada) {
            seleccion.push({ y, x, letra, celda });
            seleccionManual += letra;
            celda.classList.add("seleccionada");
          }
        }
      });

      sopa.appendChild(celda);
    }
  }

  document.addEventListener("mouseup", () => {
    if (dragging) {
      dragging = false;
      comprobarSeleccion();
    }
  });
}

function comprobarSeleccion() {
  const palabra = seleccion.map((c) => c.letra).join("");
  const palabraInvertida = palabra.split("").reverse().join("");

  for (const { palabra: objetivo, link } of palabras) {
    if (
      !palabrasEncontradas.includes(objetivo) &&
      (palabra === objetivo || palabraInvertida === objetivo)
    ) {
      palabrasEncontradas.push(objetivo);
      mostrarLink(objetivo, link);
      seleccion.forEach((c) => c.celda.classList.add("encontrada"));
      break;
    }
  }

  seleccion = [];
  seleccionManual = "";
  document
    .querySelectorAll(".celda")
    .forEach((c) => c.classList.remove("seleccionada"));
}

function mostrarLink(palabra, link) {
  const div = document.createElement("div");
  div.innerHTML = `<a href="${link}" target="_blank">${palabra}</a>`;
  resultado.appendChild(div);
}

document.getElementById("pista-btn").addEventListener("click", () => {
  for (const palabra of Object.keys(coordenadasPrimeraLetra)) {
    if (!palabrasEncontradas.includes(palabra)) {
      const { y, x } = coordenadasPrimeraLetra[palabra];
      const celda = document.querySelector(`.celda[data-pos="${y}-${x}"]`);
      if (celda) celda.classList.add("pista");
    }
  }
});

document.getElementById("validar-btn").addEventListener("click", () => {
  const palabra = seleccion.map((c) => c.letra).join("");
  const palabraInvertida = palabra.split("").reverse().join("");

  for (const { palabra: objetivo, link } of palabras) {
    if (
      !palabrasEncontradas.includes(objetivo) &&
      (palabra === objetivo || palabraInvertida === objetivo)
    ) {
      palabrasEncontradas.push(objetivo);
      mostrarLink(objetivo, link);
      seleccion.forEach((c) => c.celda.classList.add("encontrada"));
      break;
    }
  }

  // Limpiar selección tras intentar validar
  seleccion = [];
  seleccionManual = "";
  document
    .querySelectorAll(".celda")
    .forEach((c) => c.classList.remove("seleccionada"));
});
