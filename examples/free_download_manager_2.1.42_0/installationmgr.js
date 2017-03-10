var EXTENSION_INSTALLED_FROM_STORE_KEY = "installedFromStore";
var EXTENSION_HAS_SHOWN_INSTALL_WINDOW = "hasShownInstallWindow";
var EXTENSION_CONNECTED_TO_NATIVE_HOST = "hasConnectedToHost";

function ExtensionInstallationMgr()
{
	chrome.runtime.onInstalled.addListener(this.onInstalled.bind(this));

	this.installedFromStore = false;
	this.hasShownInstallWindow = false;
	this.hasConnectedToHost = false;

	this.setDefaultsIfNotPresent();
	this.initialize();
}

ExtensionInstallationMgr.prototype.initialize = function() 
{
	chrome.storage.local.get(null, this.onRetrievedLocalStorage.bind(this));
};

ExtensionInstallationMgr.prototype.onInstalled = function(details)
{
	console.log('onInstalled reason: ' + details['reason']);

	// 1. If this is a first-time installation
	var reason = details['reason'];

	switch (reason)
	{
		case "install":
			// Find chrome url in history and set local storage value
			chrome.management.getSelf(function(extensionInfo) {

                var installed_from_store = false;

                chrome.tabs.query({}, function (tabs) {

                    if (tabs && tabs.length){

                        for (var i =0; i < tabs.length; i++){

                            var url = tabs[i].url;
                            if (url.indexOf("chrome.google.com/webstore/search") >= 0
                                || url.indexOf(extensionInfo.id) >= 0)
							{
                                installed_from_store = true;
                                break;
							}
                        }
                    }

                    if (installed_from_store){

                        this.setInstalledFromStore(true);
                        this.onInitialInstall();
					}
					else{

                        chrome.history.search({text: '', maxResults: 3}, function(pages) {

                            if (pages.length > 0)
                            {
                                for (var i =0; i < pages.length; i++){

                                    var url = pages[i].url;
                                    if (url.indexOf("chrome.google.com/webstore/search") >= 0
                                        || url.indexOf(extensionInfo.id) >= 0)
                                    {
                                        installed_from_store = true;
                                        break;
                                    }
                                }
                            }

                        }.bind(this));

                        if (installed_from_store)
                        	this.setInstalledFromStore(true);

                        this.onInitialInstall();
					}

                }.bind(this));

			}.bind(this));

			break;
		case "update":
			// Set local value to false, and set to true on getting a handshake from host
			this.setDefaultsIfNotPresent();
			break;
		default:
			break;
	}
};

ExtensionInstallationMgr.prototype.onInitialInstall = function() 
{

};

ExtensionInstallationMgr.prototype.setDefaultsIfNotPresent = function()
{
	chrome.storage.local.get(null, function(items) {

		if (chrome.runtime.lastError)
		{
			console.log("Error getting current local values, expect errors...");
			console.log(chrome.runtime.lastError);
			return;
		}

		var currentFromStore = items[EXTENSION_INSTALLED_FROM_STORE_KEY];
		if (currentFromStore == null || (typeof currentFromStore == 'undefined'))
		{
			this.setInstalledFromStore(false);
		}

		var currentShownInstallWindow = items[EXTENSION_HAS_SHOWN_INSTALL_WINDOW];
		if (currentShownInstallWindow == null || (typeof currentShownInstallWindow == 'undefined'))
		{
			this.setShownInstallationWindow(false);
		}

		var currentHasConnectedToHost = items[EXTENSION_CONNECTED_TO_NATIVE_HOST];
		if (currentHasConnectedToHost == null || (typeof currentHasConnectedToHost == 'undefined'))
		{
			this.setHasConnectedToNativeHost(false);
		}

	}.bind(this));
};

ExtensionInstallationMgr.prototype.setInstalledFromStore = function(value)
{
	this.installedFromStore = value;
	this.setLocalStorageValue(EXTENSION_INSTALLED_FROM_STORE_KEY, value);
};

ExtensionInstallationMgr.prototype.setShownInstallationWindow = function(value)
{
	this.hasShownInstallWindow = value;
	this.setLocalStorageValue(EXTENSION_HAS_SHOWN_INSTALL_WINDOW, value);
};

ExtensionInstallationMgr.prototype.setHasConnectedToNativeHost = function(value)
{
	this.hasConnectedToHost = value;
	this.setLocalStorageValue(EXTENSION_CONNECTED_TO_NATIVE_HOST, value);
};

ExtensionInstallationMgr.prototype.setLocalStorageValue = function(key, value)
{
	var newValue = {};
	newValue[key] = value;

	chrome.storage.local.set(newValue, this.handleStorageErrors.bind(this));
};

ExtensionInstallationMgr.prototype.onConnectedToNativeHost = function()
{
	// We detected a native host, thus set sync/local storage values as if we are the initiator
	this.setHasConnectedToNativeHost(true);
};

ExtensionInstallationMgr.prototype.handleStorageErrors = function() 
{
	if (chrome.runtime.lastError)
	{
		console.log('Error with storage operation:');
		console.log(chrome.runtime.lastError.message);
	}
};

ExtensionInstallationMgr.prototype.onRetrievedLocalStorage = function(items)
{
	var currentFromStore = items[EXTENSION_INSTALLED_FROM_STORE_KEY];
	if (!(currentFromStore == null || (typeof currentFromStore == 'undefined')))
	{
		this.installedFromStore = currentFromStore;
	}

	var currentShownInstallWindow = items[EXTENSION_HAS_SHOWN_INSTALL_WINDOW];
	if (!(currentShownInstallWindow == null || (typeof currentShownInstallWindow == 'undefined')))
	{
		this.hasShownInstallWindow = currentShownInstallWindow;
	}

	var currentHasConnectedToHost = items[EXTENSION_CONNECTED_TO_NATIVE_HOST];
	if (!(currentHasConnectedToHost == null || (typeof currentHasConnectedToHost == 'undefined')))
	{
		this.hasConnectedToHost = currentHasConnectedToHost;
	}
};

ExtensionInstallationMgr.prototype.shouldShowInstallationWindow = function()
{
	return !this.hasConnectedToHost && !this.hasShownInstallWindow && this.installedFromStore;
};