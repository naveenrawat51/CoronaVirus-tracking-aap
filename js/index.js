var date = new Date();
var currentDate = (date.getMonth() + 1) + '/' + ((date.getDate() > 9) ? date.getDate() : ('0' + date.getDate())) + '/' + date.getFullYear().toString().substring(2);
var yesterdayDate = (date.getMonth() + 1) + '/' + ((date.getDate() > 9) ? (date.getDate()-1) : ('0' + (date.getDate() -1))) + '/' + date.getFullYear().toString().substring(2);
console.log('dates: ', currentDate, yesterdayDate);
import "https://api.mapbox.com/mapbox-gl-js/v1.8.1/mapbox-gl.js";

const mapBoxToken =
  "pk.eyJ1IjoibmF2ZWVucmF3YXQ1MSIsImEiOiJjazhobGJ6OG0wMW9tM2ZwZDNlNjcwcGdhIn0.qlPulX20H6hBexh0fKs7bA";

var allCountryData = [];
mapboxgl.accessToken = mapBoxToken;
var map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/dark-v10",
  zoom: 1.5,
  center: [78.8718, 21.7679]
});
var size = 300;
// implementation of CustomLayerInterface to draw a pulsing dot icon on the map
// see https://docs.mapbox.com/mapbox-gl-js/api/#customlayerinterface for more info
var pulsingDot = {
  width: size,
  height: size,
  data: new Uint8Array(size * size * 4),
   
  // get rendering context for the map canvas when layer is added to the map
  onAdd: function() {
  var canvas = document.createElement('canvas');
  canvas.width = this.width;
  canvas.height = this.height;
  this.context = canvas.getContext('2d');
  },
   
  // called once before every frame where the icon will be used
  render: function() {
  var duration = 1000;
  var t = (performance.now() % duration) / duration;
   
  var radius = (size / 2) * 0.3;
  var outerRadius = (size / 2) * 0.7 * t + radius;
  var context = this.context;
   
  // draw outer circle
  context.clearRect(0, 0, this.width, this.height);
  context.beginPath();
  context.arc(
  this.width / 2,
  this.height / 2,
  outerRadius,
  0,
  Math.PI * 2
  );
  context.fillStyle = 'rgba(255, 200, 200,' + (1 - t) + ')';
  context.fill();
   
  // draw inner circle
  context.beginPath();
  context.arc(
  this.width / 2,
  this.height / 2,
  radius,
  0,
  Math.PI * 2
  );
  context.fillStyle = 'rgba(255, 100, 100, 1)';
  context.strokeStyle = 'white';
  context.lineWidth = 2 + 4 * (1 - t);
  context.fill();
  context.stroke();
   
  // update this image's data with data from the canvas
  this.data = context.getImageData(
  0,
  0,
  this.width,
  this.height
  ).data;
   
  // continuously repaint the map, resulting in the smooth animation of the dot
  map.triggerRepaint();
   
  // return `true` to let the map know that the image was updated
  return true;
  }
  };

const proxyurl = "https://cors-anywhere.herokuapp.com/";
const api = "https://thevirustracker.com/timeline/map-data.json"

fetch("./js/placesData.json")
  .then(response => response.json())
  .then(places => {
      // FR- france
      console.log('places', places.data.filter( data => data.countryCode !== "FR"));
    fetch("http://localhost:3000/jokes/random")
      .then(response => response.json())
      .then(reports => {
        console.log(reports);

        const currentDateData = reports.data.filter( report => 
            report.date === currentDate.toString() || report.date === yesterdayDate.toString()
            );
        console.log('current Day Records: ', currentDateData)
        //  const popupData = [];
        currentDateData.forEach(report => {
            const currentPalce = places.data.find(place => place.countryCode === report.countrycode);

            if(currentPalce) {
            const currentReportData = {
                type: "Feature",
                properties: {
                  description:
                    `<strong>${currentPalce ? currentPalce.country : 'NO'}</strong>
                    <p> Cases: ${report.cases}</p>
                    <p>Deaths: ${report.deaths}</p>
                    <p>Recovered: ${report.recovered}</p>`,
                  icon: "theatre"
                },
                geometry: {
                  type: "Point",
                  coordinates: [currentPalce.longitude, currentPalce.latitude]
                }
              }
              allCountryData.push(currentReportData)
            }
          });
        console.log("allCountryData: ", allCountryData);
        map.on('load', function() {
          map.addImage('pulsing-dot', pulsingDot, { pixelRatio: 2 });
           
          map.addSource('points', {
          'type': 'geojson',
          'data': {
          'type': 'FeatureCollection',
          'features': [
          {
          'type': 'Feature',
          'geometry': {
          'type': 'Point',
          'coordinates': [78.8718, 21.7679]
          }
          }
          ]
          }
          });
          map.addLayer({
          'id': 'points',
          'type': 'symbol',
          'source': 'points',
          'layout': {
          'icon-image': 'pulsing-dot'
          }
          });
          });


      });
  });
