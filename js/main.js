var extent = [0, 0, 1400, 700];
var imageExtent = [0, 0, 1200, 600];
var projection = new ol.proj.Projection({
    code: 'pixel',
    units: 'pixels',
    extent: extent
});

var container = document.getElementById('popup');
var content = document.getElementById('popup-content');
var closer = document.getElementById('popup-closer');

var overlay = new ol.Overlay({
  element: container,
  autoPan: true,
  autoPanAnimation: {
    duration: 250
  },
  offset: [0, -30]
});

closer.onclick = function() {
  overlay.setPosition(undefined);
  closer.blur();
  return false;
};

var markerInfo = [
                  {x:400, y:120, temp:38.2}, 
                  {x:900, y:400, temp:34.6}, 
                  {x:420, y:360, temp:30.5},
                  {x:720, y: 60, temp:31.5},
                  {x:328, y:460, temp:31.1},
                  {x:520, y:235, temp:33.9}
];//可改變座標位置，與溫度


var heatMapLayer = setHeatMapLayer(markerInfo, 85, 0.7, 8);
var MarkerLayer = setMarkerLocation(markerInfo);

var backgroundSource = new ol.source.Vector({
  features:[new ol.Feature({
    geometry: new ol.geom.Polygon([[[0,0],[0,600],[1200,600],[1200,0]]])
  })]
});

var map = new ol.Map({
    target: "map",
    overlays: [overlay],
    layers: [
      new ol.layer.Image({
        source: new ol.source.ImageStatic({
          url: "images/7dccc1be.png",
          imageExtent: imageExtent
        })
      }),
      new ol.layer.Image({
        source: new ol.source.ImageVector({
          source: backgroundSource,
          style: new ol.style.Style({
            fill: new ol.style.Fill({color:'rgba(45, 255, 0, 0.5)'})
          })
        })
      })
    ],
    view: new ol.View({
      center: ol.extent.getCenter(imageExtent),
      projection: projection,
      zoom: 0,
      resolutions: [2, 1.7]
    })
});

map.addLayer(heatMapLayer);
map.addLayer(MarkerLayer);
map.addControl(createHeatLegend());

map.on("click", function(evt){
  map.forEachFeatureAtPixel(evt.pixel,
  function (feature, layer) {
    if(feature) {
      var geometry = feature.getGeometry();
      var coord = geometry.getCoordinates();
      content.innerHTML = "<p>溫度：" + feature.get("key") + "</p>"
                        + "<p>座標：" + "(" + coord + ")" + "</p>";
      overlay.setPosition(coord);
    }
  }, 
  null, 
  function(layer) {
    return layer === MarkerLayer;
  });
});

map.on('pointermove', function(evt) {
  map.getTargetElement().style.cursor =
  map.hasFeatureAtPixel(evt.pixel, function(layer){return layer === MarkerLayer;}) ? 'pointer' : '';
});

map.on('postrender', function(){
  $('.ol-logo-only').remove();
});
 
function createHeatLegend() {
  var maxValue = 38;
  var minValue = 10;
  var unit = 2;
  var cells = (maxValue - minValue)/2;
  var curValue = maxValue;
  
  var legendContainer =  document.createElement('div');
      legendContainer.className = 'custom';

  var custom_element = document.createElement('div');
      custom_element.className = 'heatLegend';
  
  var heatBar = $(custom_element);
  
  while(cells > 1) {
    var label = document.createElement('div');
    label.className = 'heatLabel';
    label = $(label);
    label.attr("data-content", (curValue-=unit) + "ºC");
    heatBar.append(label);
    cells--
  }
  
  $(legendContainer).append(custom_element);
  
  var myControl = new ol.control.Control({
    element: legendContainer,
    target: document.getElementById("map")
  });  
     
  return myControl;
}

function setHeatMapLayer(data, blur, opacity, radius) {
  var density = [],
      temps = [];
  
  var heatMapSource = new ol.source.Vector({
    features: []
  });

  for(var i=0; i<data.length; i++) {
    temps.push(data[i].temp);
  }
  
  var minValue = Math.min.apply(null, temps);

  for(var i=0; i<data.length; i++) {
    var weight = data[i].temp- minValue +1;//凸顯溫度的差異
    for(var j=0; j<data[i].temp*weight; j++) {
       var p = [data[i].x + (Math.floor(Math.random()*200) - 100), //設定溫度邊界
           data[i].y + (Math.floor(Math.random()*200) - 100)];
      if(ol.extent.containsCoordinate(imageExtent, p))
       density.push(p);
    }   
  }

  var features = new ol.Feature({
    geometry: new ol.geom.MultiPoint(density)
  });

  heatMapSource.addFeature(features);

   var heatMapLayer = new ol.layer.Heatmap({
     source:heatMapSource,
     /*以下為關鍵的參數*/
     blur: blur,
     opacity: opacity,
     radius: radius,
     gradient: ['#0ff', '#0f0', '#ff0', '#f00']
   });
  
  return heatMapLayer;
}

function setMarkerLocation(data) {

  
  var MarkerSource = new ol.source.Vector({
    features: []
  });
  
  for(var i=0; i<data.length; i++) {
    var feature = new ol.Feature({
      geometry: new ol.geom.Point([data[i].x, data[i].y]),
      key: data[i].temp + "ºC"
    });
    
    MarkerSource.addFeature(feature);
  }
  
  var MarkerLayer = new ol.layer.Vector({
    title: "Marker",
    source:MarkerSource,
    style: function(feature, resolution){
      return new ol.style.Style({
        image: new ol.style.Circle({
          fill: new ol.style.Fill({
            color: "green"
          }),
          radius: 8,
          stroke: new ol.style.Stroke({
            color: "blue",
            width: 1.5
          })
        }),
        text: new ol.style.Text({
          text: feature.get("key"),
          offsetY: -18,
          font: "14px serif",
          fill: new ol.style.Fill({
            color: "white"
          })
        })
      })
    }  
  });
  
  return MarkerLayer;
}
