window.userCache = {};
var mly = null, routeComponent, routeMarker;


var mapillary = {
    client_id: "Z0l2SnYzeXRIRDBpeC1xUWNTYTdqQTpiMzFiNTBiMWFkNWJkOWVl",
    client_secret: "ZTFmYmUwZDdmYjcwODM3ZTVjNmI5MzI5MzMyOTE1MDc=",
    base_url: "https://a.mapillary.com/v3"
};


window.pauseViewer = function(){
    routeComponent.stop();
};


window.stopViewer = function(){
    $("#map").css("width", "100%");
    $("#mly").css("width", "0");

    $("#mly").remove();
    mly = null;

    window.map.invalidateSize(true);

    window.buttonBuild.enable();
    window.buttonPlay.disable();
    window.buttonStop.disable();

    if(routeMarker){
        routeMarker.removeFrom(window.map);
        routeMarker = null;

        routeComponent.stop();
    }

    window.buttonPlay.state("play-viewer");
};


window.playViewer = function(){
    routeComponent.play();
};



window.buildViewer = function(){
    var paths = [];
    for(var username in window.mapData){
        for(var sequenceKey in window.mapData[username]){
            paths.push({
                sequenceKey: sequenceKey,
                startKey: window.mapData[username][sequenceKey].startKey,
                stopKey: window.mapData[username][sequenceKey].stopKey,
                infoKeys: []
            });
        }
    }

    if(paths.length == 0){
        alert("Necesitas elegir al menos una sequencia.");
        return;
    }

    $("body").append("<div id='mly' width='0'></div>");
    console.log("creating viewer");

    var viewerOptions = {
        component: {
            cover: false,
            sequence: false,
            direction: false,
        }
    };

    mly = new Mapillary.Viewer(
        'mly',
        mapillary.client_id,
        paths[0].startKey,
        viewerOptions);

    routeComponent = mly.getComponent('route');

    if( paths.length > 0 ){
        console.log("activating route component");

        routeComponent.configure({
            paths: paths,
            playing: false
        });

        mly.activateComponent('route');
    }


    //resize window listener
    window.addEventListener("resize", function() {
        mly.resize();
        window.map.invalidateSize(true);
    });


    // leaflet marker follow
    mly.on(Mapillary.Viewer.nodechanged, function (node) {
        var latLon = [node.latLon.lat, node.latLon.lon];

        if (!routeMarker) {
            routeMarker = L.marker(latLon);
            routeMarker.addTo(window.map);
        } else {
            routeMarker.setLatLng(latLon);
        }

        window.map.setView(latLon);
    });


    window.buttonPlay.enable();
    window.buttonStop.enable();
    window.buttonBuild.disable();

    showViewer();
};


function showViewer(){
    window.sidebar.close();

    $("#map").css("width", "30%");
    $("#mly").css("width", "70%");

    window.map.invalidateSize(true);
}


window.searchMplImages = function(link, latLngBounds, startDate, endDate){
    console.log("finding by bounds");

	if(link==null){
		// bbox minx,miny,maxx,maxy
	    var bbox = [latLngBounds.getWest(), latLngBounds.getNorth(), latLngBounds.getEast(), latLngBounds.getSouth()];

        link = mapillary.base_url + "/images?" + "bbox=" + bbox + "&client_id=" + mapillary.client_id;

        if(startDate){
            link += "&start_time=" + startDate.format('YYYY-MM-DD');

            if(startDate.format('YYYY-MM-DD') !== endDate.format('YYYY-MM-DD') ){
                link += "&end_time=" + endDate.format('YYYY-MM-DD');
            }
        }
	}

	$.get( link ).done(function(result, textStatus, jqXHR){
		window.addMplData(result);

		var linksHeaders = jqXHR.getResponseHeader("link").split(",");
        for(i = 0; i < linksHeaders.length; i++){
            if(linksHeaders[i].includes("rel=\"next")){
                var regex = /http.*>;/i.exec(linksHeaders[i]);
                var next_link = regex[0].slice(0,regex[0].length-2);

				window.searchMplImages(next_link, latLngBounds, startDate, endDate);
                break;
            }else if(i==linksHeaders.length-1){
                $("#buttonGeoSearch").button("reset");
            }
        }
	}).fail(function(err){
		console.log("Error looking in mapillary", err);
	});
};



