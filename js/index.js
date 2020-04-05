const mapBoxToken = "pk.eyJ1IjoibmF2ZWVucmF3YXQ1MSIsImEiOiJjazhobGJ6OG0wMW9tM2ZwZDNlNjcwcGdhIn0.qlPulX20H6hBexh0fKs7bA";
var allCountryData = [];
var date = new Date();
var currentDate =
  date.getMonth() +
  1 +
  "/" +
  (date.getDate() > 9 ? date.getDate() : "0" + date.getDate()) +
  "/" +
  date
    .getFullYear()
    .toString()
    .substring(2);
var yesterdayDate =
  date.getMonth() +
  1 +
  "/" +
  (date.getDate() > 9 ? date.getDate() - 1 : "0" + (date.getDate() - 1)) +
  "/" +
  date
    .getFullYear()
    .toString()
    .substring(2);

const proxyurl = "https://cors-anywhere.herokuapp.com/";
const api = "https://thevirustracker.com/timeline/map-data.json";

//fetch("http://localhost:3000/jokes/random")
//u can use above fetch if ur node server of server folder otherwise use proxyurl + api 
fetch(proxyurl + api)
  .then(response => response.json())
  .then(reports => {
    const currentDateData = reports.data.filter(
      report =>
        report.date === currentDate.toString() ||
        report.date === yesterdayDate.toString()
    );

    currentDateData.forEach(report => {
      const currentCountry = countryList.find(
        country => country.countryCode === report.countrycode
      );

      if (currentCountry) {
        const currentReportData = {
          type: "Feature",
          properties: {
            description: `<strong>${
              currentCountry ? currentCountry.country : "NO"
            }</strong>
                <p> Cases: ${report.cases}</p>
                <p>Deaths: ${report.deaths}</p>
                <p>Recovered: ${report.recovered}</p>`,
            icon: "theatre"
          },
          geometry: {
            type: "Point",
            coordinates: [currentCountry.longitude, currentCountry.latitude]
          }
        };
        allCountryData.push(currentReportData);
      }
    });

    mapboxgl.accessToken = mapBoxToken;
    var map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/dark-v10",
      zoom: 1.5,
      center: [78.8718, 21.7679]
    });
    var size = 50;
    var pulsingDot = {
      width: size,
      height: size,
      data: new Uint8Array(size * size * 4),

      // get rendering context for the map canvas when layer is added to the map
      onAdd: function() {
        var canvas = document.createElement("canvas");
        canvas.width = this.width;
        canvas.height = this.height;
        this.context = canvas.getContext("2d");
      },

      // called once before every frame where the icon will be used
      render: function() {
        var duration = 2000;
        var t = (performance.now() % duration) / duration;

        var radius = (size / 2) * 0.3;
        var outerRadius = (size / 2) * 0.7 * t + radius;
        var context = this.context;

        // // draw outer circle
        context.clearRect(0, 0, this.width, this.height);
        context.beginPath();
        context.arc(
          this.width / 2,
          this.height / 2,
          outerRadius,
          0,
          Math.PI * 2
        );
        context.fillStyle = "rgba(255, 200, 200," + (1 - t) + ")";
        context.fill();

        // draw inner circle
        context.beginPath();
        context.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2);
        context.fillStyle = "rgba(255, 100, 100, 1)";
        context.strokeStyle = "white";
        context.lineWidth = 2 + 4 * (1 - t);
        context.fill();
        context.stroke();

        // update this image's data with data from the canvas
        this.data = context.getImageData(0, 0, this.width, this.height).data;

        // continuously repaint the map, resulting in the smooth animation of the dot
        // map.triggerRepaint();

        // return `true` to let the map know that the image was updated
        return true;
      }
    };

    map.on("load", () => {
      map.addImage("pulsing-dot", pulsingDot, { pixelRatio: 2 });

      map.addSource("points", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: allCountryData
        }
      });
      map.addLayer({
        id: "points",
        type: "symbol",
        source: "points",
        layout: {
          "icon-image": "pulsing-dot"
        }
      });

      // Create a popup, but don't add it to the map yet.
      var popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
      });

      map.on("mouseenter", "points", function(e) {
        // Change the cursor style as a UI indicator.
        map.getCanvas().style.cursor = "pointer";

        var coordinates = e.features[0].geometry.coordinates.slice();
        var description = e.features[0].properties.description;

        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        // Populate the popup and set its coordinates
        // based on the feature found.
        popup
          .setLngLat(coordinates)
          .setHTML(description)
          .addTo(map);
      });

      map.on("mouseleave", "points", function() {
        map.getCanvas().style.cursor = "";
        popup.remove();
      });
    });

    document.getElementById("spinner").style.display = "none";
  });
