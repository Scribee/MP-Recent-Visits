let recentTicks = [];
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
setTimeout(sendTickCount, 10000);

// If the mutation added a strong element, extract the date and add it to the recentTicks array
function getDate(mutation) {
    observer.disconnect();

    mutation.forEach(function(record) {
        if (sent || !record.addedNodes) {
            return;
        }

        // Try to get the element with the tick date
        let dateElement = record.addedNodes[0].querySelector("div.small div strong");

        if (!dateElement) {
            return;
        }

        let date = Date.parse(dateElement.textContent);

        // Read ticks not in the future
        if (Date.now() - date > 0) {
            recentTicks.push(date); // add to array
        }

        // Once a week old tick or 10 recent ticks are found, stop parsing
        if (Date.now() - date > 691200000 || recentTicks.length > 9) {
            sendTickCount();
            sent = true;
            return;
        }
    });
}

// Send the number of ticks, most recent tick date, and tab ID to the background script
async function sendTickCount() {
    if (sent) {
        return false;
    }

    chrome.runtime.sendMessage({
        type: "iframe-response",
        target: "background",
        data: {visits: recentTicks.length - 1, lastVisit: recentTicks[recentTicks.length - 1], tab: window.name}
    });
    return true;
}
