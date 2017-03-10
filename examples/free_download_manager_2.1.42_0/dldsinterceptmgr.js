function DownloadsInterceptManager()
{
    this.enable = false;
    this.skipSmaller = 0;
    this.skipExts = "";
    this.skipHosts = [];
    this.returningDownloads = [];
    this.requestsBodies = new Map;
    this.requestsHeaders = new Map;
    this.redirectedUrls = new Map;
}

DownloadsInterceptManager.prototype.initialize = function()
{
    chrome.downloads.onDeterminingFilename.addListener(
        this.onDeterminingFilename.bind(this));
    chrome.webRequest.onBeforeSendHeaders.addListener(
        this.onBeforeSendHeaders.bind(this),
        { urls: ["<all_urls>"] },
        ["requestHeaders", "blocking"]);
    // for special processing for redirects & POST requests
    chrome.webRequest.onBeforeRequest.addListener(
        this.onBeforeRequest.bind(this),
        { urls: ["<all_urls>"] },
        ["requestBody"]);
    chrome.webRequest.onSendHeaders.addListener(
        this.onSendHeaders.bind(this),
        { urls: ["<all_urls>"] },
        ["requestHeaders"]);
    chrome.webRequest.onHeadersReceived.addListener(
        this.onHeadersReceived.bind(this),
        { urls: ["<all_urls>"] },
        ["blocking", "responseHeaders"]);
}

DownloadsInterceptManager.prototype.returningDownloadIndexByOriginalUrl = function(
    url)
{
    for (var i = 0; i < this.returningDownloads.length; ++i)
    {
        if (this.returningDownloads[i].originalUrl == url)
            return i;
    }
    return -1;
}

DownloadsInterceptManager.prototype.onDeterminingFilename = function(
    downloadItem, suggest)
{
    if (!this.enable)
        return;

    /* 
        According to documentation, downloadItem.totalBytes should be -1 when it is unknown: 
        https://developer.chrome.com/extensions/downloads#type-DownloadItem 
        However, here's an example where it is 0: http://www.sample-videos.com/ -- any file
    */

    if (downloadItem.totalBytes != 0 && downloadItem.totalBytes != -1 && downloadItem.totalBytes < this.skipSmaller)
        return;

    if (this.skipExts != "")
    {
        var fileExt = /\.([\w\d]+)$/g;
        var match = fileExt.exec(downloadItem.filename);
        if (match)
        {
            if (this.skipExts.indexOf(match[0].toLowerCase()) != -1 || // .ext
                this.skipExts.indexOf(match[1].toLowerCase()) != -1)   //  ext
            {
                return;
            }
        }
    }

    if (this.skipHosts)
    {
        var host = getHostFromUrl(downloadItem.url).toLowerCase();

        var skip = false;
        this.skipHosts.forEach(function(hostToSkip) {

            var domainWithSubdomains = new RegExp('^(?:[\\w\\d\\.]*\\.)?' + hostToSkip + '$', 'i');
            var match = domainWithSubdomains.exec(host);
            if (match)
                skip = true;
        });

        if (skip)
            return;
    }

    // workaround for other possible hosts like MEGA.nz
    // Added blob to exclude other protocols as well
    if (downloadItem.url.toLowerCase().indexOf("filesystem:") == 0 
        || downloadItem.url.toLowerCase().indexOf("blob:") == 0
        || downloadItem.url.toLowerCase().indexOf("data:") == 0)
        return;

    var returningDownloadIndex = this.returningDownloadIndexByOriginalUrl(
        downloadItem.url);
    if (returningDownloadIndex != -1)
    {
        if (!--this.returningDownloads[returningDownloadIndex].refCount)
            this.returningDownloads.remove(returningDownloadIndex);
        return;
    }
    
    chrome.downloads.cancel(downloadItem.id, function() {
        chrome.downloads.erase({ id: downloadItem.id })
    });

    this.onDownloadIntercepted(new DownloadInfo(
        downloadItem.url,
        this.pullRedirectUrl(downloadItem.url),
        downloadItem.referrer));

    return true;
}

DownloadsInterceptManager.prototype.onDownloadIntercepted = function(
    downloadInfo)
{
    
}

DownloadsInterceptManager.prototype.returnDownload = function(
    downloadInfo)
{
    downloadInfo.refCount = downloadInfo.httpPostData ? 2 : 1;
    this.returningDownloads.push(downloadInfo);

    var info = {};
    info.url = downloadInfo.originalUrl;
    // chrome does not accept referer here
    // see workaround in this.onBeforeSendHeaders.
    //info.headers = [{ name: "Referer", value: downloadInfo.httpReferer }];
    if (downloadInfo.httpPostData && downloadInfo.httpPostData != "")
    {
        info.method = "POST";
        info.body = downloadInfo.httpPostData;
    }

    chrome.downloads.download(
        info,
        function (downloadId)
        {
            if (!downloadId)
                alert(chrome.i18n.getMessage("addingAfterCancelFailed"));
        });
}

