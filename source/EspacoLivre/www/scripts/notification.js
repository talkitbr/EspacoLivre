var inAppBrowserbRef;

if (inAppBrowserbRef != null) {
    inAppBrowserbRef.addEventListener('loadstart', inAppBrowserbLoadStart);
    inAppBrowserbRef.addEventListener('loadstop', inAppBrowserbLoadStop);
    inAppBrowserbRef.addEventListener('loaderror', inAppBrowserbLoadError);
    inAppBrowserbRef.addEventListener('exit', inAppBrowserbClose);
}
		 
function inAppBrowserbLoadStart(event) {
	    
    navigator.notification.activityStart("Please Wait", "Its loading....");
    alert(event.type + ' - ' + event.url);
		
}

function inAppBrowserbLoadStop(event) {
    navigator.notification.activityStop();
    alert(event.type + ' - ' + event.url);
		
}

function inAppBrowserbLoadError(event) {
    navigator.notification.activityStop();
    alert(event.type + ' - ' + event.message);
}

function inAppBrowserbClose(event) {
    //navigator.notification.activityStop();
    alert(event.type);
    inAppBrowserbRef.removeEventListener('loadstart', iabLoadStart);
    inAppBrowserbRef.removeEventListener('loadstop', iabLoadStop);
    inAppBrowserbRef.removeEventListener('loaderror', iabLoadError);
    inAppBrowserbRef.removeEventListener('exit', iabClose);
}