// area_content.js
chrome.runtime.onMessage.addListener(handleAreaContentMessages);

let badge;
let visits;
let routeCount;
let routesChecked;
let lastCount;
let areaName = "";

let subAreas = [];
let i = 0; // will be used to make unique frame ids for sub areas

let canceled = false; // TODO transition to Promise based interlocks

// Receive messages from the popup script
async function handleAreaContentMessages(message) {
    // Receive message from popup when extension icon is clicked
    if (message === "stats-request") {
        // Ignore requests if one has already started or completed
        if (badge && !canceled) {
            // TODO add timeout message
            chrome.runtime.sendMessage({
                type: "area-complete",
                target: "popup",
                data: {visits: visits, area: areaName}
            });

            return false;
        }

        // Reset in case the user requests the current page be recalculated without refreshing
        visits = 0;
        routeCount = 0;
        routesChecked = 0;
        lastCount = 0;
        canceled = false;

        // Try to get the "x Total Climbs" element above the pie chart
        const routeInfo = document.querySelector("div#climb-area-page div#route-count-container h2");

        if (!routeInfo) {
            console.warn("Number of routes on high level area page missing.");
            return false;
        }

        // Extract the number of routes in the area
        routeCount = parseInt(routeInfo.textContent.split(" ")[0]);

        // Try to get the area name from the left sidebar above the child page list
        const areaHeader = document.querySelector("div#climb-area-page div.mp-sidebar h3");

        // If no area header appears on the left sidebar, the area has no children
        if (!areaHeader) {
            //console.log("Empty area.");
            return true;
        }

        areaName = areaHeader.textContent.split(" ").slice(2).join(" ");

        // Try to get the table of child route links
        const routeList = document.querySelector("table#left-nav-route-table tbody");
        if (routeList) {
            // TODO correct bug where only the first child page is opened on the first request after offscreen page creation
            openChildRoutes(routeList);

            addBadge(); // display "Fetching recent visits..."
            return true;
        }

        // If the route table was not found, this must be a high level area page with sub area children, so this check is likely redundant
        if (areaHeader.textContent.startsWith("Areas in")) {
            //console.log("High level area page detected with", routeCount, "child routes.");
            // Send a warning message to the popup that fetching recent visits on all children is expensive
            chrome.runtime.sendMessage({
                type: "area-warn",
                target: "popup",
                data: {routes: routeCount, area: areaName}
            });

            return true;
        }

        console.warn("Unknown error handling stats-request message in area_content.");
        return false;
    }

    // Receive message from popup when the user clicks the "Continue" button for a high level area page
    if (message === "high-level-stats-request") {
        routesChecked = 0;
        canceled = false;
        prepareSubAreas();

        addBadge();
        return true;
    }

    // Receive message from popup when the user clicks the cancel all requests button
    if (message === "cancel") {
        canceled = true;

        // Preempt the timeout watchdog display when we know it will time out
        if (routesChecked < routeCount) {
            badge.textContent = "Request timed out.";
        }
        return true;
    }

    // Receive message from background that the last sub area is finished and the next one can be opened
    if (message === "next-area") {
        openNextSubArea();
        return true;
    }

    // When any other message is received, assume it to be a stats response from a child route
    routesChecked++;
    console.log("Area content script received message:", message, "Progress:", routesChecked, "/", routeCount);

    // Start the timeout watchdog when the first route is received
    if (routesChecked == 1) {
        lastCount = routesChecked;
        setTimeout(sendTimedOut, 20000); // TODO correct watchdog start times, fix timer
    }

    // Only extract the visits from the message for now, counting unticked routes as 0
    let ticks = Math.max(parseInt(message.split(",")[0]), 0);
    visits += ticks;
    badge.textContent = `${visits} visits in the last week.`; // update display

    // If we haven't heard from all routes yet, display a progress indicator
    if (routesChecked < routeCount) {
        badge.textContent += ` (${routesChecked}/${routeCount})`;
    }
    else {
        canceled = false; // correct the case when the timeout watchdog activates but the messages get receieved later

        // Tell the popup when all route responses have been received
        chrome.runtime.sendMessage({
            type: "area-complete",
            target: "popup",
            data: {visits: visits, area: areaName}
        });
    }

    return true;
}

// Displays a loading message and adds the recent-visits p element below the area title if it does not exist
function addBadge() {
    // Recalculate but don't add another element if the popup runs again
    if (!badge) {
        badge = document.createElement("p");
        badge.id = "recent-visits";
        document.querySelector("div#climb-area-page h1").insertAdjacentElement("afterend", badge);
    }

    badge.textContent = "Fetching recent visits...";
}

// Creates an array of the second level areas to be loaded 1 at a time
function prepareSubAreas() {
    // Get the table of sub area links
    subAreas = document.querySelectorAll("div#climb-area-page div.mp-sidebar div.lef-nav-row a");
    i = 0;
    
    openNextSubArea(); // open the first area
}

// Request that the next sub area in the list be loaded on the offscreen page
function openNextSubArea() {
    if (i === subAreas.length) {
        return;
    }

    let area = subAreas[i];
    //console.log("Opening sub area:", area.href);

    chrome.runtime.sendMessage({
        type: "open-sub-area",
        target: "background",
        data: {url: area.href, index: i}
    });

    i++;
}

// Requests that all child route stats pages be loaded in the offscreen document
function openChildRoutes(routeList) {
    const routeLinks = routeList.querySelectorAll("td a:first-child"); // ignores "remove todo" links

    chrome.runtime.sendMessage({
        type: "area-request-header",
        target: "popup",
        data: {routes: routeCount, area: areaName}
    });

    let i = 0; // will be used to generate unique iframe ids
    // Load each child route in an offscreen iframe
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
        canceled = true;
    }
    else {
        // Restart the watchdog
        lastCount = routesChecked;
        setTimeout(sendTimedOut, 10000);
    }
}
