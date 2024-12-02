document.addEventListener("DOMContentLoaded", function () {
  chrome.storage.local.get(["authToken"], function (result) {
    const statusDiv = document.getElementById("status");
    const signInButton = document.getElementById("signInButton");
    const welcomeMessage = document.getElementById("welcomeMessage");
    const dashboardButton = document.getElementById("dashboardButton");

    if (result.authToken) {
      statusDiv.style.display = "none";
      welcomeMessage.style.display = "block";
      dashboardButton.addEventListener("click", function () {
        chrome.tabs.create({ url: "./extras/home.html" });
      });
    } else {
      statusDiv.innerHTML = "You are not signed in.";
      signInButton.style.display = "block";
      signInButton.addEventListener("click", function () {
        chrome.tabs.create({ url: "./extras/login.html" });
      });
    }
  });
});
