chrome.runtime.onMessage.addListener(handleAreaContentMessages);

let badge;
let visits = 0;
let areaHeader;
let areaName = "";
let routeCount = 0;
let routesChecked = 0;

// Receive messages from the popup script
async function handleAreaContentMessages(message) {
    // Create an iframe with the provided url
    if (message === "stats-request") {
        console.log("Area request message received");
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
            console.log("High level area page detected with", routeCount, "child routes.");
            chrome.runtime.sendMessage({
                type: "popup-warn",
                target: "popup",
                data: {routes: routeCount, name: areaName}
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
    let ticks = Math.max(parseInt(message.split(",")[0]), 0);
    visits += ticks;
    badge.textContent = `${visits} visits in the last week.`;

    if (routesChecked < routeCount) {
        badge.textContent += ` (${routesChecked}/${routeCount})`;
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
    console.log("High level area stats request received.");

    const subAreas = document.querySelectorAll("div#climb-area-page div.mp-sidebar div.lef-nav-row a");

    subAreas.forEach(function(area) {
        console.log(area.href);
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
