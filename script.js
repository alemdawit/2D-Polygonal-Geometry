const m = new mapboxgl.Map({
  container: 'map', // container id
  style: 'mapbox://styles/mapbox/streets-v11', // stylesheet location
  center: [-121.9120314, 37.3554002], // starting position [lng, lat]
  zoom: 13 // starting zoom
});

const mapPromise = new Promise((resolve, reject) => {
  m.on('load', function() {
    resolve(m);
  });
})

const ddlogo = fetch('https://gistcdn.githack.com/DronePhil/d70544e59f7e1fb2a61d7c5f27cc1b81/raw/88d038924d1a4740d1b11f714c78426ea46bc085/dd-logo.geo.json')
  .then((resp) => resp.json()) // Transform the data into json

const poi = fetch('https://gistcdn.githack.com/DronePhil/d70544e59f7e1fb2a61d7c5f27cc1b81/raw/88d038924d1a4740d1b11f714c78426ea46bc085/poi.geo.json')
  .then((resp) => resp.json())

Promise.all([ddlogo, poi, mapPromise])
  .then((datas) => {
    const [logo, points, map] = datas;
    var coords = points.features.map(item => {
      return item.geometry.coordinates;
    });
    var coordinatesName = points.features.map(item => {
      return item.properties.Name;
    });
    //Declearing JSON objectfor insite coordinates and offsite coordinates
    var onsitePointsArray = [];
    var offsitePointsArray = [];
    var polygon1 = logo.features[1].geometry.coordinates.map(item => {
      return item; //.geometry.coordinates;

    })[0];
    
    // checks the inner polygon points
    const result = coords.map(p => {

      if (pointChecker(p, polygon1)) {
        onsitePointsArray.push(p);
      } 
    });

    const outershape = logo.features[0].geometry.coordinates[1];
    const innershape = logo.features[0].geometry.coordinates[0];
    // this result2 is for the circule polygon
    const result2 = coords.map(p => {
      if (pointChecker(p, outershape)) {
        if (!pointChecker(p, innershape)) {
          onsitePointsArray.push(p);
        } 
      }
    });
    // mapbox has trouble with the output of the geojson conversion
    logo.features[0].geometry.coordinates.reverse();
// This function assignes offsite points
    function offsitePointsList() {

      for (let i = 0; i < coords.length; i++) {
            eva = 0;
            for (let j = 0; j < onsitePointsArray.length; j++) {

                if (coords[i][0] === onsitePointsArray[j][0]) {
                    if (coords[i][1] === onsitePointsArray[j][1]) {
                      eva++;
                    }
                }
            }
            if (eva === 0) {
              offsitePointsArray.push(coords[i]);
            }

      	}
    }

    var onsitePoints = geodata(onsitePointsArray);
    offsitePointsList();
    var offsitePoints = geodata(offsitePointsArray);
  // this function retunrs complete data binded in form of GEOJSON
    function geodata(arrayofpoints) {
      var bindeddata = [];
      for (let i = 0; i < arrayofpoints.length; i++) {
        bindeddata.push(createPointItem(arrayofpoints[i]));
      }
			//This resturns geojson elements 
      return {

        "type": "FeatureCollection",
        "name": "Points of Interest",
        "crs": {
          "type": "name",
          "properties": {
            "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
          }
        },
        "features": bindeddata

      }

    }
    // this function helps us to bind the insite coordinates for geojson
    function createPointItem(pointCoordinates) {
      //returns every coordinates 'features' elements 
      return {
        type: "Feature",
        properties: {
          Name: "Point",
          description: null,
        },
        geometry: {
          type: "Point",
          coordinates: pointCoordinates,
        },
      };
    }

    //***************ALL THE MAPBOX LAYERS *****************//

    map.addLayer({
      "id": "dd-logo",
      "type": "fill",
      "source": {
        "type": "geojson",
        "data": logo
      },
      'layout': {},
      'paint': {
        'fill-color': '#088',
        'fill-opacity': 0.8
      }
    });

    map.addLayer({
      "id": "onsitePoints",
      "type": "circle",
      "source": {
        "type": "geojson",
        "data": onsitePoints
      },
      "paint": {
        "circle-color": "#ff0000"
      },
    })

    map.addLayer({
      "id": "offsitePoints",
      "type": "circle",
      "source": {
        "type": "geojson",
        "data": offsitePoints
      },
      "paint": {
        "circle-color": "#0000ff"
      },
    })
    //*******************END OF THE LATER ********////
  })

function pointChecker(point, polygonGeometry) {
  const x = point[0];
  const y = point[1];
  let pointChecker = false;
  for (let i = 0, j = polygonGeometry.length - 1; i < polygonGeometry.length; j = i++) {
    const xi = polygonGeometry[i][0];
    const yi = polygonGeometry[i][1];
    const xj = polygonGeometry[j][0];
    const yj = polygonGeometry[j][1];
    const intersect = ((yi > y) != (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) pointChecker = !pointChecker;
  }
  return pointChecker;
};
//Usage:
