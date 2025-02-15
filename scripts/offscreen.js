chrome.runtime.onMessage.addListener(handleOffscreenMessages);

// Receive messages from the background script
async function handleOffscreenMessages(message) {
    if (message.target !== "offscreen") {
        return false;
    }
    
    // Remove the iframe named with the provided tab id
    if (message.type === "close-frame-request") {
        //console.log("Closing frame with name: ", message.data);
        const stats_page = document.querySelector(`iframe#stats-page-target-${message.data}`);
        stats_page.parentElement.removeChild(stats_page);

        return true;
    }

    // Create an iframe with the provided url
    if (message.type === "stats-url-request") {
        //console.log("Offscreen message received: ", message.data);
        const stats_page = document.createElement("iframe");
        stats_page.setAttribute("style", "position: absolute;width:0;height:0;border:0;")
        stats_page.id = `stats-page-target-${message.data.tab}`;
        stats_page.name = message.data.tab; // save the target tabId as the iframe name
        stats_page.src = message.data.url;
        document.body.insertAdjacentElement("beforeend", stats_page); // load the stats page iframe

        return true;
    }

    console.warn("Unknown message type received by offscreen script: ", message.type);
    return false;
}
