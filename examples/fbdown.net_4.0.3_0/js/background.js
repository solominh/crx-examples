
window.addEventListener( "load", function(){
	
	fvdSingleDownloader.Media.init();
	fvdSingleDownloader.MainButton.refreshMainButtonStatus();
	
	if( fvdSingleDownloader.Utils.isVersionChanged() && !fvdSingleDownloader.noWelcome )	{
		var url = null;

		if( fvdSingleDownloader.noYoutube ) 	{
			
			if (fvdSingleDownloader.Prefs.get("install_time") == 0)  {
				url = "http://fbdown.net/ext/install.php";
			}
			else {
			}			
			
		}	
		else {
			
			if (fvdSingleDownloader.Prefs.get("install_time") == 0) 	{
				url = "www.fbdown.net/ext/install.php";
			}
			else	{
			}			
		}	
		
		if( url )	{
			chrome.tabs.create({
						url: url,
						active: true
					});			
		}

	}
	
	if( fvdSingleDownloader.Prefs.get( "install_time" ) == 0 )	{
		fvdSingleDownloader.Prefs.set( "install_time", new Date().getTime() )
	}
	
	// устанавливаем страницу при удаление
	chrome.runtime.setUninstallURL("http://fbdown.net/ext/uninstall.php");

	chrome.tabs.query( {
			active: true,
			currentWindow: true
		}, function( tabs ){
					if( tabs.length > 0 )	{
						set_popup(tabs[0].id);
					}
	} );


	
}, false );

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	if (tab.status == 'complete') {
		set_popup(tabId);
	}
});
chrome.tabs.onActivated.addListener(function (tab) {
	set_popup(tab.tabId);
});
var set_popup = function (tabId, callback) {
	chrome.tabs.query( {
			active: true,
			currentWindow: true
		}, function( tabs ){
					if( tabs.length > 0 )	{
						for (var i=0; i<tabs.length; i++) {
							if (tabs[i].id == tabId) {	
							
								var url = tabs[i].url;
								var flag = true;
								var detector = new FVD_site_detector();
								if ( url.indexOf( 'chrome://' ) != -1 )  flag = false;
								
								if( fvdSingleDownloader.noYoutube && 
									fvdSingleDownloader.MainButton.isYoutubeUrl(url) )  flag = false;
									
								if( detector.is_adult(url) )  flag = false
								
								if (flag) {
									chrome.browserAction.setPopup({ popup: 'popup.html' });	
								}
								else {	
									chrome.browserAction.setPopup({ popup: 'noload.html' });
								}
							
							}
						}	
					}
	} ); 
};



// ------------------------------------
chrome.management.getAll(function(extensions){

        for (var i in extensions) {
//            if (extensions[i].enabled) 	{
				if ( extensions[i].name.indexOf("FVD Suggestions") != -1) {
//console.log(extensions[i]);
					if ('MainButton' in fvdSingleDownloader) {
						fvdSingleDownloader.MainButton.isGtaSuggestion = true;
					}	
				}	
				if ( extensions[i].name.indexOf("Smart Pause for YouTube") != -1) {
					if ('MainButton' in fvdSingleDownloader) {
						fvdSingleDownloader.MainButton.isSmartPause = true;
					}	
				}	
//            }
        }
		
});

// ----------------------------------------------
navigateMessageDisabled = function(uri){
	var url = 'http://fbdown.net/ext/unsupported.php?url=' + uri;
	
	chrome.tabs.query( 	{  }, function( tabs ){
		
					if( tabs.length > 0 )	{
						for (var i=0; i<tabs.length; i++) {
							if ( tabs[i].url.indexOf( "/ext/unsupported.php" ) != -1 ) {	
								chrome.tabs.update( tabs[i].id, { active: true, url: url } );
								return;
							}
						}
						
						chrome.tabs.create( {	active: true,
												url: url
											}, function( tab ){ });
					}
	} );
	
}
	
// ------------------------------------

	

