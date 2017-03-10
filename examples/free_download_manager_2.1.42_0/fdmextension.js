function FdmExtension()
{
    this.installationManager = new ExtensionInstallationMgr;
    this.installationManager.onInitialInstall = this.onInitialInstall.bind(this);

    this.nhManager = new FdmNativeHostManager;
    this.nhManager.onReady = this.onNativeHostReady.bind(this);
    this.nhManager.onNativeHostNotFound = this.onNativeHostNotFound.bind(this);

    this.nhManager.onGotSettings = this.onGotSettings.bind(this);

    this.tabsManager = new TabsManager(this.nhManager);

    this.cmManager = new FdmContextMenuManager(this.tabsManager);
    this.cmManager.setNativeHostManager(this.nhManager);

    this.diManager = new FdmDownloadsInterceptManager;
    this.diManager.setNativeHostManager(this.nhManager);

    this.fdmSchemeHandler = new FdmSchemeHandler(this.nhManager);

    this.ntwrkMon = new FdmNetworkRequestsMonitor(this.nhManager);

    // this.videoBtn = new FdmVideoBtn(this.nhManager);
}

FdmExtension.prototype.initialize = function()
{
    this.nhManager.onInitialized = this.nhManagerInitialized.bind(this);
    this.nhManager.initialize();
};

FdmExtension.prototype.nhManagerInitialized = function()
{
    this.diManager.initialize();
    this.fdmSchemeHandler.initialize();
    this.ntwrkMon.initialize();
    this.tabsManager.initialize();
    // this.videoBtn.initialize();
};

FdmExtension.prototype.onNativeHostReady = function()
{
    this.installationManager.onConnectedToNativeHost();

    this.nhManager.postMessage(
        new FdmBhUiStringsTask,
        this.onGotUiStrings.bind(this));

    this.nhManager.postMessage(
        new FdmBhQuerySettingsTask,
        this.onGotSettings.bind(this));
};

FdmExtension.prototype.onGotSettings = function(resp)
{
    this.settings = resp.settings;

    this.cmManager.createMenu(
        this.settings.browser.menu.dllink != "0",
        this.settings.browser.menu.dlall != "0",
        this.settings.browser.menu.dlselected != "0",
        this.settings.browser.menu.dlpage != "0",
        this.settings.browser.menu.dlvideo != "0");

    this.diManager.enable = this.settings.browser.monitor.enable != "0";
    this.diManager.skipSmaller = Number(this.settings.browser.monitor.skipSmallerThan);
    this.diManager.skipExts = this.settings.browser.monitor.skipExtensions.toLowerCase();
    if (typeof this.settings.browser.monitor.skipServers == 'string')
        this.diManager.skipHosts = this.settings.browser.monitor.skipServers.trim().toLowerCase().split(' ');
    this.diManager.allowBrowserDownload = this.settings.browser.monitor.allowDownload != "0";
};

FdmExtension.prototype.onGotUiStrings = function(resp)
{
    this.uiStrings = resp.strings;
};

FdmExtension.prototype.onNativeHostNotFound = function()
{
    if (this.installationManager.shouldShowInstallationWindow())
    {
        this.installationManager.setShownInstallationWindow(true);
        this.showFdmInstallationWindow();
    }
};

FdmExtension.prototype.showFdmInstallationWindow = function()
{
    chrome.windows.create(
        {
            'url': "chrome-extension://" + chrome.i18n.getMessage("@@extension_id") + "/install.html",
            'type': 'popup',
            'width': 740,
            'height': 500
        });
};

FdmExtension.prototype.onInitialInstall = function()
{
    // Restart Native Host initialization
    this.nhManager.restartIfNeeded();
}
