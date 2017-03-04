document.addEventListener('mouseup', function (event) {
  var selectedText = window.getSelection().toString();

  // SHOULD SEND EMPTY STRING IF NO TEXT SELECTED
  // if (selectedText.length <= 0) return;

  // Send message to extension
  chrome.extension.sendRequest({
    'message': 'SELECT_TEXT',
    'data': selectedText
  }, function (response) {
    console.log(response);
  });
})
