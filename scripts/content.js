if (parent !== top) {
    console.error("content.js likely called from iframe.")
}

chrome.runtime.onMessage.addListener(handleContentMessages);

const stars = document.querySelector("span#route-star-avg");
let url = document.URL.split('/');
url.splice(4, 0, "stats");
let stats_url = url.join('/');
// Request that the background page opens the stats page
openStatsPage(stats_url);

const badge = document.createElement("p");
badge.id = "recent-visits";
badge.textContent = "Fetching recent visits...";
stars.insertAdjacentElement("afterend", badge);

async function openStatsPage(path) {
    console.log("Sending message to background: ", path);
    
    chrome.runtime.sendMessage({
        type: "send-to-offscreen-page",
        target: "background",
        data: path
    });
}

async function handleContentMessages(message) {
    console.log("content handler called");

    /*if (message.target !== "content") {
        return false;
    }*/

    console.log("received message in content.js: ", message);

    if (message < 11) {
        badge.textContent = `${message}  visits in the past week.`;
    }
    else {
        var lastDate = new Date(message).toLocaleDateString('en-us', {weekday:"short", year:"numeric", month:"short", day:"numeric"}) ;
        badge.textContent = `Last visit ${lastDate}.`;
    }

    return true;
}
