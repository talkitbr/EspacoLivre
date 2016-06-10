document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    console.clear();
    console.log("+onDeviceReady");

    // Handle the Cordova pause and resume events
    document.addEventListener('pause', onPause, false);
    document.addEventListener('resume', onResume, false);
    document.addEventListener('online', onOnline, false);

    initMobileApp();
    initMap();

    // Check if it is first time launch or not
    var isFirstRun = window.localStorage.getItem('isFirstRun');

    if (null == isFirstRun) {
        console.log("First time run");

        // Local storage is not set, hence first time launch
        window.localStorage.setItem('isFirstRun', true);

        // Show Help during first time launch
        openModal('helpModal', function () {
            enableButtons();
        });
    } else {
        console.log("Not first time run");
    }

    console.log("-onDeviceReady");
}

// Handles the ready of document to setup the buttons events
$(document).ready(function () {
    $(".help_button").click(function () {
        openModal('helpModal', function () {
            enableButtons();
        });

        disableButtons();
    });
});

function onPause() {
    // TODO: This application has been suspended. Save application state here.
}

function onResume() {
    // TODO: This application has been reactivated. Restore application state here.
}

// Checks the internet connection
function hasInternet() {
    // navigator.connection should always be defined, but it is not on the emulator
    if (navigator.connection) {
        var networkState = navigator.connection.type;
        return networkState != 'none';
    }

    console.error("ERROR: navigator.connection is not defined. cordova-plugin-network-connection is probably not installed");
    return true;
}

// Called when the device goes online
function onOnline() {
    // Analyse if we still need this function
    //if (hasInternet()) {
    //    initMap();
    //}
}

// ---------------------------- App related script ---------------------------- 
var map;
var azureMobileServices;
var azureTAble;
var myPosition;
var heatmap;
var points = [];
var selectedButton;

function hideProgress() {
    if (navigator.notification.activityStop != null) {
        navigator.notification.activityStop();
    }
    else {
        var loadingView = document.getElementById('loadingView');
        loadingView.style.display = 'none';
    }
}

function showProgress(text) {
    if (navigator.notification.activityStart != null) {
        navigator.notification.activityStart("Aguarde", text);
    }
    else {
        var loadingView = document.getElementById('loadingView');
        loadingView.style.display = 'block';
    }
}

function mapAddPoint(type) {
    console.log("+mapAddPoint: " + type);

    var item = {
        longitude: myPosition.position.lng(),
        latitude: myPosition.position.lat(),
        type: type,
        weight: 1,
        uuid: device.uuid,
        platform: device.platform,
        model: device.model,
        osversion: device.version
    };

    disableButtons();

    azureMobileServices.getTable(azureTableName).insert(item).done(function (result) {

        var item = new google.maps.LatLng(myPosition.position.lng(), myPosition.position.lat());
        points.push(item);        

        hideProgress();        

        showSimpleNotification(sentSuccessMessage);
        enableButtons();

    }, function (error) {
        console.log("ERROR: Error to insert item in database" + type);
        showSimpleNotification(errorMessage);
    });

    showProgress(sendDataLoadingText);

    console.log("-mapAddPoint");
}

function disableButtons() {
    $(".button").unbind().removeClass("button_enabled");
    $(".button").addClass("button_disabled").css('cursor', 'default').click(function (e) {
        e.preventDefault();
    });
}

function enableButtons() {
    $(".button").unbind().removeClass("button_disabled");
    $(".button").addClass("button_enabled");

    // set actions for button click
    $(".physical_button").click(function () {
        if (verifyInternetConnection()) {
            selectedButton = physicalValue;
            showNotificationCofirm();
        }
    });

    $(".verbal_button").click(function () {
        if (verifyInternetConnection()) {
            selectedButton = verbalValue;
            showNotificationCofirm();
        }
    });
}

function showSimpleNotification(message) {
    navigator.notification.alert(
        message,  // message
        null,     // dismiss callback
        appName,  // title
        'OK'      // buttonName
    );
}

// Function to display the confirmation alert
function showNotificationCofirm() {
    navigator.notification.confirm(
        dialogConfirmMessage + selectedButton.toLowerCase() + "?",  // message
        onConfirm,                                                  // callback to invoke with index of button pressed
        appName,                                                    // title
        ['Sim', 'Cancelar']                                         // buttonLabels
    );
}

// Confirm notification callback
function onConfirm(buttonIndex) {
    // Check if is confirm button
    if (buttonIndex == 1)
    {
        mapAddPoint(selectedButton);        
    }
}

function initMobileApp() {
    console.log("+initMobileApp");

    azureMobileServices = new WindowsAzure.MobileServiceClient(azureMobileApp);
    azureTAble = azureMobileServices.getTable(azureTableName)

    console.log("-initMobileApp");
}

