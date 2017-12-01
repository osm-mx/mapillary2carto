var progressHtml = '<div class="progress"><div id="progressbarExport" class="progress-bar progress-bar-striped active" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%"></div></div>';
var progressBar = new BootstrapDialog();
progressBar.setTitle("Exportando...");


window.cleanOldData = function(carto_api, tableName){
    var query = "q=DELETE FROM " + tableName;

    $.post(carto_api + query).done(function(data){
        console.log("Data cleaned correctly");

        insertData(carto_api, tableName);
    }).fail(function(){
        console.log("Table not found");
    });
};


window.insertData = function(carto_api, tableName){
    progressBar.setMessage(progressHtml);
    progressBar.open();

    var user, sequence, sequenceKey, imageKeys, coordinates;
    var calls = [];
    for(user in mapData){
        if(user !== "imagesAlone"){
            for(sequenceKey in mapData[user]){
                sequence = window.userCache[user][sequenceKey];

                imageKeys = sequence.properties.coordinateProperties.image_keys;
                coordinates = sequence.geometry.coordinates;

                for(var i = 0; i < coordinates.length; i++){
                    calls.push({
                        newTableName: tableName,
                        latLng: {lat: coordinates[i][1], lng: coordinates[i][0]},
                        user: user,
                        imageKey: imageKeys[i],
                        comment: "",
                        created_at: sequence.properties.created_at,
                        captured_at: sequence.properties.captured_at
                    });
                }
            }
        }
    }

    var feature;
    for(var i = 0; i < mapData["imagesAlone"].length; i++){
        feature = mapData["imagesAlone"][i];

        calls.push({
            newTableName: tableName,
            latLng: {lat: feature.geometry.coordinates[1], lng: feature.geometry.coordinates[0]},
            user: feature.properties.username,
            imageKey: feature.properties.key,
            comment: "",
            created_at: feature.properties.captured_at,
            captured_at: feature.properties.captured_at
        });
    }


    insertRecursive(calls, 0, carto_api);
};


function insertRecursive(array_calls, index, carto_api){
    if((array_calls.length) === index ){
        // no more calls
        progressBar.setMessage("Datos exportados correctamente");
        return;
    }

    var query = "q=INSERT INTO " + array_calls[index].newTableName + "(\"user\", \"image\", \"comment\", \"image_key\", \"sequence_link\", \"sequence_created_at\", \"sequence_captured_at\", \"the_geom\") VALUES ('"+ array_calls[index].user +"','https://d1cuyjsrcm0gby.cloudfront.net/"+ array_calls[index].imageKey +"/thumb-1024.jpg','" + array_calls[index].comment + "','" + array_calls[index].imageKey + "','http://mapillary.com/map/im/" + array_calls[index].imageKey + "','"+ array_calls[index].created_at +"', '"+ array_calls[index].captured_at +"', ST_SetSRID(ST_Point(" + array_calls[index].latLng.lng + "," + array_calls[index].latLng.lat + "),4326))";

    $.post(carto_api + query).done(function(data){

        var currentValue = (index*100)/array_calls.length;

        $("#progressbarExport").attr("aria-valuenow", currentValue);
        $("#progressbarExport").html(currentValue.toFixed(2) + "%");

        $("#progressbarExport").css("width", currentValue + "%");

        insertRecursive(array_calls, ++index, carto_api);
    }).fail(function(){
        progressBar.close();
        BootstrapDialog.alert('Error exportando los datos, por favor intentelo más tarde.');

        console.log("Error inserting data");
    });
}

/*global $ BootstrapDialog*/
