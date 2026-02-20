function initMap() {
    "use strict";

    var content = '<address>' +
        'IPMC, Obuakon Road, Shiashie, Accra, Ghana<br>' +
        '<a href="https://goo.gl/maps/YourGoogleMapsLink" target="_blank">' +
        'Get Directions <i class="icon-angle-right"></i></a>' +
        '</address>';

    var mapElement = document.getElementById('map');

    var map = new google.maps.Map(mapElement, {
        zoom: 15,
        center: { lat: 5.63203, lng: -0.15540 }, // Accra coords
        scrollwheel: false,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [
            {"featureType":"water","elementType":"geometry.fill","stylers":[{"color":"#d3d3d3"}]},
            {"featureType":"transit","stylers":[{"color":"#808080"},{"visibility":"off"}]},
            {"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"visibility":"on"},{"color":"#b3b3b3"}]},
            {"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#ffffff"}]},
            {"featureType":"road.local","elementType":"geometry.fill","stylers":[{"visibility":"on"},{"color":"#ffffff"},{"weight":1.8}]},
            {"featureType":"road.local","elementType":"geometry.stroke","stylers":[{"color":"#d7d7d7"}]},
            {"featureType":"poi","elementType":"geometry.fill","stylers":[{"visibility":"on"},{"color":"#ebebeb"}]},
            {"featureType":"administrative","elementType":"geometry","stylers":[{"color":"#a7a7a7"}]},
            {"featureType":"road.arterial","elementType":"geometry.fill","stylers":[{"color":"#ffffff"}]},
            {"featureType":"landscape","elementType":"geometry.fill","stylers":[{"visibility":"on"},{"color":"#efefef"}]},
            {"featureType":"road","elementType":"labels.text.fill","stylers":[{"color":"#696969"}]},
            {"featureType":"administrative","elementType":"labels.text.fill","stylers":[{"visibility":"on"},{"color":"#737373"}]},
            {"featureType":"poi","elementType":"labels.icon","stylers":[{"visibility":"off"}]},
            {"featureType":"poi","elementType":"labels","stylers":[{"visibility":"off"}]},
            {"featureType":"road.arterial","elementType":"geometry.stroke","stylers":[{"color":"#d6d6d6"}]},
            {"featureType":"poi","elementType":"geometry.fill","stylers":[{"color":"#dadada"}]}
        ]
    });

    var infowindow = new google.maps.InfoWindow({
        content: content,
        maxWidth: 360
    });

    var marker = new google.maps.Marker({
        position: { lat: 5.63203, lng: -0.15540 },
        map: map,
        animation: google.maps.Animation.DROP
    });

    marker.addListener('click', function () {
        infowindow.open(map, marker);
    });

    // Keep map centered on resize
    google.maps.event.addDomListener(window, 'resize', function () {
        var center = { lat: 5.63203, lng: -0.15540 };
        google.maps.event.trigger(map, "resize");
        map.setCenter(center);
    });
}
