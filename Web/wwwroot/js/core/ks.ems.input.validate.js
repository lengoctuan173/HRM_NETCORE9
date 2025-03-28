/*=========================================================================================
  File Name:    input validate.js
  Description:  input validate with pattern script
  ----------------------------------------------------------------------------------------
  Author:       duy hung
  ----------------------------------------------------------------------------------------
  Date		    | Updater	| Modify Desc
  -------------------------------------------------------------------------------------
  2020-11-20    | duy hung	| first draft
==========================================================================================*/

/**********************************
*   validate textbox format decimal
**********************************/
var $ksvalid = function () {
    var regexInt = /^[-]?\d+$/;                                                      //int
    var regexD = /^[-]?(0|[0-9]\d*)(\.\d+)?$/;                                     //decimal
    var regexD2 = /^[-]?(0|[0-9]\d*)(\.[0-9]{0,2})?$/;                              //decimal 2
    var regexD3 = /^[-]?(0|[0-9]\d*)(\.[0-9]{0,3})?$/;                              //decimal 3
    var regexDateDMY = /^([0-2][0-9]|(3)[0-1])(\/)(((0)[0-9])|((1)[0-2]))(\/)\d{4}$/;    //dd/MM/yyyy
    var regexDateYMD = /^([12]\d{3}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01]))$/;              //yyyyMMdd
    var regexMonth = /^(((0)[0-9])|((1)[0-2]))(\/)\d{4}$/;                             //MM/yyyy
    var regexTime = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;                            //HH:mm
    var regexHexColor = /^#([0-9A-Fa-f]{6})$/;
    var regexEmail = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    var regexPhone = /((09|03|07|08|05)+([0-9]{8})\b)/g;
    var regexIP = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    function checkValid(inputVal, tag) {
        var flag = false;
        switch (tag.toLowerCase().trim()) {
            case "i":
            case "int":
                flag = regexInt.test(inputVal);
                break;
            case "num":
            case "d":
            case "d0":
            case "decimal":
                flag = regexD.test(inputVal.replaceAll(",", ""));
                break;
            case "d2":
                flag = regexD2.test(inputVal.replaceAll(",", ""));
                break;
            case "d3":
                flag = regexD3.test(inputVal.replaceAll(",", ""));
                break;
            case "date":
                flag = regexDateDMY.test(inputVal);
                break;
            case "month":
                flag = regexMonth.test(inputVal);
                break;
            case "dateymd":
                flag = regexDateYMD.test(inputVal);
                break;
            case "time":
                flag = regexTime.test(inputVal);
                break;
            case "color":
                flag = regexHexColor.test(inputVal);
                break;
            case "email":
                flag = regexEmail.test(inputVal);
                break;
            case "phone":
            case "mobile":
                flag = regexPhone.test(inputVal);
                break;
            case "ipaddress":

                flag = regexIP.test(inputVal);
                break;
        }
        return flag;
    }
    return {
        isInt: function (inputVal) {
            return checkValid(inputVal, "i");
        },
        isNum: function (inputVal) {
            return checkValid(inputVal, "num");
        },
        isDate: function (inputVal) {
            return checkValid(inputVal, "datedmy");
        },
        isMonth: function (inputVal) {
            return checkValid(inputVal, "month");
        },
        isColor: function (inputVal) {
            return checkValid(inputVal, "color");
        },
        isEmail: function (inputVal) {
            return checkValid(inputVal, "email");
        },
        isPhone: function (inputVal) {
            return checkValid(inputVal, "phone");
        },
        isMobile: function (inputVal) {
            return checkValid(inputVal, "mobile");
        },
        isLightColor: function (color) {
            const hex = color.replace('#', '');
            const c_r = parseInt(hex.substr(0, 2), 16);
            const c_g = parseInt(hex.substr(2, 2), 16);
            const c_b = parseInt(hex.substr(4, 2), 16);
            const brightness = ((c_r * 299) + (c_g * 587) + (c_b * 114)) / 1000;
            return brightness > 155;
        },
        match: function (inputVal, tag) {
            return checkValid(inputVal, tag);
        },
        isipaddress: function (inputVal) {
            return checkValid(inputVal, "ipaddress");
        },
    }
}();

