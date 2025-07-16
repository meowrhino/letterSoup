const sopa = document.getElementById("sopa");
const resultado = document.getElementById("resultado");
const TAM = 10;

let mouseIsDown = false;
let clickStart = null;
let startCell = null;

let direccionFija = null; // para bloquear la dirección en drag

let tablero = Array.from({ length: TAM }, () =>
  Array.from({ length: TAM }, () => null)
);

function rellenarHuecos() {
  for (let y = 0; y < TAM; y++) {
    for (let x = 0; x < TAM; x++) {
      if (!tablero[y][x]) {
        tablero[y][x] = String.fromCharCode(
          65 + Math.floor(Math.random() * 26)
        );
      }
    }
  }
}

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
    rellenarHuecos();
    renderTablero();
  });

function insertarPalabra(palabra) {
  const maxIntentos = 100;

  for (let intento = 0; intento < maxIntentos; intento++) {
    const horizontal = Math.random() < 0.5;
    const longitud = palabra.length;

    // Calcular posición de inicio según dirección
    const fila = Math.floor(
      Math.random() * (horizontal ? TAM : TAM - longitud + 1)
    );
    const columna = Math.floor(
      Math.random() * (horizontal ? TAM - longitud + 1 : TAM)
    );

    let puedeInsertarse = true;

    for (let i = 0; i < longitud; i++) {
      const y = horizontal ? fila : fila + i;
      const x = horizontal ? columna + i : columna;
      const letraExistente = tablero[y][x];

      if (letraExistente !== null && letraExistente !== palabra[i]) {
        puedeInsertarse = false;
        break;
      }
    }

    if (puedeInsertarse) {
      for (let i = 0; i < longitud; i++) {
        const y = horizontal ? fila : fila + i;
        const x = horizontal ? columna + i : columna;
        tablero[y][x] = palabra[i];
      }

      coordenadasPrimeraLetra[palabra] = {
        y: fila,
        x: columna,
        direccion: horizontal ? "H" : "V",
      };

      return;
    }
  }

  console.warn(`No se pudo insertar la palabra: ${palabra}`);
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

      // MOUSEDOWN (posible inicio de drag)
      celda.addEventListener("mousedown", (e) => {
        mouseIsDown = true;
        clickStart = { x: e.clientX, y: e.clientY };
        seleccion = [{ y, x, letra, celda }];
        seleccionManual = letra;
        direccionFija = null;
        celda.classList.add("seleccionada");
      });

      // MOUSEENTER (durante drag)
      celda.addEventListener("mouseenter", () => {
        if (!mouseIsDown) return;

        const yaSeleccionada = seleccion.find((s) => s.y === y && s.x === x);
        if (yaSeleccionada) return;

        const ultima = seleccion[seleccion.length - 1];
        const dx = x - ultima.x;
        const dy = y - ultima.y;

        // Definir dirección en la segunda celda
        if (!direccionFija && seleccion.length === 1) {
          if (dx !== 0 && dy === 0)
            direccionFija = { dx: Math.sign(dx), dy: 0 };
          else if (dy !== 0 && dx === 0)
            direccionFija = { dx: 0, dy: Math.sign(dy) };
          else return;
        }

        if (
          direccionFija &&
          Math.sign(dx) === direccionFija.dx &&
          Math.sign(dy) === direccionFija.dy
        ) {
          seleccion.push({ y, x, letra, celda });
          seleccionManual += letra;
          celda.classList.add("seleccionada");
        }
      });

      // CLICK (selección por clic individual, SIN interferencia con dragging)
      celda.addEventListener("click", (e) => {
        // 1) si venimos de un drag, ignoramos este click
        if (dragging) {
          dragging = false;
          return;
        }
        // 2) si es el primer click simple (ya añadida por mousedown), la dejamos
        if (
          seleccion.length === 1 &&
          seleccion[0].y === y &&
          seleccion[0].x === x
        ) {
          // sólo actualizamos la cadena manual por si la usas en UI
          seleccionManual = seleccion[0].letra;
          return;
        }

        const yaSeleccionada = seleccion.find((s) => s.y === y && s.x === x);
        if (yaSeleccionada) {
          // quitar selección si ya está clicada
          seleccion = seleccion.filter((s) => !(s.y === y && s.x === x));
          celda.classList.remove("seleccionada");
        } else {
          if (seleccion.length === 0) {
            direccionFija = null;
            seleccion.push({ y, x, letra, celda });
            celda.classList.add("seleccionada");
          } else {
            const ultima = seleccion[seleccion.length - 1];
            const dx = x - ultima.x;
            const dy = y - ultima.y;

            if (!direccionFija && seleccion.length === 1) {
              if (dx !== 0 && dy === 0)
                direccionFija = { dx: Math.sign(dx), dy: 0 };
              else if (dy !== 0 && dx === 0)
                direccionFija = { dx: 0, dy: Math.sign(dy) };
              else return;
            }

            if (
              direccionFija &&
              Math.sign(dx) === direccionFija.dx &&
              Math.sign(dy) === direccionFija.dy
            ) {
              seleccion.push({ y, x, letra, celda });
              celda.classList.add("seleccionada");
            }
          }
        }
        seleccionManual = seleccion.map((c) => c.letra).join("");
      });

      sopa.appendChild(celda);
    }
  }

  // MOUSEUP global: determinar si fue drag o solo clic
  document.addEventListener("mouseup", (e) => {
    mouseIsDown = false;

    if (clickStart) {
      const dx = Math.abs(e.clientX - clickStart.x);
      const dy = Math.abs(e.clientY - clickStart.y);
      dragging = dx > 5 || dy > 5; // esto solo sirve para diagnóstico si quieres
      clickStart = null;
    } else {
      dragging = false;
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

  // 🌟 NUEVO: desbloqueo seleccionando las 4 esquinas
  const esquinas = [
    { y: 0, x: 0 },
    { y: 0, x: TAM - 1 },
    { y: TAM - 1, x: 0 },
    { y: TAM - 1, x: TAM - 1 },
  ];

  const esquinasSeleccionadas = esquinas.every(({ y, x }) =>
    seleccion.some((c) => c.y == y && c.x == x)
  );

  if (esquinasSeleccionadas) {
    palabras.forEach(({ palabra, link }) => {
      if (!palabrasEncontradas.includes(palabra)) {
        palabrasEncontradas.push(palabra);
        mostrarLink(palabra, link);
        document.querySelectorAll(".celda").forEach((c) => {
          if (c.textContent === palabra[0]) {
            c.classList.add("encontrada");
          }
        });
      }
    });
    alert("🌈 Has desbloqueado todos los enlaces secretos!");
  } else {
    let encontrada = false;
    for (const { palabra: objetivo, link } of palabras) {
      if (
        !palabrasEncontradas.includes(objetivo) &&
        (palabra === objetivo || palabraInvertida === objetivo)
      ) {
        palabrasEncontradas.push(objetivo);
        mostrarLink(objetivo, link);
        seleccion.forEach((c) => c.celda.classList.add("encontrada"));
        // eliminar clase pista si se ha usado
        const primera = coordenadasPrimeraLetra[objetivo];
        if (primera) {
          const celda = document.querySelector(
            `.celda[data-pos="${primera.y}-${primera.x}"]`
          );
          if (celda) celda.classList.remove("pista");
        }
        encontrada = true;
        break;
      }
    }

    if (!encontrada) {
      seleccion.forEach((c) => c.celda.classList.add("error"));
      setTimeout(() => {
        seleccion.forEach((c) => c.celda.classList.remove("error"));
      }, 800);
    }
  }

  // Limpiar selección tras intentar validar
  seleccion = [];
  seleccionManual = "";
  direccionFija = null;
  document.querySelectorAll(".celda").forEach((c) => {
    if (!c.classList.contains("encontrada")) {
      c.classList.remove("seleccionada");
    }
  });
});
