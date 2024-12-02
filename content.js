function showCard(selector) {
  console.log("showCard function called"); // Debug statement
  const asideElement = document.querySelector(selector);
  if (!asideElement) {
    console.log("asideElement not found"); // Debug statement
    return;
  }

  const formContainer = document.createElement("div");
  formContainer.id = "connectionForm";

  const formHTML = `

  <div id="main-card-container" class="main-card-container">
  <div class="extension-card" >
  <div class="logo-container">
  <img id="logo" alt="Logo" class="logo">
  </div>
  <h1 class="title">LinkedIn <br> SmartConnect</h1>
  </div>
  <hr class="divider">
  <div id="overlay-card" class="curtain hidden">
      <div class="curtain-content">
      <i class="curtain-icon fas fa-info-circle"></i>
          <h2>You are not signed in</h2>
          <p>Please sign in to access these features.</p>
          <button id="login-button">Sign In</button>
      </div>
  </div>
  
      <div id="progressContainer" style="display:none; margin-top: 10px;">
      <p id="progressCounter">0/0 connections made</p>
      <p id="feedbackMessage"></p>
  </div>
  <div id="inputDiv">
  <label for="numPeople" id="l-numberofpeople" style="font-weight: bold;">Number of People:</label>
  <input type="radio" id="r1" name="number-of-people" value="5">
  <label for="r1">5</label>
  <input type="radio" id="r2" name="number-of-people" value="10">
  <label for="r2">10</label>
  <input type="radio" id="r3" name="number-of-people" value="50">
  <label for="r3">50</label>
  <input type="radio" id="numCustom" name="number-of-people" value="custom">
  <label for="numCustom">Custom</label> <input type="number" id="custom-input" class="custom-input" name="custom-number" min="1" style="display: none;"><br>
  </div>
    <div class="extension-card2">
    <div id="noteTitle">
    <label for="connectionNote" id="connectionNoteClass" style="font-weight: bold; flex: 0;">Connection Note:</label>
    </div>
    <button id="generateAI" style="flex: 1;">⭐Generate with AI</button>
    </div>
    <textarea id="connectionNote" name="connectionNote" rows="4" cols="50" maxlength="200" style="height: 86px; flex: 1;"></textarea>
    <small><span id="wordCount">0/200</span></small><br>
    <button id="startConnecting">Start Connecting</button>

     <button id="resetForm" style="display:none;">Reset</button>
      
    </div>
    `;

  formContainer.innerHTML = formHTML;
  asideElement.prepend(formContainer);

  const logoImage = document.getElementById("logo");
  const url = chrome.runtime.getURL("assets/logo.png");
  logoImage.src = url;

  addGenerateAIButtonListener();
  addStartConnectingButtonListener();
  addCustomInputEventListener();
  addConnectionNoteInputEventListener();
  addLoginButtonListener();
  addResetButtonListener();
}

function addLoginButtonListener() {
  const loginButton = document.getElementById("login-button");
  if (loginButton) {
    loginButton.addEventListener("click", () => {
      console.log("SignIn button clicked");
      chrome.runtime.sendMessage({ action: "openLoginTab" });
    });
  }
}

function addGenerateAIButtonListener() {
  console.log("Adding Generate AI button listener"); // Debug statement
  const generateAIButton = document.getElementById("generateAI");
  if (!generateAIButton) {
    // console.log("generateAIButton not found"); // Debug statement
    return;
  }

  generateAIButton.addEventListener("click", () => {
    // console.log("Generating with AI");
  });
}

function addStartConnectingButtonListener() {
  const startConnectingButton = document.getElementById("startConnecting");
  if (!startConnectingButton) {
    return;
  }

  startConnectingButton.addEventListener("click", () => {
    console.log("Started connecting");
    let listName = prompt("Enter List Name");
    if (!listName || listName == "") {
      alert("Please enter a list name");
      return;
    }
    proceedWithConnecting(listName);
  });
}
function addResetButtonListener() {
  const resetButton = document.getElementById("resetForm");
  if (!resetButton) {
    return;
  }

  resetButton.addEventListener("click", () => {
    console.log("Resetting form");
    resetButton.style.display = "none"; // Hide reset button after resetting
    showElements([
      "inputDiv",
      "wordCount",
      "custom-input",
      "connectionNote",
      "generateAI",
      "startConnecting",
      "connectionNoteClass",
      "numPeople",
    ]);
    document.getElementById("progressContainer").style.display = "none";
  });
}

