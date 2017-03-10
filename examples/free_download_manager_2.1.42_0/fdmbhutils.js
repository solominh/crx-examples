function FdmBhDownloadLinks(nhManager, links, pageUrl)
{
    var cm = new CookieManager;
    cm.getCookiesForUrls(
        links,
        function (cookies)
        {
            var task = new FdmBhCreateDownloadsTask;
            for (var i = 0; i < links.length; ++i)
            {
                var downloadInfo = new DownloadInfo(links[i], "", pageUrl);
                downloadInfo.userAgent = navigator.userAgent;
                downloadInfo.httpCookies = cookies[i];
                task.addDownload(downloadInfo);
            }
            nhManager.postMessage(task);
        });
}