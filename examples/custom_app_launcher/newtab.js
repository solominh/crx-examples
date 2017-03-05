



let getAllCallback = function (extInfos) {
  let apps = document.getElementById("apps");

  let find128Image = function (icons) {
    for (let icon in icons) {
      if (icons[icon].size == "128") {
        return icons[icon].url;
      }
    }
    return "/noicon.png";
  };

  extInfos.forEach((extInfo) => {
    // Not show extensions
    if (!extInfo.isApp) return;

    // Only show enabled apps
    if (!extInfo.enabled) return;

    // App image
    let app = document.createElement("div");
    let img = new Image();
    img.className = "image";
    img.src = find128Image(extInfo.icons);

    // Add app click event
    img.addEventListener("click", (event) => {
      chrome.management.launchApp(extInfo.id);
    });

    // App name
    let name = document.createElement("div");
    name.className = "name";
    name.textContent = extInfo.name;

    app.className = "app";
    app.appendChild(img);
    app.appendChild(name);
    apps.appendChild(app);
  })

};



document.addEventListener("DOMContentLoaded", function () {
  chrome.management.getAll(getAllCallback);
});
