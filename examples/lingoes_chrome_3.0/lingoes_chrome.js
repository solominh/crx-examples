var lingoes_client_x = 0;
var lingoes_client_y = 0;

function lingoes_update_pos(e) {
  lingoes_client_x = e.clientX;
  lingoes_client_y = e.clientY;
  //console.log("x=%d, y=%d\n", lingoes_client_x, lingoes_client_y);
}

function lingoes_get_capture_text(x, y) {
  //console.log("x=%d, y=%d\n", lingoes_plugin_x, lingoes_plugin_y);
  //var x = lingoes_plugin_x;
  //var y = lingoes_plugin_y;
  var a = document.caretRangeFromPoint(x, y);

  if (a) {
    var so = a.startOffset;
    var eo = a.endOffset;
    var g = a.cloneRange();
    var maxchar = 100;
    var pos = so;

    // Prevent invalid at TEXTAREA,INPUT,SELECT
    if (!a.startContainer.data)
      return "";

    //console.log(a.startContainer.data);
    if (so <= 0 || eo >= a.endContainer.data.length)
      return "";

    var n1 = 0;
    if (a.startContainer.data) {
      for (; so > 0 && n1 < maxchar;) {
        so--;
        n1++;
      }
      g.setStart(a.startContainer, so);
    }

    pos -= (so + 1);
    //console.log("pos=%d, n=%d, d=%n\n", pos, n1, d);

    var n2 = 0;
    if (a.endContainer.data) {
      for (; eo < a.endContainer.data.length && n2 < maxchar;) {
        eo++;
        n2++;
      }
      g.setEnd(a.endContainer, eo);
    }

    if (n1 > 0 || n2 > 0) {
      var str = g.toString();
      if (str.length >= 0) {
        //console.log("pos=%d, str=%s\n", pos, str);
        return pos + ":" + str;
      }
    }
  }

  return "";
}

function lingoes_get_select_text() {
  var str = String(window.getSelection());
  if (str) {
    str = str.replace(/^\s*/, "").replace(/\s*$/, "");

    if (str != "")
      return "0:" + str;
  }

  return "";
}

// Listener message from background.js
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.cmd == "text_capture") {
    // On Capture Text from background.js
    var text = lingoes_get_capture_text(lingoes_client_x, lingoes_client_y, message.max_length);
    if (text != "") {
      //console.log('CAPTURE: ' + text);
      sendResponse(text);
    }
  }
  else if (message.cmd == "text_select") {
    // On Select Text from background.js
    var text = lingoes_get_select_text(message.max_length);
    if (text != "") {
      //console.log('SELECT: ' + text);
      sendResponse(text);
    }
  }
  else {
    //console.log("on message: " + message.cmd);
  }

});


// "content_scripts": [ {"run_at": "document_start" } ]
// In the case of "document_start", the files are injected after any files from css, 
// but before any other DOM is constructed or any other script is run. 
document.addEventListener("mousemove", lingoes_update_pos, false);
