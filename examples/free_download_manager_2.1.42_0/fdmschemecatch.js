window.onclick = function (e)
{
    if (e.target.nodeName == 'A' && e.target.href.substr(0, 4) == 'fdm:')
    {
        chrome.runtime.sendMessage({ type: "fdm_scheme", url: e.target.href});
        return false;
    }
};
