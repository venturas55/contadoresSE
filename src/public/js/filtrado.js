
//FUNCION para filtrar
$(document).ready(function () {
    $("#myInput").on("keyup", function () {
        var value = $(this).val().toLowerCase();
        console.log(value);
        $("#listado .fila").filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
        });
    });
});

//FUNCION para comprobar si algun objeto del DOM es null
function isNull(campo) {
    return !(typeof campo !== 'undefined' && campo !== null);
}

//FUNCION SOLO PARA CONTAR FILAS EN VISTA 'balizas/list.hbs'
let inputBusqueda = document.getElementById("myInput");
if (!isNull(inputBusqueda))
    inputBusqueda.addEventListener("keyup", contar);

let inicial = document.getElementsByClassName("fila");

let suma = document.getElementById("suma");
if (!isNull(suma))
    suma.innerHTML = inicial.length;


async function contar() {
    //var numElem = document.getElementsByClassName("hidden").length;
    var numElem = await document.querySelectorAll('[style="display: none;"]');
    //console.log(numElem);
    document.getElementById("suma").innerHTML = (inicial.length - numElem.length);
}
