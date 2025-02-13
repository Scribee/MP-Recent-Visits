chrome.runtime.onMessage.addListener(handleBackgroundMessages);

async function handleBackgroundMessages(message) {
    if (message.target !== "background") {
        return false;
    }

    if (message.type === "stats-response") {
        console.log("Sending visits to content from background.js");

        chrome.tabs.query({active: true, lastFocusedWindow: true}, function (tabs) {chrome.tabs.sendMessage(tabs[0].id, message.data);});
        
        return true;
    }

    if (message.type === "send-to-offscreen-page") {
        try {
            await chrome.offscreen.createDocument({
                url: "stats_pages.html",
                reasons: ["DOM_SCRAPING"],
                justification: "Opens route stats pages to extract tick dates.",
            });        
        }
        catch (e) {
            console.log("Offscreen document likely existed already");
            console.log(e);
        }

        console.log("sending message to offscreen");

        // Pass the data along to the offscreen document
        chrome.runtime.sendMessage({
            type: "stats-url-request",
            target: "offscreen",
            data: message.data
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
        resourceTypes: ["sub_frame"],
        },
        action: {
        type: "modifyHeaders",
        responseHeaders: [
            {header: "X-Frame-Options", operation: "remove"},
            {header: "Frame-Options", operation: "remove"},
            // Uncomment the following line to suppress `frame-ancestors` error
            // {header: 'Content-Security-Policy', operation: 'remove'},
        ],
        },
    };
    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [RULE.id],
        addRules: [RULE],
    });
});