chrome.runtime.onMessage.addListener(handleBackgroundMessages);

// Listen and respond to messages from the content, offscreen and iframe scripts
async function handleBackgroundMessages(message, sender) {
    if (message.target !== "background") {
        return false;
    }

    // Response from iframe with tick information
    if (message.type === "iframe-response") {
        //console.log("Stats message received. Last tick: ", message.data.lastVisit);

        // Tell the offscreen page it can remove the iframe
        chrome.runtime.sendMessage({
            type: "close-frame-request",
            target: "offscreen",
            data: message.data.tab
        });

        // Generate the message text to send
        let text = `${message.data.visits},${message.data.lastVisit},`;

        if (message.data.visits == -1) {
            text += "No ticks found.";
        }
        else if (message.data.visits == 0) {
            var lastDate = new Date(message.data.lastVisit).toLocaleDateString('en-us', {weekday:"short", year:"numeric", month:"short", day:"numeric"}) ;
            text += `Last visit ${lastDate}.`;
        }
        else {
            text += `${message.data.visits} visits in the last week.`;
        }
        
        // Send text to display to the content script
        chrome.tabs.sendMessage(parseInt(message.data.tab.split("-")[0]), text);
        
        return true;
    }

    // URL from content script to be opened on the offscreen page
    if (message.type === "send-to-offscreen-page") {
        // Create the offscreen page if it does not exist
        try {
            await chrome.offscreen.createDocument({
                url: "stats_pages.html",
                reasons: ["DOM_SCRAPING"],
                justification: "Opens route stats pages to extract tick dates.",
            });        
        }
        catch (e) {
            //console.log("Offscreen document likely existed already");
            console.log(e);
        }

        // Pass the url and source tab id to the offscreen document
        chrome.runtime.sendMessage({
            type: "stats-url-request",
            target: "offscreen",
            data: {url: message.data.url, tab: sender.tab.id + "-" + message.data.index}
        });

        return true;
    }

    console.warn("Unknown message type sent to background.js: ", message.type);
    return false;
}

// X-Frame-Options removal
const iframeHosts = ["mountainproject.com"];

chrome.runtime.onInstalled.addListener(() => {
    const RULE = {
        id: 1,
        condition: {
            initiatorDomains: [chrome.runtime.id],
            requestDomains: iframeHosts,
            resourceTypes: ["sub_frame"]
        },
        action: {
            type: "modifyHeaders",
            responseHeaders: [
                {header: "X-Frame-Options", operation: "remove"},
                {header: "Frame-Options", operation: "remove"}
            ],
        },
    };
    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [RULE.id],
        addRules: [RULE]
    });
});