DownloadsInterceptManager.prototype.onBeforeSendHeaders = function(
    details)
{
    // set the Referer header when bringing the download back to Chrome

    var returningDownloadIndex = this.returningDownloadIndexByOriginalUrl(
        details.url);
    if (returningDownloadIndex == -1)
        return;

    var referer = this.returningDownloads[returningDownloadIndex].httpReferer;

    var isRefererSet = false;
    var headers = details.requestHeaders;
    var blockingResponse = {};

    for (var i = 0; i < headers.length; ++i)
    {
        if (headers[i].name.toLowerCase() == "referer")
        {
            headers[i].value = referer;
            isRefererSet = true;
            break;
        }
    }

    if (!isRefererSet) {
        headers.push({
            name: "Referer",
            value: referer
        });
    }

    blockingResponse.requestHeaders = headers;
    return blockingResponse;
}

DownloadsInterceptManager.prototype.onBeforeRequest = function(details)
{
    if (details.method == "POST")
    {
        var body = "&";
        if (undefined != details.requestBody && undefined != details.requestBody.formData)
        {
            for (var field in details.requestBody.formData)
            {
                for (var i = 0; i < details.requestBody.formData[field].length; ++i)
                {
                    body += field + "=" +
                            encodeURIComponent(details.requestBody.formData[field][i]) + 
                            "&";
                }
            }
        }
        this.requestsBodies.set(details.requestId, body);
        setTimeout(this.requestsBodies.delete.bind(this.requestsBodies, details.requestId), 120000);
    }
}

DownloadsInterceptManager.prototype.onSendHeaders = function(
    details)
{
    if (details.method == "POST")
    {
        this.requestsHeaders.set(details.requestId, details.requestHeaders);
        setTimeout(this.requestsHeaders.delete.bind(this.requestsHeaders, details.requestId), 120000);
    }
}

DownloadsInterceptManager.prototype.onHeadersReceived = function(
    details)
{
    if (details.statusLine.indexOf("301") != -1 || details.statusLine.indexOf("302") != -1)
    // since v43
    // if (details.statusCode == 301 || details.statusCode == 302)
        this.onRedirectHeadersReceived(details);
    
    if (details.method == "POST")
        return this.onPostHeadersReceived(details);
}

DownloadsInterceptManager.prototype.onRedirectHeadersReceived = function(
    details)
{
    var url = "";
    for (var i = 0; i < details.responseHeaders.length; ++i)
    {
        if (details.responseHeaders[i].name.toLowerCase() == "location")
        {
            url = details.responseHeaders[i].value;
            var re = /http(s?):\/\//;
            // if Path is relative, then add domain.
            if (!re.test(url))
                url = normalizeRedirectURL(url, details.url);
            break;
        }
    }
    if (url != "")
        this.redirectedUrls.set(details.url, url);
}

DownloadsInterceptManager.prototype.pullRedirectUrl = function(url)
{
    var result;
    if (this.redirectedUrls.has(url))
    {
        result = this.redirectedUrls.get(url);
        this.redirectedUrls.delete(url);
    }
    return result || "";
}

DownloadsInterceptManager.prototype.onPostHeadersReceived = function(
    details)
{
    var result;

    if (this.enable)
    {
        var file = false;

        if (details.type != "xmlhttprequest")
        {
            for (var i = 0; i < details.responseHeaders.length; ++i)
            {
                if (details.responseHeaders[i].name.toLowerCase() == "content-disposition")
                    file = true;
                // prevent AJAX from breaking
                if (details.responseHeaders[i].name.toLowerCase() == "content-type" &&
                    (details.responseHeaders[i].value.toLowerCase().indexOf("json") != -1 ||
                    details.responseHeaders[i].value.toLowerCase().indexOf("text") != -1 ||
                    details.responseHeaders[i].value.toLowerCase().indexOf("javascript") != -1 ||
                    details.responseHeaders[i].value.toLowerCase().indexOf("application/x-protobuf") != -1))
                {
                    file = false;
                    break;
                }
            }
        }

        if (file)
        {
            var returningDownloadIndex = this.returningDownloadIndexByOriginalUrl(
                details.url);
            if (returningDownloadIndex != -1)
            {
                if (!--this.returningDownloads[returningDownloadIndex].refCount)
                    this.returningDownloads.remove(returningDownloadIndex);
            }
            else
            {
                var referrer = "";
                if (this.requestsHeaders.has(details.requestId))
                {
                    var r = this.requestsHeaders.get(details.requestId);
                    for (var j = 0; j < r.length; ++j)
                    {
                        var rheader = r[j];
                        if (rheader.name.toLowerCase() == "referrer" ||
                            rheader.name.toLowerCase() == "referer")
                            referrer = rheader.value;
                    }
                }

                this.onDownloadIntercepted(new DownloadInfo(
                    details.url,
                    this.pullRedirectUrl(details.url),
                    referrer,
                    this.requestsBodies.get(details.requestId)));
                chrome.tabs.update({ 'url': referrer });
                result = { 'cancel': true };
            }
        }
    }

    this.requestsBodies.delete(details.requestId);
    this.requestsHeaders.delete(details.requestId);

    return result;
}
