chrome.runtime.onMessage.addListener(handleAreaContentMessages);

let badge;
let visits = 0;
let areaHeader;
let areaName = "";
let routeCount = 0;
let routesChecked = 0;
let lastCount = 0;

// Receive messages from the popup script
async function handleAreaContentMessages(message) {
    // Create an iframe with the provided url
    if (message === "stats-request") {
        console.log("Area request message received");
        routesChecked = 0;
        getAreaInfo();

        const routeList = document.querySelector("table#left-nav-route-table tbody");
        if (routeList) {
            const routeLinks = routeList.querySelectorAll("td a:first-child"); // ignores remove todo links

            chrome.runtime.sendMessage({
                type: "area-request-header",
                target: "popup",
                data: {routes: routeCount, area: areaName}
            });

            let i = 0;

            routeLinks.forEach(function (link) {
                let url = link.href.split("/"); // generate the url for the stats of the current route
                url.splice(4, 0, "stats");

                console.log("Sending message to background to open:", url.join("/"));

                chrome.runtime.sendMessage({
                    type: "send-to-offscreen-page",
                    target: "background",
                    data: {url: url.join("/"), index: i}
                });
                i++;
            });

            addBadge();
            return true;
        }

        if (!areaHeader) {
            console.log("Empty area.");
            return true;
        }

        if (areaHeader.textContent.startsWith("Areas in")) {
            //console.log("High level area page detected with", routeCount, "child routes.");
            chrome.runtime.sendMessage({
                type: "area-warn",
                target: "popup",
                data: {routes: routeCount, area: areaName}
            });

            return true;
        }

        return false;
    }

    if (message === "high-level-stats-request") {
        openChildAreas();

        addBadge();
        return true;
    }

    routesChecked++;
    console.log("Area content script received message:", message, "Progress:", routesChecked, "/", routeCount);

        // Start the timeout watchdog when the first route is received
    if (routesChecked == 1) {
        lastCount = routesChecked;
        setTimeout(sendTimedOut, 10000);
    }

    let ticks = Math.max(parseInt(message.split(",")[0]), 0);
    visits += ticks;
    badge.textContent = `${visits} visits in the last week.`;

    if (routesChecked < routeCount) {
        badge.textContent += ` (${routesChecked}/${routeCount})`;
    }
    else {
        chrome.runtime.sendMessage({
            type: "area-complete",
            target: "popup",
            data: visits
        });
    }

    return false;
}

function addBadge() {
    // Recalculate but don't add another element if the popup runs again
    if (!badge) {
        badge = document.createElement("p");
        badge.id = "recent-visits";
        badge.textContent = "Fetching recent visits...";
        document.querySelector("div#climb-area-page h1").insertAdjacentElement("afterend", badge);
    }
}

function openChildAreas() {
    //console.log("High level area stats request received.");

    const subAreas = document.querySelectorAll("div#climb-area-page div.mp-sidebar div.lef-nav-row a");

    let i = 0
    subAreas.forEach(function(area) {
        console.log(area.href);
        chrome.runtime.sendMessage({
            type: "open-sub-area",
            target: "background",
            data: {url: area.href, index: i}
        });
        i++;
    });
}

function getAreaInfo() {
    const routeInfo = document.querySelector("div#climb-area-page div#route-count-container h2");

    if (!routeInfo) {
        console.warn("Number of routes on high level area page missing.");
        return false;
    }

    areaHeader = document.querySelector("div#climb-area-page div.mp-sidebar h3");
    areaName = areaHeader.textContent.split(" ").slice(2).join(" ");
    routeCount = routeInfo.textContent.split(" ")[0];
}

// Send the timeout message if the number of loaded routes has not changed
function sendTimedOut() {
    // If all requested routes were received, do nothing
    if (routesChecked >= routeCount) {
        return;
    }

    // If no more routes have been received since the last call, send the timeout message
    if (lastCount == routesChecked) {
        chrome.runtime.sendMessage({
            type: "area-timed-out",
            target: "popup"
        });

        badge.textContent = "Request timed out.";
    }
    else {
        // Restart the watchdog
        lastCount = routesChecked;
        setTimeout(sendTimedOut, 10000);
    }
}
