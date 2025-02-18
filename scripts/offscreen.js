chrome.runtime.onMessage.addListener(handleOffscreenMessages);

// Receive messages from the background script
async function handleOffscreenMessages(message) {
    if (message.target !== "offscreen") {
        return false;
    }
    
    // Remove the iframe named with the provided tab id
    if (message.type === "bg-close-frame-request") {
        closeFrame(message);
        return true;
    }

    // Create an iframe with the provided url
    if (message.type === "stats-url-request") {
        const stats_page = document.createElement("iframe");
        stats_page.setAttribute("style", "position: absolute;width:0;height:0;border:0;");
        stats_page.id = `stats-page-target-${message.data.tab}`;
        stats_page.name = message.data.tab; // save the target tabId as the iframe name
        stats_page.src = message.data.url;
        document.body.insertAdjacentElement("beforeend", stats_page); // load the stats page iframe

        return true;
    }

    console.warn("Unknown message type received by offscreen script: ", message.type);
    return false;
}

function closeFrame(message) {
    console.log("Closing frame with name:", message.data);
    const stats_page = document.querySelector(`iframe#stats-page-target-${message.data}`);
    if (!stats_page) {
        console.warn("Target iframe not found. Name:", message.data);
        return false;
    }

    stats_page.parentElement.removeChild(stats_page);

    return true;
}
