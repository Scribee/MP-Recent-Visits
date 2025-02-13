let recentTicks = [];
let doneParsing = false;

console.log("Running iframe script on page: ", document.URL);

const stats_table = document.querySelector("div#route-stats div.onx-stats-table div.col-lg-6 tbody");

var observer = new MutationObserver(getDate);

observer.observe(stats_table, {
    childList: true,
    subtree: true
});

function getDate(mutations) {
    mutations.forEach(function (mutation) {
        if (!mutation.addedNodes || doneParsing) {
            return;
        }

        let dateStr = mutation.addedNodes[0].querySelector("div.small div strong").textContent;
        let date = Date.parse(dateStr);

        // Read ticks not in the future
        if (date - Date.now() <= 0) {
            console.log(date);
            recentTicks.push(date); // add to array
        }

        // Once a tick is read more than 7 days in the past, stop parsing
        if (Date.now() - date > 604800000) {
            console.log("old tick found");
            doneParsing = true;
        }

        if (recentTicks.length > 9) {
            console.log("10 ticks read");
            doneParsing = true;
        }

        // Stop watching mutations and send the number of ticks in the last 7 days to the content script
        if (doneParsing) {
            observer.disconnect();
            sendTickCount();
        }
    });
}

async function sendTickCount() {
    chrome.runtime.sendMessage({
        type: "iframe-response",
        target: "offscreen",
        data: {visits: recentTicks.length - 1, lastVisit: recentTicks[recentTicks.length - 1]}
    });
}