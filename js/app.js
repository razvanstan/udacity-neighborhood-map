
var ViewModel = function() {

    var APP = {
        //Timisoara, RO
        lat: 45.756289,
        lng: 21.228679,

        numberOfPlaces: 10,
        forsquareClientId: 'CAEHFQZR1BQF0NRMKY5DYKW0YZ0KFRD3OPI3X0DJ5TXOIJRH',
        forsquareSecret: 'TDJPMCWXZXAL5K1P5CKOT34Q5TSCQAC45YHPCMN0IUFEKIN0',
        forsquareVersion: '20170824',

        gm_largeInfowindow: '',
        gm_bounds: '',
        gm_geocoder: ''
    };

    var map;
    var self = this;

    initMap = function() {
        map = new google.maps.Map(document.getElementById('map'), {
            center: {
                lat: APP.lat,
                lng: APP.lng
            }
        });

        self.loadData();
    };

    self.showMenu = ko.observable(false);
    self.isWide = ko.observable(false);
    self.location = ko.observable('Timisoara');
    self.markers = ko.observableArray();
    self.searchPlaces = ko.observable('');

    self.toggleMenu = function() {
        self.showMenu(!self.showMenu());
        self.isWide(!self.isWide());
    };

    // This function takes the user input value via data binding, locates it, and then zooms into that area
    self.zoomToArea = function() {
        APP.gm_geocoder = new google.maps.Geocoder();

        APP.gm_geocoder.geocode({address: 'Timisoara'}, function(results, status) {

            if (status === google.maps.GeocoderStatus.OK) {

                APP.lat = results[0].geometry.location.lat();
                APP.lng = results[0].geometry.location.lng();

                map.setCenter(results[0].geometry.location);
                map.setZoom(13);

                self.loadData();
            } else {
                window.alert('We could not find that location. Try entering a more specific place.');
            }
        });
    };

    // Method to load the data for the user entered location using foursquare API
    self.loadData = function() {

        var foursquareUrl = 'https://api.foursquare.com/v2/venues/explore?ll=' + APP.lat + ',' + APP.lng + '&limit='+APP.numberOfPlaces+'&section=topPicks&day=any&time=any&locale=en&client_id='+APP.forsquareClientId+'&client_secret='+APP.forsquareSecret+'&v='+APP.forsquareVersion;

        APP.gm_largeInfowindow = new google.maps.InfoWindow({maxWidth: 200});
        APP.gm_bounds = new google.maps.LatLngBounds();

        $.getJSON(foursquareUrl).done(function(data) {
            displayLocationsOnMap(data.response.groups[0].items);
        }).fail(function() {
            window.alert('Foursquare API data could not be loaded. Please try again!');
        });
    };

    // This function populates the infowindow when the marker is clicked
    self.populateInfoWindow = function(marker, infowindow, place) {

        // Check to make sure the infowindow is not already opened on this marker
        if (infowindow.marker != marker) {
            infowindow.marker = marker;

            var contentString = [
                '<h2>' + marker.title + '</h2>',
                '<p class="mt0">' + place.venue.categories[0].name + '</p>',
                '<p><strong><i class="zmdi zmdi-navigation pr-5"></i> Address: </strong>' + place.venue.location.formattedAddress + '</p>',
                _getLocationPhone(),
                _getLocationTips(),
                _getLocationUrl(),
                '<a href="https://foursquare.com/" target = "_blank">',
                '<img src="https://ss0.4sqi.net/img/poweredByFoursquare/poweredby-one-color-cdf070cc7ae72b3f482cf2d075a74c8c.png" width="200" alt="Foursquare Logo">',
                '</a>'
            ].join(' ');

            infowindow.setContent(contentString);
            infowindow.open(map, marker);

            infowindow.addListener('closeclick',function(){
                infowindow.setMarker = null;
                infowindow.setContent('');
            });
        }

        function _getLocationPhone() {
            return typeof place.venue.contact.formattedPhone !== 'undefined' ? '<p><strong><i class="zmdi zmdi-phone pr-5"></i> Contact: </strong>' + place.venue.contact.formattedPhone + '</p>' : '';
        }

        function _getLocationTips() {
            return typeof place.tips !== 'undefined' ? '<p><strong>Tips: </strong>' + place.tips[0].text + '</p>' : '';
        }

        function _getLocationUrl() {
            return typeof place.venue.url !== 'undefined' ? '<p><a href = "' + place.venue.url + '" target = "_blank">' + place.venue.url + '</a></p>' : '';
        }
    };

    showInfo = function() {
        var place = this;

        ko.utils.arrayForEach(self.markers(), function(marker) {

            if (place.title === marker.title) {

                if ( $(window).width() < 500 && $(window).height() < 800 ){
                    self.showMenu(false);
                    self.isWide(false);
                }

                google.maps.event.trigger(marker, 'click');
                map.setCenter(marker.position);
            }
        });
    };

    self.filteredMarkers = ko.computed(function() {

        // Remove markers from map
        ko.utils.arrayForEach(self.markers(), function(marker) {
            marker.setVisible(false);
        });

        var filteredArray = [];

        filteredArray =  $.grep(self.markers(), function(a) {
            var locationSearch = a.title.toLowerCase().indexOf(self.searchPlaces().toLowerCase());
            return locationSearch > -1;
        });

        filteredArray.forEach(function(a) {
            ko.utils.arrayForEach(self.markers(), function(marker) {
                if(marker.title === a.title) {
                    marker.setVisible(true);
                }
            });
        });

        return filteredArray;
    });

    function displayLocationsOnMap(locations) {

        locations.forEach(function(location) {
            var marker = new google.maps.Marker({
                position: {
                    lat: location.venue.location.lat,
                    lng: location.venue.location.lng
                },
                map: map,
                title: location.venue.name,
                animation: google.maps.Animation.DROP
            });

            self.markers.push(marker);

            // Click event to open infowindow and set animation at each marker
            marker.addListener('click', function() {
                marker.setAnimation(google.maps.Animation.BOUNCE);
                self.populateInfoWindow(this, APP.gm_largeInfowindow, location);
                setTimeout(function() { marker.setAnimation(null); }, 1400);  //bounce for 1400 ms
            });

            APP.gm_bounds.extend(marker.position);
            map.fitBounds(APP.gm_bounds);
        });
    }
};

function errorHandling() {
    alert("Google Maps can not be loaded. Please try again.");
}

ko.applyBindings(new ViewModel());