$(document).on('blur', 'input[input-validate]', function (e) {
    var input = $(this);
    var inputVal = input.val();
    if (inputVal != "") {
        var pattern = input.attr('input-validate').trim();
        if (pattern != null) {
            //-----------------------------------------------------
            // for auto-completed
            //-----------------------------------------------------
            var completedstr = inputVal.trim();
            var isNumber = 0;

            if (pattern === "time" && inputVal.length <= 4) {
                if (inputVal.length < 4) {
                    inputVal = inputVal.padStart(4, "0");
                }
                //check cho phép nhập kiểu ddmmyyyy thì tự parse ra giờ
                completedstr = inputVal.substr(0, 2) + ":" + inputVal.substr(2, 2);
            }
            else if (inputVal.length === 8 && pattern === "date") {
                //check cho phép nhập kiểu ddmmyyyy thì tự parse ra ngày
                completedstr = inputVal.substr(0, 2) + "/" + inputVal.substr(2, 2) + "/" + inputVal.substr(4, 4);
            }
            else if (inputVal.length === 6 && pattern === "month") {
                //check cho phép nhập kiểu mmyyyy thì tự parse ra tháng
                completedstr = inputVal.substr(0, 2) + "/" + inputVal.substr(2, 4);
            }
            else if (pattern === "int" || pattern === "d2" || pattern === "d0" || pattern === "num" || pattern === "decimal" || pattern === "i" || pattern === "d" || pattern === "d3") {
                //bỏ phần thập phân nếu nó dài hơn cấu hình
                var dlength = 0;
                switch (pattern) {
                    case "d2":
                        dlength = 3;        //cho phép 2 số lẻ, thì set = 3 vì tính luôn dấu .
                        break;
                    case "d3":
                        dlength = 4;        //cho phép 3 số lẻ, thì set = 4 vì tính luôn dấu .
                        break;
                    default:
                        dlength = 0;        //nếu không cho phép phần thập phân thì bỏ luôn dấu .
                        break;
                }
                var dpoint = completedstr.indexOf(".");
                if (dpoint >= 0) {
                    completedstr = completedstr.substr(0, (dpoint + dlength));
                }

                //bỏ các số 0 ở đằng trước chuỗi nếu nó là kiểu số
                completedstr = completedstr.replaceAll(',', '');
                isNumber = 1;
                while (completedstr.substr(0, 1) === "0" && completedstr.substr(1, 1) !== "." && completedstr.length > 1) {
                    completedstr = completedstr.substr(1, completedstr.length - 1);
                }
            }

            var check = $ksvalid.match(completedstr, pattern);
            if (check == false) {
                input.addClass("bg-warning").val("");
            }
            else {
                //if (isNumber == 1) {
                //    var d = 0;
                //    switch (pattern) {
                //        case "d2":
                //            d = 2;
                //            break;
                //        case "d3":
                //            d = 3;
                //            break;
                //    }
                //    input.removeClass("bg-warning").val(cmFormatDecimal(completedstr, d));
                //}
                //else
                input.removeClass("bg-warning").val(completedstr);
            }
        }
    }
});

$(document).on('blur', 'input[required]', function (e) {
    var input = $(this);
    if (input.val() == "") {
        input.addClass("bg-warning").val("");
    }
    else {
        input.removeClass("bg-warning");
    }
});

$(document).on('blur', 'input[min]', function (e) {
    var input = $(this);
    var inputVal = input.val();

    if (inputVal != "") {
        var minVal = input.attr('min');
        if ($ksvalid.isNum(inputVal)) {
            if ($ksvalid.isNum(minVal)) {
                if (parseInt(inputVal) >= parseInt(minVal)) {
                    input.removeClass("bg-warning");
                }
                else {
                    input.addClass("bg-warning").val(minVal);
                }
            }
        }
        else {
            input.addClass("bg-warning").val('');
        }
    }
});

$(document).on('blur', 'input[max]', function (e) {
    var input = $(this);
    var inputVal = input.val();

    if (inputVal != "") {
        var maxVal = input.attr('max');
        if ($ksvalid.isNum(inputVal)) {
            if ($ksvalid.isNum(maxVal)) {
                if (parseInt(inputVal) <= parseInt(maxVal)) {
                    input.removeClass("bg-warning");
                }
                else {
                    input.addClass("bg-warning").val(maxVal);
                }
            }
        }
        else {
            input.addClass("bg-warning").val('');
        }
    }
});