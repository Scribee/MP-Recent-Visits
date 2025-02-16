chrome.runtime.onMessage.addListener(handleRouteContentMessages);

// Get the route quality element
const stars = document.querySelector("span#route-star-avg");
let url = document.URL.split("/"); // generate the url for the stats of the current route
url.splice(4, 0, "stats");
let stats_url = url.join("/");

// Request that the background page opens the stats page in the offscreen document
openStatsPage(stats_url);

// Create the element to display recent visit information
const div = document.createElement("div");
div.id = "recent-visits";
stars.insertAdjacentElement("afterend", div);

const badge = document.createElement("a");
badge.href = stats_url;
badge.textContent = "Fetching recent visits...";
div.insertAdjacentElement("beforeend", badge);

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
        console.log("Route page received message for area script");

        chrome.runtime.sendMessage({
            type: "route-response",
            target: "popup"
        });

        return false;
    }

    //console.log("received message in content.js: ", message);
    badge.textContent = message.split(",").slice(2);

    return true;
}
