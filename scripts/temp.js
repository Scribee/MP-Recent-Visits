const exp = RegExp("(\\w\\w\\w) (\\d\\d?), (\\d\\d\\d\\d)");
    let groups = exp.exec(str);
    let monthInd = 0;
    switch (groups[1]) {
        case "Jan":
            monthInd = 0;
            break;
        case "Feb":
            monthInd = 1;
            break;
        case "Mar":
            monthInd = 2;
            break;
        case "Apr":
            monthInd = 3;
            break;
        case "May":
            monthInd = 4;
            break;
        case "Jun":
            monthInd = 5;
            break;
        case "Jul":
            monthInd = 6;
            break;
        case "Aug":
            monthInd = 7;
            break;
        case "Sep":
            monthInd = 8;
            break;
        case "Oct":
            monthInd = 9;
            break;
        case "Nov":
            monthInd = 10;
            break;
        case "Dec":
            monthInd = 11;
            break;
        default:
            console.log("Unknown month parsed: ", groups[1]);
    }

    return new Date(parseInt(groups[3]), monthInd, parseInt(groups[2]));