function FdmDownloadsInterceptManager()
{
    this.allowBrowserDownload = true;
}

FdmDownloadsInterceptManager.prototype = new DownloadsInterceptManager();

FdmDownloadsInterceptManager.prototype.setNativeHostManager = function(mgr)
{
    this.nhManager = mgr;
}

FdmDownloadsInterceptManager.prototype.onDownloadIntercepted = function(
    downloadInfo)
{
    downloadInfo.userAgent = navigator.userAgent;
    var cm = new CookieManager;
    cm.getCookiesForUrl(
        downloadInfo.url,
        function (cookies)
        {
            downloadInfo.httpCookies = cookies;
            var task = new FdmBhCreateDownloadsTask;
            task.create_downloads.catchedDownloads = "1";
            task.create_downloads.waitResponse = "1";
            task.addDownload(downloadInfo);
            this.nhManager.postMessage(
                task,
                function (resp)
                {
                    var cancelled = resp.result == "0";
                    if (resp.error || (cancelled && this.allowBrowserDownload))
                        this.returnDownload(downloadInfo);
                }.bind(this));
        }.bind(this));
}
