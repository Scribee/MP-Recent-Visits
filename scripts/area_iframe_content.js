if (window.self === window.top) {
    console.log("iframe content script called out of an iframe");
}
else {
    console.log("area_iframe_content script running in iframe", window.name);
    const routeList = document.querySelector("table#left-nav-route-table tbody");
    // Check if the area contains routes
    if (routeList) {
        const routeLinks = routeList.querySelectorAll("td a:first-child"); // ignores remove todo links

        let i = 0;

        routeLinks.forEach(function (link) {
            let url = link.href.split("/"); // generate the url for the stats of the current route
            url.splice(4, 0, "stats");

            console.log("Sending message to background to open sub-area route:", url.join("/"));

            chrome.runtime.sendMessage({
                type: "send-area-route-to-offscreen-page",
                target: "background",
                data: {url: url.join("/"), tab: window.name + "-" + i}
            });
            i++;
        });
    }
    else {
        const subAreas = document.querySelectorAll("div#climb-area-page div.mp-sidebar div.lef-nav-row a");

        // Check if the area has sub areas
        if (subAreas) {
            let i = 0
            subAreas.forEach(function(area) {
                console.log("Opening sub area", area.href, "id", window.name + "-" + i);
                chrome.runtime.sendMessage({
                    type: "send-area-route-to-offscreen-page",
                    target: "background",
                    data: {url: area.href, tab: window.name + "-" + i}
                });
                i++;
            });
        }
        else {
            console.log("Empty area found.");
        }
    }

    // Close the frame after the child pages have been opened
    chrome.runtime.sendMessage({
        type: "close-frame-request",
        target: "offscreen",
        data: window.name
    });
}
