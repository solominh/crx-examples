var selectedText = "";

// RECEIVE MESSAGE FROM CONTENT SCRIPT
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  switch (request.message) {
    case 'SELECT_TEXT': {
      window.selectedText = request.data
      break;
    }

    default: {
      sendResponse({ data: 'Invalid arguments' });
      break;
    }
  }
});


// CREATE CONTEXT MENU
var addContextMenu = function () {
  var contexts = ["selection"]; // only show context menu in selection mode
  for (var i = 0; i < contexts.length; i++) {
    var context = contexts[i];
    chrome.contextMenus.create({
      "title": "Show selected text",
      "contexts": [context],
      "onclick": function () {
        alert(selectedText);
      }
    });
  }
};

addContextMenu();
