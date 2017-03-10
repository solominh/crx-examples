// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

function normalizeRedirectURL(urlRedirect, url)
{
    if (urlRedirect.indexOf('//') === 0 && urlRedirect.indexOf('.') > 0){

        var protocolPos = url.indexOf('//');
        return url.substring(0, protocolPos) + urlRedirect;
    }

    if (urlRedirect.lastIndexOf('.') > 0)
    {
        var protocolPos = url.indexOf('//');
        return url.substring(0, protocolPos + 2) + urlRedirect;
    }

    var redirectRequest = urlRedirect.indexOf('?');

    if (redirectRequest === 0){

        var urlQuery = url.indexOf('?');
        if (urlQuery >= 0)
            return url.substring(0, urlQuery) + urlRedirect;
        else
            return url + urlRedirect;
    }

    var lastDot = url.lastIndexOf('.');

    var baseUrl = url;
    var firstSlash = url.indexOf('/', lastDot);
    if (firstSlash >= 0)
        baseUrl = url.substring(0, firstSlash);

    var firstRequestSlash = urlRedirect.indexOf('/');

    if (firstRequestSlash === 0)
        return baseUrl + urlRedirect;
    else
        return baseUrl + '/' + urlRedirect;
}

function getHostFromUrl(url)
{
    return url.toString().replace(/^.*\/\/([^\/?#:]+).*$/, '$1');
}
