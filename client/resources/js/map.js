var sidebar, map;
var linestringLayer, markerLayer, imageLayer;

var mapData = {
    imagesAlone: []
};

var buttonPlay, buttonStop, buttonBuild;

function addMplData(featureCollection, clearLayers=false){
    console.log("Adding mply data", featureCollection);

    var feature, popup;
    for(var i = 0; i < featureCollection.features.length; i++){
        feature = featureCollection.features[i];

        popup = L.popup({
            maxWidth: "400px"
        }).setContent("<img width='400px' src='https://d1cuyjsrcm0gby.cloudfront.net/" + feature.properties.key + "/thumb-320.jpg' />");

        L.circleMarker({lat: feature.geometry.coordinates[1], lng: feature.geometry.coordinates[0]}, {radius:2}).addTo(imageLayer).bindPopup(popup);

        mapData.imagesAlone.push(feature);
    }
}


function clearImageLayer(){
    console.log("cleaning images");

    imageLayer.clearLayers();
    mapData.imagesAlone = [];
}



window.initMap = function(idMap){
    var osm = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    });

    var mapboxTiles = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/streets-v8/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiaW1sZW8iLCJhIjoiT0tfdlBSVSJ9.Qqzb4uGRSDRSGqZlV6koGg",{
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, Tiles thanks to © <a href="http://mapbox.com">Mapbox</a>'
    });

    map = L.map(idMap, {
        center: [0, 0],
        zoom: 3,
        layers: [osm]
    });

    buttonBuild = L.easyButton('<img src="https://upload.wikimedia.org/wikipedia/commons/a/a3/Mapillary_logo.svg" width="18"/>', window.buildViewer).addTo( map );

    buttonPlay = L.easyButton({
            states: [{
                    stateName: 'play-viewer',
                    icon:      'fa-play',
                    title:     'Iniciar',
                    onClick: function(btn, map) {
                        window.playViewer();
                        btn.state('pause-viewer');
                    }
                }, {
                    stateName: 'pause-viewer',
                    icon:      'fa-pause',
                    title:     'Pausa',
                    onClick: function(btn, map) {
                        window.pauseViewer();
                        btn.state('play-viewer');
                    }
            }]
        }).addTo(map);

    buttonStop = L.easyButton('fa-square', window.stopViewer).addTo( map );

    sidebar = L.control.sidebar('sidebar');

    map.addControl(sidebar);

    window.layerControl = L.control.groupedLayers({"OSM": osm, "Mapbox": mapboxTiles}, {}, {collapsed: false});
    window.layerControl.addTo(map);

    linestringLayer = L.layerGroup().addTo(map);
    markerLayer = L.layerGroup().addTo(map);

    imageLayer = L.layerGroup().addTo(map);

    buttonPlay.disable();
    buttonStop.disable();

    // search
    var geosearchControl = new L.Control.GeoSearch({
        provider: new L.GeoSearch.Provider.OpenStreetMap(),
        showMarker: false
    }).addTo(map);
};


window.addSequenceToMap = function(sequenceKey, centerMap){
    var username = $("#" + sequenceKey).attr("data-username");
    var sequence = window.userCache[username][sequenceKey];

    if(!mapData[username]){
        mapData[username] = {};
    }

    var imageKeys = sequence.properties.coordinateProperties.image_keys;
    var coordinates = sequence.geometry.coordinates;

    var layer = L.featureGroup().addTo(markerLayer);
    var linestring = L.geoJSON(sequence).addTo(linestringLayer);

    var popup;
    for(var i = 0; i < coordinates.length; i++){
        popup = L.popup({
            maxWidth: "400px"
        }).setContent("<img width='400px' src='https://d1cuyjsrcm0gby.cloudfront.net/" + imageKeys[i] + "/thumb-320.jpg' />");

        L.circleMarker({lat: coordinates[i][1], lng: coordinates[i][0]}, {radius:2}).addTo(layer).bindPopup(popup);
    }

    $("#"+sequenceKey).addClass("btn-danger");
    $("#"+sequenceKey).html("Eliminar del mapa");
    $("#"+sequenceKey).attr("onClick", "removeSequenceFromMap(this.id)");

    if(centerMap){
        map.fitBounds(layer.getBounds());
    }

    mapData[username][sequenceKey] = {
        layer: layer,
        linestring: linestring,
        startKey: imageKeys[0],
        stopKey: imageKeys[imageKeys.length-1]
    };
};


window.removeSequenceFromMap = function(sequenceKey){
    var username = $("#" + sequenceKey).attr("data-username");

    markerLayer.removeLayer(mapData[username][sequenceKey].layer);
    linestringLayer.removeLayer(mapData[username][sequenceKey].linestring);

    delete mapData[username][sequenceKey];

    $("#"+sequenceKey).removeClass("btn-danger");
    $("#"+sequenceKey).html("Agregar al mapa");
    $("#"+sequenceKey).attr("onClick", "addSequenceToMap(this.id, true)");
};


window.exportData = function(newTableName, username, api_key){
    newTableName = (newTableName != null) ? newTableName:$("#newTableName").val();
    api_key = (api_key != null) ? api_key:$("#cartoApiKey").val();
    username = (username != null) ? username:$("#cartoUsername").val();

    var base_url = "https://" + username + ".carto.com/api/v2/sql?api_key=" + api_key + "&";

    // create table
    var query = "q=CREATE TABLE " + newTableName + "(\"user\" text, \"picture\" text, \"comment\" text, \"sequence_created_at\" date, \"sequence_captured_at\" date)";

    $.post( base_url + query).done(function(){
        query = "q=SELECT cdb_cartodbfytable('" + newTableName + "')";

        // make the new table visible in carto datasets
        $.post( base_url + query).fail(function(){
            console.log("Error setting to visible new table: ", newTableName);
        }).always(function(){
            sidebar.close();
            window.insertData(base_url, newTableName);
        });

    }).fail(function(){
        console.log("Error creating the table.");

        sidebar.close();

        BootstrapDialog.show({
            title: 'Tabla con el mismo nombre encontrada.',
            message: '¿Deseas eliminar la información actual de la tabla antes de continuar?',
            buttons: [
                {
                    label: 'Si',
                    action: function(dialogItself){
                        window.cleanOldData(base_url, newTableName);
                        dialogItself.close();
                    }
                }, {
                    label: 'No',
                    action: function(dialogItself){
                        window.insertData(base_url, newTableName);
                        dialogItself.close();
                    }
                }, {
                    label: 'Cancelar',
                    action: function(dialogItself){
                        dialogItself.close();
                    }
                }
            ]
        });

    });
};

/* global L $ BootstrapDialog*/
