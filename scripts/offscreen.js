let stats_page;

chrome.runtime.onMessage.addListener(handleOffscreenMessages);

async function handleOffscreenMessages(message) {
    if (message.target !== "offscreen") {
        return false;
    }

    if (message.type === "stats-url-request") {
        console.log("Offscreen message received: ", message.data);

        stats_page = document.createElement("iframe");
        stats_page.setAttribute("style", "position: absolute;width:0;height:0;border:0;")
        stats_page.id = "stats-page";
        stats_page.src = message.data;
        document.body.insertAdjacentElement("beforeend", stats_page); // load the stats page iframe

        return true;
    }
    else if (message.type === "iframe-response") {
        console.log("Stats message received. Last tick: ", message.data.lastVisit);
        if (message.data.visits > 0) {
            sendTickCount(message.data.visits);
        }
        else {
            sendTickCount(message.data.lastVisit);
        }

        stats_page.parentElement.removeChild(stats_page);
        console.log("Removed iframe");

        return true;
    }

    console.warn("Unknown message type received by offscreen script: ", message.type);
    return false;
}

async function sendTickCount(visits) {
    chrome.runtime.sendMessage({
        type: "stats-response",
        target: "background",
        data: visits
    });
}
