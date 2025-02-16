chrome.runtime.onMessage.addListener(handlePopupMessages);

// Create button element to display when confirmation is needed
const button = document.createElement("button");
button.textContent = "Continue";
button.id = "continue-button";
button.addEventListener("click", confirmRequest);

const warning = document.querySelector("div#body-content span p"); // element to display important messages

document.querySelector("div.header em").textContent += chrome.runtime.getManifest().version; // add the version number to the header

sendMessage("stats-request"); // attempt to query the content script

async function handlePopupMessages(message) {
    if (message.target !== "popup") {
        return false;
    }

    if (message.type === "route-response") {
        warning.textContent = "On route pages, recent visit information is automatically displayed below the route name.";
        return true;
    }

    if (message.type === "area-request-header") {
        warning.innerHTML = `Fetching recent ticks for all ${message.data.routes} ${message.data.area} routes. When complete, the number of visits in the last week will be displayed under the area name.`;
        return true;
    }

    if (message.type === "popup-warn") {
        console.log("Popup message received. Area name:", message.data.name, " Routes:", message.data.routes);

        warning.textContent = `Do you want to check all ${message.data.routes} routes in the sub-areas under ${message.data.name}?`;
        warning.parentElement.insertAdjacentElement("afterend", button);

        return true;
    }

    console.warn("Unknown message type received by popup script.");
    return false;
}

function confirmRequest() {
    button.parentElement.removeChild(button);
    warning.textContent = "Fetching recent visits...";
    sendMessage("high-level-stats-request");
}

function sendMessage(message) {
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, message).catch(errorMessage);
        console.log("Sending message from popup script:", message);
    });
}

function errorMessage() {
    /*if (!chrome.runtime.lastError.errorMessage) {
        console.log("Response function called with no error.");
        return true;
    }*/

    console.log("Popup script ran on invalid url");
    warning.innerHTML = "Click the extension icon when browsing area pages on <a target=\"_blank\" rel=\"noopener noreferrer\" href=\"https://www.mountainproject.com\">mountainproject.com</a> to fetch recent ticks!<br />\
Recent ticks are automatically shown when browsing route pages.";

    return false;
}