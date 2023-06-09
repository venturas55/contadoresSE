/* window.onload = function () {
    let nif2 = document.getElementById('nif').value;
    let lat = document.getElementById('lat').value;
    let lng = document.getElementById('lng').value;
    let tipo = document.getElementById('tipo').value;
    //console.log(lat);
    //console.log(lng);
    let caracteristica = document.getElementById("caracteristica").value;
    let apariencia = document.getElementById("apariencia").value;
    let baliza = {
        nif,
        apariencia,
        caracteristica,
        tipo,
        lat, lng
    };
    //let coordenadas = setMarkerLatLng(lat, lng);
    //console.log(coordenadas);

}; */
let centerLatLng = centrar();
//console.log(centerLatLng);
fetchData().then((res) => { initMapa(res) });

if (lat.value != "" && lng.value !="") {
    //console.log("es baliza");
    map.panTo(setMarkerLatLng(lat.value,lng.value));

} else {
    //console.log("NO es baliza");
}