function proceedWithConnecting(listName) {
  document.getElementById("progressContainer").style.display = "block";

  hideElements([
    "inputDiv",
    "numCustom",
    "wordCount",
    "custom-input",
    "connectionNote",
    "generateAI",
    "startConnecting",
    "connectionNoteClass",
    "numPeople",
  ]);

  const resetButton = document.getElementById("resetForm");
  if (resetButton) {
    resetButton.style.display = "block";
  }

  let maxConnections;
  if (document.getElementById("r1").checked) {
    maxConnections = document.getElementById("r1").value;
  } else if (document.getElementById("r2").checked) {
    maxConnections = document.getElementById("r2").value;
  } else if (document.getElementById("r3").checked) {
    maxConnections = document.getElementById("r3").value;
  } else if (document.getElementById("numCustom").checked) {
    let num = document.getElementById("custom-input").value;
    maxConnections = parseInt(num, 10);
  }
  console.log("MaxConnections: ", maxConnections);
  if (maxConnections > 0) {
    chrome.runtime.sendMessage(
      { action: "scrapeProfiles", total: maxConnections },
      (response) => {
        console.log("Profile links:", response.links);
        chrome.runtime.sendMessage({
          type: "openProfiles",
          urls: response.links,
          listname: listName,
          connectionNote: connectionNote,
        });
      }
    );
  }
}

function hideElements(ids) {
  ids.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.style.display = "none";
    }
  });
}

function showElements(ids) {
  ids.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.style.display = "block";
    }
  });
}

function addCustomInputEventListener() {
  const customRadioButton = document.getElementById("numCustom");
  const customInput = document.querySelector(".custom-input");
  const radioButtons = document.querySelectorAll(
    'input[name="number-of-people"]'
  );

  if (!customRadioButton || !customInput || radioButtons.length === 0) {
    return;
  }

  radioButtons.forEach((radioButton) => {
    radioButton.addEventListener("change", () => {
      customInput.style.display = customRadioButton.checked
        ? "inline-block"
        : "none";
    });
  });
}
let connectionNote = "";
function addConnectionNoteInputEventListener() {
  console.log("Adding Connection Note Input event listener"); // Debug statement
  const connectionNoteInput = document.getElementById("connectionNote");
  const wordCountSpan = document.getElementById("wordCount");

  if (!connectionNoteInput || !wordCountSpan) {
    // console.log("Connection note input or word count span not found"); // Debug statement
    return;
  }

  connectionNoteInput.addEventListener("input", () => {
    wordCountSpan.textContent = connectionNoteInput.value.length + "/200";
  });
  connectionNote = connectionNoteInput.value;
}

function checkAndShowCard(selector) {
  // console.log("checkAndShowCard function called"); // Debug statement
  const asideElement = document.querySelector(selector);
  const connectionForm = document.getElementById("connectionForm");

  if (asideElement && !connectionForm) {
    showCard(selector);
  }
}

setInterval(() => {
  if (isOnPeoplePage()) {
    checkAndShowCard(".scaffold-layout__aside");
    seeForToken();
  } else {
    const connectionForm = document.getElementById("connectionForm");
    if (connectionForm) {
      connectionForm.remove();
    }
  }
}, 1000);

function isOnPeoplePage() {
  return window.location.href
    .toLowerCase()
    .startsWith("https://www.linkedin.com/search/results/people");
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const progressCounter = document.getElementById("progressCounter");
  const feedbackMessage = document.getElementById("feedbackMessage");

  if (message.name === "updateProgress") {
    console.log("Update progress message received");
    if (progressCounter) {
      progressCounter.style.display = "block";
      progressCounter.textContent = `${message.current}/${message.total} connections made`;
      sendResponse({ status: true });
    }
    if (feedbackMessage && message.current === message.total) {
      feedbackMessage.textContent =
        "All connection requests were sent successfully!";
      sendResponse({ status: true });
    }
  } else if (message.name === "error") {
    console.log("Error message received: ", message);
    if (feedbackMessage) {
      feedbackMessage.textContent = `Error: ${message.error}`;
      sendResponse({ status: false });
    }
  }
});

function seeForToken() {
  chrome.storage.local.get(["authToken"], async (result) => {
    if (!result.authToken) {
      document.getElementById("overlay-card").classList.remove("hidden");
    } else {
      document.getElementById("overlay-card").classList.add("hidden");
      document.getElementById("connectionForm").style.display = "block";
      checkAndShowCard(".scaffold-layout__aside");
    }
  });
}

setInterval(() => {
  chrome.storage.local.get(["authToken"], (result) => {
    const overlayCard = document.getElementById("overlay-card");
    if (
      !result.authToken &&
      overlayCard &&
      overlayCard.style.display === "none"
    ) {
      overlayCard.style.display = "block";
    }
  });
}, 1000);