function initMap() {
    console.log("+initMap");

    // firstly disable buttons
    disableButtons();

    // checks the internet connection
    if (!verifyInternetConnection()) {
        return;
    }

    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 0, lng: 0 },
        zoom: 2,
        zoomControl: true,
        disableDefaultUI: true,
        mapTypeControl: true
    });

    setUserPosition();

    map.addListener('click', function (e) {
        setUserPinPosition(e.latLng);
    });


    var centerControlDiv = document.createElement('div');
    var centerControl = new CenterControl(centerControlDiv, map);

    centerControlDiv.index = 9999;
    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(centerControlDiv);

    // Add some markers to the map.
    loadItems();

    console.log("-initMap");
}


function CenterControl(controlDiv, map) {
    // Set CSS for the control border.
    var controlUI = document.createElement('div');
    controlUI.style.backgroundColor = '#fff';
    controlUI.style.border = '2px solid #fff';
    controlUI.style.borderRadius = '3px';
    controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
    controlUI.style.cursor = 'pointer';
    controlUI.style.marginBottom = '22px';
    controlUI.style.textAlign = 'center';
    controlUI.title = 'Mostrar seu local';
    controlDiv.appendChild(controlUI);

    var image = document.createElement('img');
    image.src = 'images/icoFindMe.png';
    image.height = 25;
    image.width = 25;
    image.style.paddingLeft = '5px';
    image.style.paddingRight = '5px';
    controlUI.appendChild(image);

    // Setup the click event listeners
    controlUI.addEventListener('click', function () {
        setUserPosition();
    });
}


function setUserPinPosition(positionClicked) {
    var pos = {
        lat: positionClicked.lat(),
        lng: positionClicked.lng()
    };

    myPosition.setPosition(pos);

}

function setUserPosition() {
    // Try HTML5 geolocation.
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            map.setZoom(12);
            map.setCenter(pos);

            if (myPosition) {
                myPosition.setPosition(pos);
            }
            else {
                myPosition = new google.maps.Marker({
                    map: map,
                    icon: googlePinUrl,
                    draggable: true,
                    animation: google.maps.Animation.DROP,
                    position: pos
                });
            }
        }, function () {
            setDefaultPosition();
        });
    } else {
        setDefaultPosition();
    }
}

function setDefaultPosition() {
    var pos = {
        lat: -23.5630635,
        lng: -46.6566214
    };

    map.setZoom(12);
    map.setCenter(pos);

    if (myPosition) {
        myPosition.setPosition(pos);
    }
    else {
        myPosition = new google.maps.Marker({
            map: map,
            icon: googlePinUrl,
            draggable: true,
            animation: google.maps.Animation.DROP,
            position: pos
        });
    }
}

function loadItems() {
    console.log("+loadItems");

    showProgress(loadingMapText);
    
    console.log("Mounting query...");
    var query = azureTAble.where({ deleted: false });
    console.log("Query created: " + query.toOData());

    console.log("Executing query...");
    query.take(0).includeTotalCount().read().then(function (results) {
        console.log("begin take to get count");

        var count = results.totalCount;

        console.log("Results total count: " + count);

        if (count == 0) {
            endLoad();
            return;
        }

        for (countIndex = 0; countIndex < count; countIndex += rowLimit) {
            console.log("Getting results from " + countIndex);

            query.take(rowLimit).skip(countIndex).read().then(function (items) {
                console.log("begin take to get items");

                for (itemIndex = 0; itemIndex < items.length; itemIndex++) {
                    var latitude = parseFloat(items[itemIndex].latitude);
                    var longitude = parseFloat(items[itemIndex].longitude);

                    for (addPointIndex = 0; addPointIndex < items[itemIndex].weight; addPointIndex++) {
                        // Add points
                        var item = new google.maps.LatLng(latitude, longitude);
                        points.push(item);
                    }                    
                }

                console.log("points.length: " + points.length);
                console.log("count: " + count);

                if (points.length >= count) {
                    console.log("Points length is grether or equal count");

                    if (heatmap) {
                        heatmap.setMap(null);
                    }                    

                    heatmap = new google.maps.visualization.HeatmapLayer({
                        data: points,
                        map: map
                    });
                    heatmap.set('radius', 20);

                    endLoad();
                    return;
                }

                console.log("end take to get items");
            },
            function (error) {
                console.log("Error during take to get items: " + error);
            });
        }

        console.log("end take to get count");
    }, 
    function (error) {
        console.log("Error during take to get count: " + error);
    });

    console.log("-loadItems");
}

function endLoad() {
    console.log("+endLoad");

    // closes the loading progress
    hideProgress();

    // Now the buttons can be enabled
    enableButtons();

    console.log("-endLoad");
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
                          'Error: The Geolocation service failed.' :
                          'Error: Your browser doesn\'t support geolocation.');
}

// Verifies the internet connection.
// If internet is available, returns true.
// If internet is unavailable, returns false and opens the error modal.
function verifyInternetConnection() {
    if (!hasInternet()) {
        showSimpleNotification(noInternetMessage);
        enableButtons();
        return false;
    }
    return true;
}