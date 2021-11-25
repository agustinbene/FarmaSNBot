

var Geolocalizacion = navigator.geolocation || (window.google && google.gears && google.gears.factory.create('beta.geolocation'));
if (Geolocalizacion) Geolocalizacion.getCurrentPosition(MuestraLocalizacion, Excepciones);
var userLat,userLon=0;
var flagGPS=0;
function MuestraLocalizacion(posicion) {
  //alert(posicion.coords.latitude);
  //alert(posicion.coords.longitude);
  //alert(posicion.coords.accuracy);
  iconFeature = new ol.Feature({
    geometry: new ol.geom.Point(
      ol.proj.transform(
        [posicion.coords.longitude, posicion.coords.latitude],
        "EPSG:4326",
        "EPSG:3857"
      )
    ),
    name: "Mi ubicacion",
  });
  iconFeatures.push(iconFeature);
  userLon=posicion.coords.longitude;
  userLat= posicion.coords.latitude;
  //console.log(posicion.coords.latitude);
  //console.log(posicion.coords.longitude);
  flagGPS=1;
  asd();
}

function Excepciones(error) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      //alert('Activa permisos de geolocalizacion');
      asd();
      break;
    case error.POSITION_UNAVAILABLE:
      //alert('Activa localizacion por GPS o Redes .');
      asd();
      break;
    default:
      //alert('ERROR: ' + error.code);
      asd();
  }
}

function calcDist(latUser, lonUser, latFarma, lonFarma) {
  // Calcular Distancia

  var degtorad = 0.01745329;
  var radtodeg = 57.29577951;

  //var lat1 = parseFloat(-33.345603); //Ubicacion usuario
  //var long1 = parseFloat(-60.196684);

  var lat1 = latUser;
  var long1 = lonUser;

  var kmMin = 999;

  var lat2 = parseFloat(latFarma);
  var long2 = parseFloat(lonFarma);
  var dlong = (long1 - long2);
  var dvalue = (Math.sin(lat1 * degtorad) * Math.sin(lat2 * degtorad)) + (Math.cos(lat1 * degtorad) * Math.cos(lat2 * degtorad) * Math.cos(dlong * degtorad));
  var dd = Math.acos(dvalue) * radtodeg;
  var km = (dd * 111.302);

  return km
}


var iconFeatures = [];
var fecha = new Date();
const data = {
  fecha: fecha.getFullYear() + "/" + (fecha.getMonth() + 1) + "/" + fecha.getDate()
};


function asd() {
 
  const url = "https://farmasn.abenegas.com.ar/consulta.php";
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },

    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .then(data => {
      console.log(data);

      var fecha = new Date();
      var keyboard = fecha.getDate() + '/' + parseInt(fecha.getMonth() + 1) + '/' + fecha.getFullYear() + " 8:00 AM ";
      keyboard += " al ";
      keyboard += (fecha.getDate() + 1) + '/' + parseInt(fecha.getMonth() + 1) + '/' + fecha.getFullYear() + " 8:00 AM";


      console.log(keyboard);
      turno.innerHTML = `
        <div class="my-1 text-black alert alert-dark" role="alert">${keyboard}</div>
                        `
      var len=data.length;
      if(flagGPS==1){
      var farmas=[];
      for (let i = 0; i < len; i++) {
      farma={
          "dist":calcDist(userLat,userLon,data[i].lat,data[i].lon),
          "index":i,
          "nombre":data[i].farmacia
      }
      farmas.push(farma);
      }
      //console.log(farmas);

      var farmasOrdenadas = farmas.sort((c1, c2) => (c1.dist > c2.dist) ? 1 : (c1.dist < c2.dist) ? -1 : 0);
      console.log(farmasOrdenadas);
    }
      for (var i = 0; i < len; i++) {
        var index;

        if (flagGPS==1){
          index=farmasOrdenadas[i].index;
         //console.log(data[i].farmacia);
        }else{
          index=i;
          console.log(index);
        }

        iconFeature = new ol.Feature({
          geometry: new ol.geom.Point(
            ol.proj.transform(
              [data[index].lon, data[index].lat],
              "EPSG:4326",
              "EPSG:3857"
            )
          ),
          name: data[index].farmacia,
        });
        iconFeatures.push(iconFeature);

        var maps = "https://www.google.com.ar/maps/place/" + data[index].direccion.replace(/\s+/g, '+') + ",+San+Nicolas+de+Los+Arroyos,+Provincia+de+Buenos+Aire)";
        if (flagGPS==1){
        respuesta.innerHTML += `
            <div class="card my-1 card text-white bg-secondary mb-1">
                <h5 class="card-header">${data[index].farmacia}</h5>
                <div class="card-body">
                  <div class="row">
                  <div class="col-9">
                    <h5 class="card-title">Direccion: ${data[index].direccion}</h5>
                    <p class="card-text">Tel: ${data[index].tel}
                   <br>
                    Distancia: ${farmasOrdenadas[i].dist.toFixed(2)} km
                    </p>
                    </div>
                    <div class="col-3">
                    <a href="${maps}" target="_blank" class="btn btn-primary">Maps</a>
                    </div>
                    </div>
                </div>
            </div>
            `}else{
              respuesta.innerHTML += `
              <div class="card my-1 card text-white bg-secondary mb-1">
                  <h5 class="card-header">${data[i].farmacia}</h5>
                  <div class="card-body">
                    <div class="row">
                      <div class="col-6">
                        <h5 class="card-title">Direccion: ${data[i].direccion}</h5>
                        <p class="card-text">Tel: ${data[i].tel}                  </p>
                      </div>
                      <div class="col-6">
                        <a href="${maps}" target="_blank" class="btn btn-primary">Maps</a>
                      </div>
                    </div>
                  </div>
              </div>
              `
            }
      }
      mapa();
    })

  function mapa() {
    
    var vectorSource = new ol.source.Vector({
      features: iconFeatures,
    });

    var map = new ol.Map({
      target: "map",
      layers: [
        new ol.layer.Tile({
          source: new ol.source.OSM(),
        }),
      ],
      view: new ol.View({
        center: ol.proj.fromLonLat([flagGPS==1?userLon:-60.2045969, flagGPS==1?userLat:-33.3418978]),
        zoom: flagGPS==1?14:12,
      }),
    });

    var iconStyle = new ol.style.Style({
      image: new ol.style.Circle({
        radius: 9,
        stroke: new ol.style.Stroke({
          color: '#555555'
        }),
        fill: new ol.style.Fill({
          color: '#2b8019'
        })
      })
    });
    var labelStyle = new ol.style.Style({
      text: new ol.style.Text({
        font: '12px Calibri,sans-serif',
        overflow: true,
        fill: new ol.style.Fill({
          color: '#000'
        }),
        stroke: new ol.style.Stroke({
          color: '#fff',
          width: 3
        })
      })
    });
    var style = [iconStyle, labelStyle];

    vectorLayer = new ol.layer.Vector({
      source: vectorSource,
      style: function (feature) {
        labelStyle.getText().setText(feature.get('name'));
        return style;
      }
    });

    map.addLayer(vectorLayer);
  }

