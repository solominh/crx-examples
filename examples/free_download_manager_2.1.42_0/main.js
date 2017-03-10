chrome.runtime.onMessageExternal.addListener(function (request, sender, sendResponse)
{
    if (sender.url.toLowerCase().indexOf("http://files2.freedownloadmanager.org") == -1)
        return;
    if (request == "uninstall")
    {
        chrome.management.uninstallSelf();
    }
});


var fdmext = new FdmExtension;
fdmext.initialize();
