// https://www.mapillary.com/connect?client_id=Z0l2SnYzeXRIRDBpeC1xUWNTYTdqQTpiMzFiNTBiMWFkNWJkOWVl&response_type=token&scope=user:email%20org:read&redirect_uri=http:%2F%2Fexample.com`

var http = require('http');
var path = require('path');

var express = require('express');

var router = express();
var server = http.createServer(router);

router.use(express.static(path.resolve(__dirname, 'client')));


server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
    var addr = server.address();
    console.log("Server listening at", addr.address + ":" + addr.port);
});
