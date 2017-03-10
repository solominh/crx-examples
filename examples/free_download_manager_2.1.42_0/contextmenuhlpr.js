document.addEventListener("selectionchange", dealWithSelection, true);

function dealWithSelection()
{
    var linksCount = 0;
    var selection = window.getSelection();
    var links = null;
    if (selection.rangeCount)
    {
        var dv = document.createElement('div');
        for (var i = 0; i < selection.rangeCount; ++i)
        {
          dv.appendChild(selection.getRangeAt(i).cloneContents());
        }

        var smth = dv.getElementsByTagName('a');

        links = [].map.call(dv.getElementsByTagName('a'), function(n) { 
            return n.href;
        });
        linksCount = links.length;
    }

    chrome.runtime.sendMessage({
        type: "fdm_selection_change", 
        hasSelection: selection.rangeCount != 0,
        selectionLinksCount: linksCount,
        selectionLinks: links,
    });
};

document.addEventListener("mousedown", function(event){

    if (event.button == 2)
    {
        chrome.runtime.sendMessage({
            type: "fdm_right_mouse_button_clicked",
        });
    }

    if (event.button == 1)
    {
        chrome.runtime.sendMessage({
            type: "fdm_left_mouse_button_clicked",
        });
    }
});

// http://stackoverflow.com/a/19519701
var vis = (function(){
    var stateKey, eventKey, keys = {
        hidden: "visibilitychange",
        webkitHidden: "webkitvisibilitychange",
        mozHidden: "mozvisibilitychange",
        msHidden: "msvisibilitychange"
    };
    for (stateKey in keys) {
        if (stateKey in document) {
            eventKey = keys[stateKey];
            break;
        }
    }
    return function(c) {
        if (c) document.addEventListener(eventKey, c);
        return !document[stateKey];
    }
})();

vis(function(){
    var visible = vis();
    if (visible)
    {
        dealWithSelection();
    }
});

