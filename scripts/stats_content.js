// stats_content.js
// Do nothing if not in an iframe
if (window.self !== window.top) {
    let recentTicks = [];
    let sent = false;
    let observer;

    // Get initially empty stats table element
    const stats_table = document.querySelector("div#route-stats div.onx-stats-table div.col-lg-6 div");

    // TODO fix issue correctly by observing the outer element, waiting for the stats table to be inserted
    if (stats_table) {
        observer = new MutationObserver(getDate);
        // Wait for table to be populated
        observer.observe(stats_table, {
            childList: true,
            subtree: true
        });

        // This timeout should never trigger unless internet connectivity is lost
        setTimeout(timeoutError, 60000); // TODO reconsider timeout utility
    }
    else {
        console.warn("Route found with no stats table:", window.name, document.URL);
        sendTickCount();
    }

    // If the mutation added a strong element, extract the date and add it to the recentTicks array
    function getDate(mutation) {
        observer.disconnect();
        let future = false;

        mutation.forEach(function(record) {
            if (sent || record.addedNodes.length == 0) {
                return;
            }

            // Try to get the element with the tick date
            let dateElement = record.addedNodes[0].querySelector("div.small div strong");

            if (!dateElement) {
                // If there are no ticks for this route, send the response immediately
                if (record.addedNodes[0].textContent === "0") {
                    sendTickCount();
                    sent = true;
                    return;
                }

                return;
            }

            let date = Date.parse(dateElement.textContent);

            // Read ticks not in the future
            if (Date.now() - date > 0) {
                recentTicks.push(date); // add to array
            }

            // Record that a future tick was found in case no past ticks are found
            if (Date.now() - date < 0) {
                future = true;
                return;
            }

            // Once a week old tick or 10 recent ticks are found, stop parsing
            if (Date.now() - date > 691200000 || recentTicks.length > 9) {
                sendTickCount();
                sent = true;
                return;
            }
        });

        // If only future ticks were read, send the empty list so the timeout doesn't trigger
        if (future && !sent) {
            sendTickCount();
        }
    }

    // When a page fails to load, log a warning and send the empty visits array
    async function timeoutError() {
        console.warn("Page timed out:", document.URL);
        sendTickCount();
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
}