window.searchSequences = function(link, username, startDate, endDate, addResultsToMap){
    if(link===null){
        link = mapillary.base_url + "/sequences?" + "usernames=" + username + "&client_id=" + mapillary.client_id;

        if(startDate){
            link += "&start_time=" + startDate.format('YYYY-MM-DD');

            if(startDate.format('YYYY-MM-DD') !== endDate.format('YYYY-MM-DD') ){
                link += "&end_time=" + endDate.format('YYYY-MM-DD');
            }
        }

        window.userCache[username] = {};
    }

    $.get( link ).done(function(result, textStatus, jqXHR){
        console.log(result);

        var featureProperties, creationDate, html, group, collapseAux, pointsCounter, sequenceLength, sequenceKey;
        for(var i = 0; i < result.features.length; i++){
            featureProperties = result.features[i].properties;
            sequenceKey = featureProperties.key;

            window.userCache[username][sequenceKey] = result.features[i];

            creationDate = moment(featureProperties["captured_at"]);
            group = creationDate.format('DDMMYYYY');
            sequenceLength = result.features[i].geometry.coordinates.length;

            pointsCounter = (sequenceLength>1) ? sequenceLength + " imágenes":"1 imagen";

            if($("#collapse_" + group).length == 0) {
                collapseAux = (i==0&&username!==null) ? " in":"";

                html =  '<div class="panel panel-default">';
                html += '   <div class="panel-heading">';
                html += '       <h4 class="panel-title">';
                html += '           <a data-toggle="collapse" href="#collapse_' + group + '">' +  creationDate.format('DD/MM/YYYY') + '</a>';
                html += '       </h4>';
                html += '   </div>';
                html += '   <div id="collapse_' + group + '" class="panel-collapse collapse' + collapseAux + '">';
                html += '       <div class="panel-body">';
                html += '           <ul class="list-group" id="result_list_' + group + '"></ul>';
                html += '       </div>';
                html += '   </div>';
                html += '</div>';

                $("#accordionResult").append(html);
            }

            html = "<li class='list-group-item'>" + creationDate.format("hh:mm:ss") + "<small> - " + pointsCounter + "</small>";
            html += "<button class='btn btn-default btn-xs pull-right' onclick='addSequenceToMap(this.id, true)' data-username='" + username + "' id='" + sequenceKey + "'>Agregar al mapa</button>";
            html += "<div class='clearfix'></div>";
            html += "</li>";

            $('#result_list_' + group).append(html);

            if(addResultsToMap){
                window.addSequenceToMap(sequenceKey, false);
            }
        }


        var linksHeaders = jqXHR.getResponseHeader("link").split(",");
        for(i = 0; i < linksHeaders.length; i++){
            if(linksHeaders[i].includes("rel=\"next")){
                var regex = /http.*>;/i.exec(linksHeaders[i]);
                var next_link_aux = regex[0].slice(0,regex[0].length-2).split("?");

                next_link = mapillary.base_url + "/sequences?" + next_link_aux[1];

                window.searchSequences(next_link, username, startDate, endDate, addResultsToMap);
                break;
            }else if(i==linksHeaders.length-1){
                $("#buttonSearchUserFeed").button("reset");

                if(addResultsToMap){
                    window.map.fitBounds(L.geoJSON(window.linestringLayer.toGeoJSON()).getBounds());
                }
            }
        }
    }).fail(function(error){
        if(error.status===404){
            $("#resultTitle").html("Usuario no encontrado");
        }

        $("#buttonSearchUserFeed").button("reset");
    });
};

/* global $ moment Mapillary L*/
