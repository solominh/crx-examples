function FdmContextMenuManager(tabsManager)
{
    this.m_dlthis = false;
    this.m_dlall = false;
    this.m_dlselected = false;
    this.m_dlpage = false;
    this.m_dlvideo = false;
    this.m_browserHasSelection = false;
    this.m_browserSelectionLinksCount = 0;
    this.tabsManager = tabsManager;
}

FdmContextMenuManager.prototype = new ContextMenuManager();

FdmContextMenuManager.prototype.setNativeHostManager = function (mgr)
{
    this.nhManager = mgr;
    chrome.runtime.onMessage.addListener(this.onMessage.bind(this));
}

FdmContextMenuManager.prototype.createMenu = function (
    dlthis, dlall, dlselected, dlpage, dlvideo)
{
    this.m_dlthis = dlthis;
    this.m_dlall = dlall;
    this.m_dlselected = dlselected;
    this.m_dlpage = dlpage;
    this.m_dlvideo = dlvideo;
    this.createMenuImpl();
}

FdmContextMenuManager.prototype.createMenuImpl = function()
{
    ContextMenuManager.prototype.createMenu.call(
        this,
        this.shouldShowDlThis(),
        this.m_dlall, 
        this.shouldShowDlSelected(),
        this.m_dlpage, 
        this.shouldShowDlVideo());
}

FdmContextMenuManager.prototype.shouldShowDlThis = function()
{
    return this.m_dlthis && !this.shouldShowDlSelected();
};

FdmContextMenuManager.prototype.shouldShowDlSelected = function()
{
    return this.m_dlselected
            && this.m_browserHasSelection
            && this.m_browserSelectionLinksCount;
};

FdmContextMenuManager.prototype.shouldShowDlVideo = function ()
{
    return this.m_dlvideo &&
        this.tabsManager.activeTabHasVideo();
};

FdmContextMenuManager.prototype.onUserDownloadLinks = function (
    links, pageUrl)
{
    FdmBhDownloadLinks(this.nhManager, links, pageUrl);
}

FdmContextMenuManager.prototype.onUserDownloadVideo = function (
    pageUrl)
{
    if (this.nhManager.legacyPort)
    {
        this.onUserDownloadLinks([pageUrl], pageUrl);
        return;
    }
    var task = new FdmBhVideoSnifferTask;
    var req = new FdmBhSniffDllCreateVideoDownloadFromUrlRequest(
        pageUrl, "", "", "", "", "");
    task.setRequest(req);
    this.nhManager.postMessage(task);
}

FdmContextMenuManager.prototype.onMessage = function(request, sender, sendResponse)
{
    if (request.type == "fdm_selection_change")
    {
        this.m_browserSelectionLinksCount = request.selectionLinksCount;
        this.m_browserHasSelection = request.hasSelection;
        this.createMenuImpl();
    }

    if (request.type == "fdm_right_mouse_button_clicked")
    {
        setTimeout(function()
        {
            ContextMenuManager.prototype.createMenu.call(
                this,
                true,
                this.m_dlall, 
                this.shouldShowDlSelected(),
                this.m_dlpage, 
                this.shouldShowDlVideo());
        }.bind(this), 200);
    }

    if (request.type == "fdm_left_mouse_button_clicked")
    {
        setTimeout(function()
        {
            ContextMenuManager.prototype.createMenu.call(
                this,
                true,
                this.m_dlall, 
                this.shouldShowDlSelected(),
                this.m_dlpage, 
                this.shouldShowDlVideo());
        }.bind(this), 200);
    }
}