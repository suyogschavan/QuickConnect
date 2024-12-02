async function waitForElement(selector, intervalTime = 50) {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const element = document.querySelector(selector);
      if (element) {
        clearInterval(interval);
        resolve(element);
      }
    }, intervalTime);
  });
}

let note = "";

chrome.runtime.onMessage.addListener((req, sender, response) => {
  if (req.name === "connectionNote") {
    note = req.connectionNote;
    console.log(`Received connection note: ${note}`);
  }
});

async function getProfileName() {
  const profileNameElement = await waitForElement(
    ".text-heading-xlarge.inline.t-24.v-align-middle.break-words"
  );
  return profileNameElement.innerText;
}

async function getButtonContainer() {
  return waitForElement(
    ".scaffold-layout__main > section >div.ph5 > div:nth-of-type(3) > div"
  );
}

async function findConnectButton(clickableElements) {
  for (const element of clickableElements) {
    if (element.getAttribute("aria-label").includes("connect")) {
      return element;
    }
  }
  return null;
}

async function clickAddNoteButton() {
  const l = await waitForElement("button, div[role='button']");
  let noteButton = Array.from(l).find((element) =>
    element.getAttribute("aria-label").includes("Add a note")
  );

  if (note === "") {
    const connectButton = Array.from(l).find((element) =>
      element.getAttribute("aria-label").includes("Send without a note")
    );
    if (connectButton) {
      // connectButton.click();
      console.log("Sent without a note");
      return;
    }
  }
  if (noteButton) {
    noteButton.click();
    const textfield = await waitForElement("#custom-message");
    textfield.value = note;
    textfield.dispatchEvent(
      new Event("input", { bubbles: true, cancelable: true })
    );
    const sendButton = document.querySelector(
      "button[aria-label='Send invitation']"
    );
    // sendButton.click();
    console.log("Invitation sent with note");
  } else {
    console.log("Add a note button not found");
  }
}

async function handleConnectButton(connectButton, name) {
  connectButton.click();
  const addNoteButton = await waitForElement(
    ".artdeco-button--muted.artdeco-button--secondary.mr1"
  );

  if (note === "" || note.length == 0) {
    const withoutNoteButton = await waitForElement(
      `button[aria-label='Send without a note']`
    );
    if (withoutNoteButton) {
      // withoutNoteButton.click();
      console.log("Sent without a note");
    }
  } else {
    await clickAddNoteButton();
  }

  chrome.runtime.sendMessage({
    type: "connectionDone",
    name,
    originUrl: window.location.href,
  });
  chrome.runtime.sendMessage({ type: "closeTab" });
  chrome.runtime.sendMessage({ type: "feedback" });
}

async function clickMoreActionsButton() {
  const moreButton = document.querySelector(
    ".artdeco-dropdown__trigger--placement-bottom.pvs-profile-actions__action.artdeco-button--secondary.artdeco-button--muted.artdeco-button--2"
  );

  if (moreButton) {
    moreButton.click();
    return true;
  } else {
    console.log("More button not found");
    return false;
  }
}

async function findAndClickConnectButtonAfterMore(name) {
  const connectButton = await waitForElement(
    `div[aria-label='Invite ${name} to connect']`
  );

  if (connectButton) {
    connectButton.click();
    if (note === "" || note.length == 0) {
      const withoutNoteButton = await waitForElement(
        `button[aria-label='Send without a note']`
      );
      if (withoutNoteButton) {
        // withoutNoteButton.click();
        console.log("Sent without a note");
      }
    } else {
      await clickAddNoteButton();
    }
    chrome.runtime.sendMessage({ type: "connectionDone" });
    chrome.runtime.sendMessage({ type: "closeTab" });
  } else {
    console.log("Connect button still not found");
  }
}

async function clickConnectButton() {
  try {
    const name = await getProfileName();
    const buttonContainer = await getButtonContainer();
    const clickableElements = buttonContainer.querySelectorAll(
      "button, div[role='button']"
    );
    let connectButton = await findConnectButton(clickableElements);

    if (connectButton) {
      await handleConnectButton(connectButton, name);
    } else {
      const moreButtonClicked = await clickMoreActionsButton();
      if (moreButtonClicked) {
        await findAndClickConnectButtonAfterMore(name);
      }
    }
  } catch (error) {
    console.log(`Error during connection process: ${error.message}`);
  }
}

clickConnectButton();
