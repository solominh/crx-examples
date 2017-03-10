
function FDMsettings(){

    this.showVideoBtn = "0";
    // this.showVideoBtnFlash = "1";
    // this.showVideoBtnHTML5 = "1";
}

FDMsettings.prototype.loadSettings = function () {

    chrome.storage.local.get(
        ['showVideoBtn' /*, 'showVideoBtnFlash', 'showVideoBtnHTML5' */],
        function(res){

            if (res.showVideoBtn)
                this.showVideoBtn = res.showVideoBtn;
            // if (res.showVideoBtnFlash === "0")
            //     this.showVideoBtnFlash = res.showVideoBtnFlash;
            // if (res.showVideoBtnHTML5 === "0")
            //     this.showVideoBtnHTML5 = res.showVideoBtnHTML5;

            var c1 = document.getElementById('showVideoBtn');
            // var c2 = document.getElementById('showVideoBtnFlash');
            // var c3 = document.getElementById('showVideoBtnHTML5');

            c1.checked = this.showVideoBtn === "1";
            // c2.checked = this.showVideoBtnFlash === "1";
            // c3.checked = this.showVideoBtnHTML5 === "1";

            c1.addEventListener('change', function(e){
                fdmsettings.setSetting('showVideoBtn', e.target);
            });
            // c2.addEventListener('change', function(e){
            //     fdmsettings.setSetting('showVideoBtnFlash', e.target);
            // });
            // c3.addEventListener('change', function(e){
            //     fdmsettings.setSetting('showVideoBtnHTML5', e.target);
            // });

        }.bind(this));
};

FDMsettings.prototype.setSetting = function (name, target) {

    var value = target.checked ? "1" : "0";

    this[name] = value;

    var changes = {};
    changes[name] = value;
    chrome.storage.local.set(changes);

    var new_settings = {
        showVideoBtn: this.showVideoBtn
        // showVideoBtnFlash: this.showVideoBtnFlash,
        // showVideoBtnHTML5: this.showVideoBtnHTML5
    };

    chrome.runtime.sendMessage({type: "change_video_btn_settings", new_settings: new_settings})

    chrome.tabs.query({}, function (tabs) {

        if (tabs && tabs.length){

            for (var i =0; i < tabs.length; i++){

                chrome.tabs.sendMessage(tabs[i].id, {type: "change_video_btn_settings", new_settings: new_settings});
            }
        }

    }.bind(this));
};

FDMsettings.prototype.onMessage = function (request, sender, sendResponse) {

    if (request.type == "change_video_btn_settings"){

        var new_settings = request.new_settings;

        var c1 = document.getElementById('showVideoBtn');
        var current_value = c1.checked ? "1" : "0";

        if (current_value != new_settings.showVideoBtn)
            c1.checked = new_settings.showVideoBtn === '1';
    }
};

FDMsettings.prototype.initialize = function () {

    this.loadSettings();
    chrome.runtime.onMessage.addListener(this.onMessage.bind(this));
};


var fdmsettings = new FDMsettings;
fdmsettings.initialize();
