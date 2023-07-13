// LE BE estribor LB babor BE
// CARDINAL CN CS CE CO
// ESPECIAL ME
// FARO FA
//let myurl = 'http://localhost:4000';
let myurl = 'http://adriandeharo.es:4000';

//FUNCION PARA CERRAR MODALES
function cierraModal() {
    var el = document.getElementsByClassName("modal");
    for (var i = 0; i < el.length; i++) {
        el[i].style.display = "none";
    }
    passcheck = "";
}
function cambiarUsuario() {
    var passcheck = document.getElementById("contrasenaConfirmacion").value;
    //TODO: verificar el pass con la base de datos
}

//FUNCION PARA CONFIGURAR LA VARIABLE CON LA QUE SE CENTRARÁ EL MAPA DE LA API DE GOOGLE, COGIENDO EL CENTRO DE LA PROPIA URL
function centrar() {
    let centerLatLng = {};
    const url = window.location.href.split('/');
    //console.log(url[url.length-1]);

    switch (url[url.length - 1]) {
        case 'valencia':
            centerLatLng = {
                lat: 39.438,
                lng: -0.3172
            };
            presetZoom = 14;
            break;
        case 'sagunto':
            centerLatLng = {
                lat: 39.644,
                lng: -0.2142
            };
            presetZoom = 15;
            break;
        case 'gandia':
            centerLatLng = {
                lat: 38.995,
                lng: -0.15202
            };
            presetZoom = 16;
            break;
        default:
            centerLatLng = setMarkerLatLng(lat.value, lng.value);
            presetZoom = 18;
    }

    // console.log(centerLatLng);
    return centerLatLng;
}

//UN FETCH que se guarda en la variable 'balizas'
async function fetchData() {
    try {
        var apiURL = myurl + "/api/balizas";
        return await fetch(apiURL).then(res => res.json());
        /* .then(response => {
            var data = response;
            //balizasprueba = JSON.stringify(response);
            //console.log(balizasprueba);
            return data;
            //initMap(data);
        }); */
    } catch (err) {
        console.log(err);
    }


}
//FIN FETCH


//FUNCION PARA TRADUCIR COORDENADAS. DEVUELVE UN OBJETO GOOGLE FORMAT CON LAS COORDENADAS
function setMarkerLatLng(lat, lng) {
    //console.log(lat + " " + lng)
    var lat2 = 0;
    var lng2 = 0;
    if (lat != null && lat.includes("º")) {
        lat = lat.replaceAll("'", "´"); //quito espacios
        lat = lat.replaceAll("´", "´");
        lat = lat.replaceAll("'", "´"); // y reemplazo la coma ' por ´
        lat = lat.replaceAll("°", "º");

        var utmarraylat = lat.split("º"); //separo grados y minutos
        //console.log(utmarraylat[0] + " - " + utmarraylat[1]);
        //(utmarraylat[0] son grados y  utmarraylat[1] minutos
        utmarraylat[1] = utmarraylat[1].replace(",", "."); //DE LOS MINUTOS sustituyo comas por PUNTOS
        var minutoslatVector = utmarraylat[1].split("."); //de los minutos separo en las PUNTOS
        //console.log(minutoslatVector[0] + " - " + minutoslatVector[1]);
        var minutoslatEntero = parseFloat(minutoslatVector[0]); //convierto a decimal (la separacion ha de ser un PUNTO)
        if (minutoslatVector[1].includes("´")) {
            var minutoslat = minutoslatVector[1].split("´")
        } else {
            var minutoslat = minutoslatVector[1].split(" ")
        }
        //console.log(minutoslat[0] + " - " + minutoslat[1]);
        var minutoslatDecimal = parseFloat(minutoslat[0]);
        lat2 = parseFloat(utmarraylat[0]) + (minutoslatEntero + minutoslatDecimal / 1000) / 60;
        //console.log(minutoslatVector);
        if (minutoslat[1].trim() == 'N')
            lat2 = 1 * lat2.toFixed(5);
        else if (minutoslat[1].trim() == 'S')
            lat2 = -1 * lat2.toFixed(5);
        //console.log(lat2);
    }

    if (lng != null && lng.includes("º")) {
        lng = lng.replaceAll("'", "´");
        lng = lng.replaceAll("'", "´");
        lng = lng.replaceAll("°", "º");
        var utmarraylng = lng.split("º"); //separo grados y minutos
        //console.log(utmarraylng[0] + " - " + utmarraylng[1]);
        //(utmarraylng[0] son grados y  utmarraylng[1] minutos
        utmarraylng[1] = utmarraylng[1].replace(",", "."); //DE LOS MINUTOS sustituyo comas por PUNTOS
        var minutoslngVector = utmarraylng[1].split("."); //de los minutos separo en las PUNTOS
        //console.log(minutoslngVector[0] + " - " + minutoslngVector[1]);
        var minutoslngEntero = parseFloat(minutoslngVector[0]); //convierto a decimal (la separacion ha de ser un PUNTO)

        if (minutoslngVector[1].includes("´")) {
            var minutoslng = minutoslngVector[1].split("´")
        } else {
            var minutoslng = minutoslngVector[1].split(" ")
        }


        //console.log(minutoslng[0] + " - " + minutoslng[1]);
        var minutoslngDecimal = parseFloat(minutoslng[0]);
        lng2 = parseFloat(utmarraylng[0]) + (minutoslngEntero + minutoslngDecimal / 1000) / 60;
        if (minutoslng[1].trim() == 'E')
            lng2 = 1 * lng2.toFixed(5);
        else if (minutoslng[1].trim() == 'W')
            lng2 = -1 * lng2.toFixed(5);
        //console.log(lng2);
    }
    return {
        'lat': lat2,
        'lng': lng2
    };
}

