const sopa = document.getElementById("sopa");
const resultado = document.getElementById("resultado");
const TAM = 10;

let tablero = Array.from({ length: TAM }, () =>
  Array.from({ length: TAM }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26))
  )
);

let palabras = [];
let palabrasEncontradas = [];
let seleccion = [];
let dragging = false;

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
  } else {
    const columna = Math.floor(Math.random() * TAM);
    const inicio = Math.floor(Math.random() * (TAM - palabra.length));
    for (let i = 0; i < palabra.length; i++) {
      tablero[inicio + i][columna] = palabra[i];
    }
  }
}

function renderTablero() {
  sopa.innerHTML = "";

  // Setea columnas dinámicamente
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

      celda.addEventListener("mousedown", () => {
        dragging = true;
        seleccion = [{ y, x, letra }];
        celda.classList.add("seleccionada");
      });

      celda.addEventListener("mouseenter", () => {
        if (dragging) {
          seleccion.push({ y, x, letra });
          celda.classList.add("seleccionada");
        }
      });

      celda.addEventListener("mouseup", () => {
        dragging = false;
        comprobarSeleccion();
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
      break;
    }
  }

  // Reset selección
  seleccion = [];
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
  palabras.forEach(({ palabra }) => {
    const primeraLetra = palabra[0];
    for (let y = 0; y < TAM; y++) {
      for (let x = 0; x < TAM; x++) {
        const celda = document.querySelector(`.celda[data-pos="${y}-${x}"]`);
        if (
          celda &&
          celda.textContent === primeraLetra &&
          !celda.classList.contains("pista")
        ) {
          celda.classList.add("pista");
          return; // solo la primera coincidencia
        }
      }
    }
  });
});