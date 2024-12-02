let profileUrls = [];
let requiredTotal = null;
let profileIndex = 0;
let connectionNote = "";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action == "scrapeProfiles") {
    requiredTotal = request.total;
    chrome.tabs.create({ url: sender.tab.url, active: true }, (tab) => {
      const newTabId = tab.id;
      chrome.scripting.executeScript(
        {
          target: { tabId: newTabId },
          func: scrapeAllLinks,
          args: [request.total],
        },
        (results) => {
          sendResponse({ links: results[0].result });
          chrome.tabs.remove(newTabId);
        }
      );
    });
    return true;
  }
});

async function scrapeAllLinks(total) {
  console.log("ScrapeAllLinks called with total ", total);
  let links = [];
  let currentPage = 1;
  const totalPages = Math.ceil(total / 10);

  async function getNextPage() {
    if (currentPage > totalPages) {
      return links;
    }

    links = links.concat(
      Array.from(
        document.querySelectorAll(
          ".entity-result__title-line .entity-result__title-text .app-aware-link"
        )
      ).map((link) => link.href)
    );

    if (currentPage < totalPages) {
      currentPage++;
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const nextPageButton = document.querySelector(
        `[aria-label="Page ${currentPage}"]`
      );
      try {
        if (nextPageButton) {
          nextPageButton.click();
          await new Promise((resolve) => setTimeout(resolve, 2000));
          return getNextPage();
        }
      } catch (error) {
        console.error("Error clicking next page:", error);
        chrome.runtime.sendMessage({
          action: "scrapeError",
          error: error.message,
        });
      }
    }
  }

  await getNextPage();
  return links;
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["authToken"], (result) => {
    if (!result.authToken) {
      chrome.tabs.create({ url: chrome.runtime.getURL("./extras/login.html") });
    }
  });
});

let listName = null;

chrome.runtime.onMessage.addListener((req, sender, sendR) => {
  if (req.action == "openLoginTab") {
    chrome.tabs.create({ url: chrome.runtime.getURL("./extras/login.html") });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case "loginSuccess":
      chrome.action.setPopup({ popup: "./extras/home.html" });
      break;
    case "checkAuthToken":
      chrome.storage.local.get(["authToken"], (result) => {
        sendResponse({ authToken: result.authToken });
      });
      return true;
    case "openProfiles":
      console.log("OpenProfiles received");
      profileUrls = request.urls;
      profileIndex = 0;
      listName = request.listname;
      connectionNote = request.connectionNote;

      console.log("ConnectionNote: ", connectionNote);
      console.log(listName);
      chrome.runtime.sendMessage({
        name: "connectionNote",
        connectionNote: connectionNote,
      });
      openNextProfile();
      break;
    case "connectionDone":
      const name = request.name;
      const url = profileUrls[profileIndex];
      saveDatatoDB(name, url, listName, connectionNote);
      if (sender.tab) {
        chrome.tabs.remove(sender.tab.id, () => {
          profileIndex++;
          sendProgressUpdate();
          openNextProfile();
        });
      }
      break;
  }
});

function openNextProfile() {
  if (profileIndex < requiredTotal) {
    chrome.tabs.create(
      { url: profileUrls[profileIndex], active: true },
      (tab) => {
        const tabId = tab.id;

        function listener(tabIdUpdated, changeInfo, tabUpdated) {
          if (tabIdUpdated === tabId && changeInfo.status === "complete") {
            chrome.scripting
              .executeScript({
                target: { tabId: tabId },
                files: ["connectProfile.js"],
              })
              .then(() => {
                console.log("connectProfiles Script executed on tab: ", tabId);
              })
              .catch((error) => {
                console.error("Script execution error: ", error);
                sendError(error);
              });
            chrome.tabs.onUpdated.removeListener(listener);
          }
        }

        chrome.tabs.onUpdated.addListener(listener);
      }
    );
  } else {
    console.log("All profiles processed");
    chrome.runtime.sendMessage({
      name: "updateProgress",
      current: profileUrls.length,
      total: requiredTotal,
    });
  }
}

async function sendProgressUpdate() {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  const response = await chrome.tabs.sendMessage(tab.id, {
    name: "updateProgress",
    current: profileIndex,
    total: requiredTotal,
  });
  console.log(response);
}

async function sendError(err) {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  const response = await chrome.tabs.sendMessage(tab.id, {
    name: "error",
    error: err,
  });
  console.log(response);
}

function saveDatatoDB(name, url, listName, connectionNote) {
  chrome.storage.local.get(["authToken"], async (result) => {
    if (result.authToken) {
      const headers = {
        Authorization: `Bearer ${result.authToken}`,
        "Content-Type": "application/json",
      };
      fetch("http://localhost:3000/api/request", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ name, url, listName, connectionNote }),
      })
        .then((response) => response.json())
        .then((data) => console.log(data.message))
        .catch((err) => console.error("Error saving connection request", err));
    }
  });
}

// function checkforlistName(listName) {
//   return new Promise((resolve, reject) => {
//     chrome.storage.local.get(["authToken"], async (result) => {
//       if (result.authToken) {
//         const headers = {
//           Authorization: `Bearer ${result.authToken}`,
//           "Content-Type": "application/json",
//         };
//         try {
//           const response = await fetch(
//             "https://localhost:3000/api/checkListName",
//             {
//               method: "GET",
//               headers: headers,
//               body: JSON.stringify({ listName }),
//             }
//           );
//           const data = await response.json();
//           resolve(data.exists);
//         } catch (err) {
//           console.error("Error checking list name", err);
//           reject(err);
//         }
//       } else {
//         resolve(false);
//       }
//     });
//   });
// }
