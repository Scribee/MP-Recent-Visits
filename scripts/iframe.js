let recentTicks = [];
let doneParsing = false;
let sent = false;

// Get initially empty stats table element
const stats_table = document.querySelector("div#route-stats div.onx-stats-table div.col-lg-6 tbody");

let observer = new MutationObserver(getDate);
// Wait for table to be populated
observer.observe(stats_table, {
    childList: true,
    subtree: true
});

// Consider making timeout adjustable for users with poor wifi
setTimeout(sendTickCount, 750);

// If the mutation added a strong element, extract the date and add it to the recentTicks array
function getDate(mutation) {
    if (sent || !mutation[0].addedNodes || doneParsing) {
        return;
    }

    // Try to get the element with the tick date
    let dateElement = mutation[0].addedNodes[0].querySelector("div.small div strong");

    if (!dateElement) {
        return;
    }

    let date = Date.parse(dateElement.textContent);

    // Read ticks not in the future
    if (date - Date.now() <= 0) {
        //console.log(date);
        recentTicks.push(date); // add to array
    }

    // Once a week old tick or 10 recent ticks are found, stop parsing
    if (Date.now() - date > 604800000 || recentTicks.length > 9) {
        observer.disconnect();
        sendTickCount();
        return;
    }
}

// Send the number of ticks, most recent tick date, and tab ID to the background script
async function sendTickCount() {
    if (sent) {
        console.log("Attempting to send ticks multiple times.");
        return;
    }

    chrome.runtime.sendMessage({
        type: "iframe-response",
        target: "background",
        data: {visits: recentTicks.length - 1, lastVisit: recentTicks[recentTicks.length - 1], tab: window.name}
    });
    sent = true;
}
