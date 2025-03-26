chrome.runtime.onMessage.addListener(handleRouteContentMessages);

// Get the route quality element
const mainDiv = document.querySelector("div.main-content div.row div.col-lg-7");
let url = document.URL.split("/"); // generate the url for the stats of the current route
url.splice(4, 0, "stats");
let stats_url = url.join("/");

// Request that the background page opens the stats page in the offscreen document
openStatsPage(stats_url);

// Create the element to display recent visit information
const summaryDiv = document.createElement("div");
summaryDiv.id = "recent-visits";
summaryDiv.setAttribute("class", "mb-1");
//summaryDiv.style = "overflow: hidden; margin-bottom: 2rem;";
mainDiv.insertAdjacentElement("afterbegin", summaryDiv);

const badge = document.createElement("span");
//badge.href = stats_url;
badge.textContent = "Fetching recent visits... ";
summaryDiv.insertAdjacentElement("beforeend", badge);

const details = document.createElement("a");
details.href = "javascript:void(0)";
details.innerHTML = "Details<img src=\"/img/downArrowBlack.svg\" id=\"toggle-arrow\" alt=\"Drop down\"/>";
summaryDiv.insertAdjacentElement("beforeend", details);

const tickDiv = document.createElement("div");
tickDiv.id = "tick-preview-container";
tickDiv.style = "display: none;";
tickDiv.innerHTML = "<table class=\"table-striped\" id=\"recent-ticks-preview\"><tbody></tbody></table>";
summaryDiv.insertAdjacentElement("beforeend", tickDiv);

const style = document.createElement("style");
style.innerHTML = "table#recent-ticks-preview {width: 100%; table-layout: fixed;}" +
    "table#recent-ticks-preview td {padding: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;}" +
    "td#tick-notes {width: 60%;}" +
    "img#toggle-arrow {margin-left: 7px;}" +
    "a#toggle-up img {transform: rotateX(180deg);}";
document.head.insertAdjacentElement("afterbegin", style);

let detailsOpen = false;
details.addEventListener("click", openDetails);

// Sends the stats url to be opened to the background page
async function openStatsPage(path) {
    //console.log("Sending message to background: ", path);
    
    chrome.runtime.sendMessage({
        type: "send-to-offscreen-page",
        target: "background",
        data: {url: path, index: 0}
    });
}

// Receive the final text from the background script
async function handleRouteContentMessages(message) {
    if (message === "stats-request" || message === "high-level-stats-request") {
        //console.log("Route page received message for area script");

        chrome.runtime.sendMessage({
            type: "route-response",
            target: "popup"
        });

        return false;
    }

    // Receive message from popup when the user clicks the cancel all requests button
    if (message === "cancel") {
        summaryDiv.parentElement.removeChild(summaryDiv);

        return true;
    }

    let messageData = message.split(";");
    // Update the element with the information returned, with a space at the end
    badge.textContent = messageData[2] + " ";

    let table = document.querySelector("table#recent-ticks-preview tbody");
    let i = 3;

    while (messageData[i]) {
        console.log(messageData.slice(i));
        table.innerHTML = table.innerHTML + messageData[i];
        i++;
    }

    return true;
}

// Toggle visibility of the table of recent ticks.
function openDetails() {
    if (detailsOpen) {
        tickDiv.style = "display: none;";
        details.id = "toggle-down";
    }
    else {
        tickDiv.style = "display: inline-block;";
        details.id = "toggle-up";
    }

    detailsOpen = !detailsOpen;
}