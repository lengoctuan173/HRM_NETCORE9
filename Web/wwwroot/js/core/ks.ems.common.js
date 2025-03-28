/*=========================================================================================
  File Name:    common.js
  Description:  common function script
  ----------------------------------------------------------------------------------------
  Author:       duy hung
  ----------------------------------------------------------------------------------------
  Date		    | Updater	| Modify Desc
  -------------------------------------------------------------------------------------
  2020-08-04    | duy hung	| first draft
==========================================================================================*/
/**********************************
 * Function delay action của hàm jquery
 * Author: duy hung
 * --
 * cách dùng delay:
 * $('#input').keyup(delay(function (e) {
 *     console.log('Time elapsed!', this.value);
 * }, 500));
 * --
 * $('#input').on('keyup', delay(function () {
 *     console.log('Time elapsed!', this.value);
 * }, 500));
 * --
 * **********************************/
function delay(callback, ms) {
    var timer = 0;
    return function () {
        var context = this, args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () {
            callback.apply(context, args);
        }, ms || 0);
    };
}

function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds) {
            break;
        }
    }
}
/* End */

/**********************************
*   Replace object property
**********************************/
function objOverrideProps(srcObj, tarObj) {
    try {
        for (var prop in tarObj) {
            srcObj.options[prop] = tarObj[prop];
        }
    }
    catch {
        console.log("* Error when overriding property!");
    }
}
/* End */

/**********************************
*   Clipboard
**********************************/
function copyToClipboard(msg) {
    try {
        var dummy = document.createElement("textarea");
        document.body.appendChild(dummy);
        dummy.value = msg;
        dummy.select();
        document.execCommand("copy");
        document.body.removeChild(dummy);
    }
    catch {
        console.log("* Cannot execute copy to clipboard!");
    }
};

/**********************************
*   Cookie
**********************************/
function cmGetCookie(cname) {
    const name = cname + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function cmSetCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

/**********************************
*   Resources
**********************************/
function getResource(key) {
    let mess = '';
    $.ajax({
        type: "get",
        async: false,
        url: '/Home/GetResource?key=' + key,
        success: function (data) {
            mess = data || '';
        },
    });
    return mess;
}

/**********************************
* bootstraptable function for rows
**********************************/
function bsTableRowIndex(value, row, index) {
    return index + 1;
}

/**********************************
* Format text
**********************************/
function FormatDatesubmit(value) {
    if (!moment(value, "DD/MM/YYYY").isValid())
        return null;
    return moment(value, "DD/MM/YYYY").format('YYYYMMDD');
}
function FormatMonthsubmit(value) {
    var date;
    if (value == "") {
        date = null;
    }
    else {
        date = "01/" + value;
    }
    if (!moment(date, "DD/MM/YYYY").isValid())
        return null;
    return moment(date, "DD/MM/YYYY").format('YYYYMM');
}

function CharToDate(e) {
    if (e == null)
        return null
    var result;
    var MM = e.toString().substr(4, 2);
    var YY = e.toString().substr(0, 4);
    var DD = e.toString().substr(6, 2);
    if (e == "") {
        result = "dd/mm/yyyy";
    }
    else {
        result = DD + '/' + MM + '/' + YY;
    }
    return result;
}
function CharToMonth(e) {
    var result;
    var e = e + "01";
    var MM = e.toString().substr(4, 2);
    var YY = e.toString().substr(0, 4);
    var DD = e.toString().substr(6, 2);
    if (e == "") {
        result = "mm/yyyy";
    }
    else {
        result = MM + '/' + YY;
    }
    return result;
}
function FomartDecimal(e) {
    result = (e).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    return result;
}

function Adddate(datestr, days) {
    var newdata;
    if (!moment(datestr, "DD/MM/YYYY").isValid())
        return null;
    else
        newdata = moment(datestr, "DD/MM/YYYY").add(days, 'days');
    return moment(newdata).format("DD/MM/YYYY");
}
function Addmonth(datestr, days) {
    var newdata;
    if (!moment(datestr, "MM/YYYY").isValid())
        return null;
    else
        newdata = moment(datestr, "MM/YYYY").add(days, 'month');
    return moment(newdata).format("MM/YYYY");
}
function isEmail(email) {
    if (email == "") {
        return true
    }
    else {
        var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        return regex.test(email);
    }
}
function isPhone(phone) {
    if (phone == "") {
        return true
    }
    else {
        var regex = /((09|03|07|08|05)+([0-9]{8})\b)/g;
        return regex.test(phone);
    }
}

//for datetime
function cmMonthToString(datestr, formatstr) {
    if (!moment(datestr, "MM/YYYY").isValid())
        return null;
    return moment(datestr, "MM/YYYY").format(formatstr);
}

function cmDateToString(datestr, formatstr) {
    if (!moment(datestr, "DD/MM/YYYY").isValid())
        return null;
    return moment(datestr, "DD/MM/YYYY").format(formatstr);
}

function cmFormatDbDateString(datestr, formatstr = "DD/MM/YYYY") {
    if (!moment(datestr, "YYYYMMDD").isValid())
        return null;
    return moment(datestr, "YYYYMMDD").format(formatstr);
}

function cmParseStringToDbDateString(datestr) {
    return cmDateToString(datestr, "YYYYMMDD");
}

function cmParseStringToDbMonthString(datestr) {
    return cmMonthToString(datestr, "YYYYMM");
}

function cmTimeToInt(timestr) {
    try {
        if (timestr != null && timestr.length >= 5)
            return (timestr.substr(0, 2) * 60) + (timestr.substr(3, 2) * 1);
        return 0;
    }
    catch {
        return 0;
    }
}

function cmTimeFromInt(timen) {
    try {
        if (timen != null && timen > 0) {
            var hour = parseInt(timen / 60);
            var minute = parseInt(timen % 60);
            return (hour < 10 ? "0" : "") + hour + ":" + (minute < 10 ? "0" : "") + minute;
        }
        return 0;
    }
    catch {
        return 0;
    }
}

//use regex to replace all in string by sending string to find as variable
function cmReplaceString(str, replaceWhat, replaceTo) {
    var re = new RegExp(replaceWhat, 'g');
    return str.replace(re, replaceTo);
}

function cmReplaceAllString(str, replaceWhat, replaceTo) {
    var re = new RegExp(replaceWhat, 'g');
    return str.replaceAll(re, replaceTo);
}

function cmFormatDecimal(s, d = 0) {
    /**
     * Number.prototype.format(n, x, s, c)
     *
     * @param integer n: length of decimal
     * @param integer x: length of whole part
     * @param mixed   s: sections delimiter
     * @param mixed   c: decimal delimiter
     */
    Number.prototype.format = function (n, x, s, c) {
        var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\D' : '$') + ')',
            num = this.toFixed(Math.max(0, ~~n));

        return (c ? num.replace('.', c) : num).replace(new RegExp(re, 'g'), '$&' + (s || ','));
    };
    return parseFloat(s).format(d, 3, ',', '.');
    //12345678.9.format(2, 3, '.', ',');    // "12.345.678,90"
    //123456.789.format(4, 4, ' ', ':');    // "12 3456:7890"
    //12345678.9.format(0, 3, '-');         // "12-345-679"
}

function cmGetQueryString(obj) {
    var str = "";
    for (var key in obj) {
        if (str != "") {
            str += "&";
        }
        str += key + "=" + encodeURIComponent(obj[key]);
    }
    return str;
}
function stringtoNum(s) {
    var str = s.replace(/,/g, "");
    return parseFloat(str);
}