var startDate;
var endDate;


function searchMapData(){
    $("#geoSearchfeedResults").show();
    $("#buttonGeoSearch").button("loading");

    window.searchMplImages(null, map.getBounds(), startDate, endDate);
}


function searchUserFeed(username, startDate, endDate, addResultsToMap){
    $("#feedResults").show();

    $("#buttonSearchUserFeed").button("loading");

    $("#resultTitle").html("Usuario: " +  username);
    $("#accordionResult").html("");

    window.searchSequences(null, username, startDate, endDate, addResultsToMap);
}


function buildDateRangePicker(){
    $('.dateSearch').daterangepicker({
        autoUpdateInput: false,
        locale: {
            format: 'DD/MM/YYYY',
            cancelLabel: 'Limpiar',
            applyLabel: 'Aplicar',
            "fromLabel": "A partir de",
            "toLabel": "Hasta",
            "weekLabel": "S",
            "daysOfWeek": [
                "Do",
                "Lu",
                "Ma",
                "Mi",
                "Ju",
                "Vi",
                "Sa"
            ],
            "monthNames": [
                "Enero",
                "Febrero",
                "Marzo",
                "Abril",
                "Mayo",
                "Junio",
                "Julio",
                "Agosto",
                "Septiembre",
                "Octubre",
                "Noviembre",
                "Diciembre"
            ],
        },
        alwaysShowCalendars: true,
        showCustomRangeLabel: false,
        ranges: {
           'Hoy': [moment(), moment()],
           'Ayer': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
           'Últimos 7 días': [moment().subtract(6, 'days'), moment()],
           'Últimos 30 días': [moment().subtract(29, 'days'), moment()],
           'Este mes': [moment().startOf('month'), moment().endOf('month')],
           'El mes pasado': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
        }
    });

    $('.dateSearch').on('apply.daterangepicker', function(ev, picker) {
        $(this).val(picker.startDate.format('DD/MM/YYYY') + ' - ' + picker.endDate.format('DD/MM/YYYY'));

        startDate = picker.startDate;
        endDate = picker.endDate;
    });

    $('.dateSearch').on('cancel.daterangepicker', function(ev, picker) {
        $(this).val('');

        startDate = null;
        endDate = null;
    });

}


$(function(){
    window.initMap("map");
    buildDateRangePicker();

    $(".feedResults").hide();

    $("#formSearchUser").submit(function(event){
        event.preventDefault();

        if($("#dateSearch").val()==""){
            startDate = null;
            endDate = null;
        }

        searchUserFeed($("#username").val(), startDate, endDate, $("#addResultsToMap").is(':checked'));
    });

    $("#formExportData").submit(function(event){
        event.preventDefault();
        window.exportData();
    });


    $("#formGeoSearch").submit(function(event){
        event.preventDefault();
        sidebar.close();

        if($("#geoSearchDate").val()==""){
            startDate = null;
            endDate = null;
        }

        searchMapData();
    });

    $('#modalApiKey').on('shown.bs.modal', function () {
        window.sidebar.close();
    });

});


/*global $ L moment*/