//FUNCION QUE LE PASA UN OBJETO BALIZA Y LE DEVUELVE UNA LETRA QUE REPRESENTA EL COLOR/TIPO
function getTipo(item) {
    //var balizaPrueba="25620";
    var color = item.apariencia.toUpperCase().replaceAll(" ", "");
    color = color.charAt(color.length - 1);

    var caracteristica = item.caracteristica.toLowerCase().replaceAll(" ", "").replaceAll(".", "").replaceAll(",", "").replaceAll("+", "");
    var tipo = item.tipo.toLowerCase();
    item.cambio = false;

    if (tipo.includes("faro")) {
        item.cambio = true;
        color = "F";

    } else if (tipo.includes("semaforo")) {
        color = "S";
        item.cambio = true;
    } else if (tipo.includes("peligro")) {
        color = "PA";
        item.cambio = true;
    } else if (tipo.includes("navegable")) {
        color = "AN";
        item.cambio = true;
    } else if (tipo.includes(" odas ") || tipo.includes(" sado ")) {
        color = "ODAS";
        item.cambio = true;
    } else {
        switch (color) {
            case 'R':
                item.cambio = true;
                color = "R";
                break;
            case 'G':
            case 'V':
                item.cambio = true;
                color = "V";
                break;
            case 'B':
            case 'W':
                item.cambio = true;
                color = "B";
                break;
            case 'A':
            case 'Y':
                item.cambio = true;
                color = "A";
                break;

        }
    }
    //Si tiene una de las siguientes caracteristicas siendo Blanca... es muy probable que sea una cardinal.
    if (caracteristica == "l025oc025" && color == "B") {
        color = "CN";
        item.cambio = true;
    } else if ((caracteristica == "[(l025oc025)x2]l025oc375" || caracteristica == "[(l03oc08)x2]l03oc25") && color == "B") {
        color = "CE";
        item.cambio = true;
    } else if (caracteristica == "[(l025oc025)x6]l2oc5" && color == "B") {
        color = "CS";
        item.cambio = true;
    } else if (caracteristica == "[(l025oc025)x5]l025oc375" && color == "B") {
        color = "CO";
        item.cambio = true;
    }

    if (!item.cambio) {
        //IMPRIMO ERRORES
        color = "B";
        //console.log(item);
    }
    /*  if (item.nif==balizaPrueba)
            console.log(color); */

    return color;
}

//FUNCION PARA INICIAR EL MAPA
function initMapa(balizas) {
    //console.log(balizas);
    const map = new google.maps.Map(document.getElementById("myMap"), {
        zoom: presetZoom,
        center: centerLatLng,
    });


    const markers = Promise.all(balizas.map(async item => {
        const marker = new google.maps.Marker({
            position: setMarkerLatLng(item.latitud, item.longitud),
            label: {
                text: item.nif.toString(),
                className: 'etiquetaGoogle'
            },
            title: item.tipo,
            icon: {
                url: myurl + '/img/icon/' + getTipo(item) + '.png',
                scaledSize: {
                    width: 30,
                    height: 60
                }
            },
            map: map,
        });

        /* PARA USAR UNA VENTANA */
        /*      const contentString =
                 '<div id="content">INFO' +
                 "<div>" +
                 '<a href="/aton/plantilla/' + item.nif.toString() + '">' + item.nif.toString() + "</a> " +
                 "</div>" +
                 "</div>";
     
             const infowindow = new google.maps.InfoWindow({
                 content: contentString,
                 ariaLabel: "AtoN",
             }); */
        /* FIN USAR  VENTANA */

        // markers can only be keyboard focusable when they have click listeners
        // open info window when marker is clicked
        marker.addListener("click", () => {
            //console.log(marker.label);
            location.href = '/aton/plantilla/' + marker.label.text;
        });


        marker.addListener("click", () => {
            infowindow.open({
                anchor: marker,
                map,
            });
        });

        return await marker;
    }));
}