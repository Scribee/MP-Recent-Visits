chrome.runtime.onMessage.addListener(handlePopupMessages);

// Create button element to display when confirmation is needed
const button = document.createElement("button");
button.textContent = "Continue";
button.id = "continue-button";
button.addEventListener("click", confirmRequest);

const closeImg = document.querySelector("img#close-img");
closeImg.addEventListener("click", closeOffscreenDocument);

const tip = document.querySelector("div#body-content span p"); // element to display important messages

document.querySelector("div.header em").textContent += chrome.runtime.getManifest().version; // add the version number to the header

sendMessage("stats-request"); // attempt to query the content script

// Handle messages sent to the popup to change the displayed tip
async function handlePopupMessages(message) {
    if (message.target !== "popup") {
        return false;
    }

    // Message from route_content that clicking the extension icon does not have an effect
    if (message.type === "route-response") {
        tip.textContent = "On route pages, recent visit information is automatically displayed below the route name.";
        return true;
    }

    // Message from area_content that the child routes have been opened in the offscreen page
    if (message.type === "area-request-header") {
        tip.innerHTML = `Fetching recent ticks for all ${message.data.routes} ${message.data.area} routes. When complete, the number of visits in the last week will be displayed under the area name.`;
        return true;
    }

    // Message from area_content warning that the area is a high level area
    if (message.type === "area-warn") {
        let area = message.data.area;
        console.log("Popup warning received. Area name:", area, " Routes:", message.data.routes);

        if (message.data.routes > 300) {
            tip.textContent = "This area has too many routes to check. Please try again on the pages for the specific sub areas you're interested in.";
            return false;
        }

        // Do not require confirmation for high level areas with relatively few routes
        if (message.data.routes <= 50) {
            tip.innerHTML = `Fetching recent ticks for all ${message.data.routes} ${message.data.area} routes. When complete, the number of visits in the last week will be displayed under the area name.`;
            confirmRequest();
            return true;
        }
        
        tip.textContent = `Do you want to check all ${message.data.routes} routes in the sub-areas under ${area}?`;
        tip.parentElement.insertAdjacentElement("afterend", button);
        
        return true;
    }

    // Message from area_content when all route visits have been received
    if (message.type === "area-complete") {
        tip.innerHTML = `${message.data.area} has been visited <strong>${message.data.visits}</strong> time` + (message.data.visits == 1 ? "" : "s") + " in the last week.";
        return true;
    }

    // Message from area_content when not all route pages were loaded
    if (message.type === "area-timed-out") {
        tip.textContent = "Timed out waiting for stats pages, please try again.";
        return true;
    }

    console.warn("Unknown message type received by popup script.");
    return false;
}

// Callback function for the continue button used for high level area pages
function confirmRequest() {
    if (button.parentElement) {
        button.parentElement.removeChild(button);
    }
    tip.innerHTML = "Fetching recent visits in the background. Large areas may take several minutes to complete.";
    sendMessage("high-level-stats-request");
}

// Sends the provided message to the current tab
function sendMessage(message) {
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, message).catch(errorMessage);
        console.log("Sending message from popup script:", message);
    });
}

// Display a basic usage message in the popup when the extension icon is clicked on a site with no extension content script
function errorMessage() {
    console.log("Popup script ran on invalid url");
    tip.innerHTML = "Click the extension icon when browsing area pages on <a target=\"_blank\" rel=\"noopener noreferrer\" href=\"https://www.mountainproject.com\">mountainproject.com</a> to fetch recent ticks!<br />\
Recent ticks are automatically shown when browsing route pages.";

    return false;
}

function closeOffscreenDocument() {
    console.warn("Closing offscreen document.");

    chrome.runtime.sendMessage({
        type: "close-offscreen",
        target: "background"
    });

    sendMessage("cancel");

    window.close();
}
