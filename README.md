# MP-Recent-Visits
Chrome extension that summarizes recent ticks in an area to help with estimating popularity or current conditions.

## Usage
When browsing route pages on [Mountain Project](https://www.mountainproject.com/), the extension will automatically check the ticks page for each route and display a short message about its recent visits below the route name. If a route hasn't been ticked recently, it will indicate the date of the last tick. Otherwise, the total number of ticks in the last week are shown.


When browsing area pages, the extension does not perform any automatic visit calculations to preserve performance. To request that all child routes in an area be checked, click the extension icon in the top right of the browser. *If the icon is not visible, it will need to be pinned from the extensions menu.* When clicked, a popup window will appear with more information. If the area contains less than 50 routes, the extension will begin to check each of them and display the number of ticks found below the area name, as well as current progress. For areas with more than 50 child routes, a confirmation message must be acknowledged to continue, as large areas can take several minutes to complete. Areas with more than 300 total child routes are currently unsupported until performance optimizations can be implemented.


To cancel the current request, click the extension icon to open the popup window, and click the red X button in the bottom right. In the event that an error occurs or internet connectivity is lost temporarily, the message "Request timed out." may appear below the area name. In most cases this can be resolved by refreshing the page and repeating the request.


## Installation
Find "Mountain Project Recent Visits Extension" on the [Chrome Web Store](https://chromewebstore.google.com/detail/lobdgcmhjfmbjlmaneannapjhpplnjob?utm_source=item-share-cb) and click the "Add to Chrome" button. To make it easier to check area recent visits, you can pin the extension icon to the toolbar by clicking the puzzle icon, then the pin icon next to the extension.
