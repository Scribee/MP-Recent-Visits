// background.js

chrome.runtime.onMessage.addListener(handleBackgroundMessages);
self.addEventListener("activate", setupOffscreenPage);

let offscreen = false;

// Listen and respond to messages from the content, offscreen and iframe scripts
async function handleBackgroundMessages(message, sender) {
    if (message.target !== "background") {
        return false;
    }

    // Response from iframe with tick information
    if (message.type === "iframe-response") {
        //console.log("Stats message received. Last tick: ", message.data.lastVisit);

        // Tell the offscreen page it can remove the route stats iframe
        chrome.runtime.sendMessage({
            type: "bg-close-frame-request",
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
        
        // Send text to display to the starting content script
        chrome.tabs.sendMessage(parseInt(message.data.tab.split("-")[0]), text);
        
        return true;
    }

    // Close the offscreen iframe with the provided name and allow the content script to load the next area
    if (message.type === "area-close-frame-request") {
        //console.log("Background script sending next area message");
        chrome.tabs.sendMessage(parseInt(message.data.split("-")[0]), "next-area");

        chrome.runtime.sendMessage({
            type: "bg-close-frame-request",
            target: "offscreen",
            data: message.data
        });

        return true;
    }

    // URL from content script to be opened on the offscreen page
    if (message.type === "send-to-offscreen-page") {
        await setupOffscreenPage();

        // Pass the url and source tab id to the offscreen document
        chrome.runtime.sendMessage({
            type: "stats-url-request",
            target: "offscreen",
            data: {url: message.data.url, tab: sender.tab.id + "-" + message.data.index}
        });

        return true;
    }

    // Sub area url from area script to open in an offscreen iframe
    if (message.type === "open-sub-area") {
        await setupOffscreenPage();

        //console.log("Sending message to offscreen for sub area iframe");
        // Pass the url and source tab id to the offscreen document
        chrome.runtime.sendMessage({
            type: "stats-url-request",
            target: "offscreen",
            data: {url: message.data.url, tab: sender.tab.id + "-" + message.data.index}
        });

        return true;
    }

    // Request from iframe area page to load stats page
    if (message.type === "send-area-route-to-offscreen-page") {
        //console.log("Opening offscreen iframe", message.data.url);

        // Pass the url and provided original tab (suffix already added)
        chrome.runtime.sendMessage({
            type: "stats-url-request",
            target: "offscreen",
            data: {url: message.data.url, tab: message.data.tab}
        });

        return true;
    }

    // Request from popup to close offscreen document
    if (message.type === "close-offscreen") {
        try {
            await chrome.offscreen.closeDocument();
            console.log("Closed offscreen document due to popup request.");
        }
        catch (e) {
            console.error("Failed to close offscreen document.");
        }

        offscreen = false;
        await setupOffscreenPage();

        return true;
    }

    console.warn("Unknown message type sent to background.js:", message.type);
    return false;
}

// Creates the offscreen page if it does not already exist
async function setupOffscreenPage() {
    if (offscreen) {
        return true;
    }

    // Create the offscreen page if it does not exist
    try {
        await chrome.offscreen.createDocument({
            url: "stats_pages.html",
            reasons: ["DOM_SCRAPING"],
            justification: "Opens route stats pages to extract tick dates."
        });
    }
    catch (e) {
        console.warn(e);
    }

    offscreen = true;
    return true;
}

// X-Frame-Options removal from wOxxOm
// https://groups.google.com/a/chromium.org/g/chromium-extensions/c/UCJW6vKPM3g
const iframeHosts = ['www.mountainproject.com'];

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
                {header: "X-Frame-Options", operation: "remove"}
            ],
        },
    };
    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [RULE.id],
        addRules: [RULE]
    });
});