/*
  function handler(e) {
    //alert(e.target.value);
    var hor = new Date();
    var parts = e.target.value.split('/');
    var fecha = new Date(parts[2], parts[0] - 1, parts[1]);
    var hora = hor.getHours();
    var dia = fecha.getDate();

    if (hora >= 0 && hora < 8) {
      dia--;
    }

    let date = fecha.getFullYear() + "/" + (fecha.getMonth() + 1) + "/" + dia;

    const data = { fecha: date };

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    })
      .then(res => res.json())
      .then(data => {
        console.log(data);



        var fecha = new Date();
        var opts;
        var keyboard = e.target.value + " 8:00 AM ";
        keyboard += " al ";
        keyboard += e.target.value + " 8:00 AM";


        console.log(keyboard);
        turno.innerHTML = `
        <div class="my-3 text-light alert alert-dark" role="alert">${keyboard}</div>
                        `
        respuesta.innerHTML = '';

        vectorLayer.clear();

        for (let i = 0; i < data.length; i++) {

          iconFeature = new ol.Feature({
            geometry: new ol.geom.Point(
              ol.proj.transform(
                [data[i].lon, data[i].lat],
                "EPSG:4326",
                "EPSG:3857"
              )
            ),
            name: data[i].farmacia,
          });
          iconFeatures.push(iconFeature);

          var maps = "https://www.google.com.ar/maps/place/" + data[i].direccion.replace(/\s+/g, '+') + ",+San+NicolÃƒÆ’Ã‚Â¡s+de+Los+Arroyos,+Provincia+de+Buenos+Aire)";

          respuesta.innerHTML += `
            <div class="card my-3 card text-white bg-secondary mb-3">
                <h5 class="card-header">${data[i].farmacia}</h5>
                <div class="card-body">
                    <h5 class="card-title">Direccion: ${data[i].direccion}</h5>
                    <p class="card-text">Tel: ${data[i].tel}</p>
                    <a href="${maps}" target="_blank" class="btn btn-primary">Maps</a>
                    <div class="iframe-rwd">
                    <iframe width="425" height="350" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d8142.384711880329!2d-60.24371578123225!3d-33.291342279830566!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95b7685eb1358067%3A0x46fce94abcc13acc!2sParque%20Rafael%20De%20Aguiar!5e1!3m2!1ses-419!2sar!4v1637250693635!5m2!1ses-419!2sar"></iframe><br /><small><a href="https://maps.google.com/maps?f=q&amp;source=embed&amp;hl=en&amp;geocode=&amp;q=Seattle,+WA&amp;aq=0&amp;oq=seattle&amp;sll=37.822293,-85.76824&amp;sspn=6.628688,16.907959&amp;t=h&amp;ie=UTF8&amp;hq=&amp;hnear=Seattle,+King,+Washington&amp;z=11&amp;ll=47.60621,-122.332071" style="color:#0000FF;text-align:left">View Larger Map</a></small>
                </div>
                </div>
            </div>
            `
        }
      })



  }*/

}








