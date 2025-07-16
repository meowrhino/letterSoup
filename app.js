const sopa = document.getElementById("sopa");
const TAM = 10;
let seleccion = "";
let objetivo = "";
let linkObjetivo = "";

// Generar tablero vacío
let tablero = Array.from({ length: TAM }, () =>
  Array.from({ length: TAM }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26)))
);

// Cargar palabra
fetch("palabras.json")
  .then(res => res.json())
  .then(data => {
    const { palabra, link } = data[0];
    objetivo = palabra.toUpperCase();
    linkObjetivo = link;

    // Insertar la palabra horizontalmente en una fila aleatoria
    const fila = Math.floor(Math.random() * TAM);
    const inicio = Math.floor(Math.random() * (TAM - objetivo.length));

    for (let i = 0; i < objetivo.length; i++) {
      tablero[fila][inicio + i] = objetivo[i];
    }

    renderTablero();
  });

function renderTablero() {
  sopa.innerHTML = "";
  for (let y = 0; y < TAM; y++) {
    for (let x = 0; x < TAM; x++) {
      const letra = tablero[y][x];
      const celda = document.createElement("div");
      celda.classList.add("celda");
      celda.textContent = letra;
      celda.dataset.pos = `${y}-${x}`;
      celda.addEventListener("click", () => seleccionarLetra(celda, letra));
      sopa.appendChild(celda);
    }
  }
}

function seleccionarLetra(celda, letra) {
  celda.classList.add("seleccionada");
  seleccion += letra;

  if (seleccion === objetivo) {
    alert(`¡Encontraste ${objetivo}!`);
    window.location.href = linkObjetivo;
  } else if (!objetivo.startsWith(seleccion)) {
    // Reset si te equivocas
    seleccion = "";
    document.querySelectorAll(".celda").forEach(c => c.classList.remove("seleccionada"));
  }
}