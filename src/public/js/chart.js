
// Obtener una referencia al elemento canvas del DOM
const $graficaLecturas = document.querySelector("#graficaLecturas");
const $graficaConsumos = document.querySelector("#graficaConsumos");
// Las etiquetas son las que van en el eje X. 
const etiquetas = ["Enero", "Febrero", "Marzo", "Abril","Mayo","Junio","julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
// Podemos tener varios conjuntos de datos. Comencemos con uno
let datos = document.getElementById("datos");
let lecturasDOM = document.getElementsByClassName("lecturas");
let fechasDOM = document.getElementsByClassName("fechas");
let lecturas=[];
let consumos=[];
let meses=[];
//console.log(datos);
//comienza en uno para quitar el mes del año anterior
for (let i=1;i<lecturasDOM.length;i++) {
  lecturas.push(lecturasDOM[i].innerHTML);
  consumos.push(lecturasDOM[i].innerHTML-lecturasDOM[i-1].innerHTML);
}

for (let i=1;i<fechasDOM.length;i++) {
  let partes=fechasDOM[i].innerHTML.split("/");
  meses.push(etiquetas[parseInt( partes[1]-1)]);
}
console.log(meses);

//console.log(lecturas);


const datosLecturas = {
    label: "Lecturas del mes",
    data: lecturas, // La data es un arreglo que debe tener la misma cantidad de valores que la cantidad de etiquetas
    backgroundColor: 'rgba(54, 162, 235, 0.2)', // Color de fondo
    borderColor: 'rgba(54, 162, 235, 1)', // Color del borde
    borderWidth: 1,// Ancho del borde
    barThickness: 90,
};

const datosConsumos = {
  label: "Consumos del mes",
  data: consumos, // La data es un arreglo que debe tener la misma cantidad de valores que la cantidad de etiquetas
  backgroundColor: 'rgba(54, 162, 235, 0.2)', // Color de fondo
  borderColor: 'rgba(54, 162, 235, 1)', // Color del borde
  borderWidth: 1,// Ancho del borde
};

new Chart($graficaLecturas, {
    type: 'bar',// Tipo de gráfica
    data: {
        labels: meses,
        datasets: [
          datosLecturas,
            // Aquí más datos...
        ]
    },
    options: {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true
                }
            }],
        },
    }
});

new Chart($graficaConsumos, {
  type: 'bar',// Tipo de gráfica
  data: {
      labels: meses,
      datasets: [
        datosConsumos,
          // Aquí más datos...
      ]
  },
  options: {
      scales: {
          yAxes: [{
              ticks: {
                  beginAtZero: true
              }
          }],
      },
  }
});