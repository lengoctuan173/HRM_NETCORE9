/*=========================================================================================
  File Name:    main.js
  Description:  main page script
  ----------------------------------------------------------------------------------------
  Author:       duy hung
  ----------------------------------------------------------------------------------------
  Date		    | Updater	| Modify Desc
  -------------------------------------------------------------------------------------
  2020-08-07    | duy hung	| first draft
==========================================================================================*/
var $pickerLangMonthFull = {
    'en-US': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    'vi-VN': ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
};
var $pickerLangMonth = {
    'en-US': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    'vi-VN': ['Th 1', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7', 'Th 8', 'Th 9', 'Th 10', 'Th 11', 'Th 12'],
};
var $pickerLangWeek = {
    'en-US': ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    'vi-VN': ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
};
var $pickerLangToday = {
    'en-US': 'Today',
    'vi-VN': 'Hôm nay',
};

$(document).ready(function () {
    let cult = $("#_currentCulture").val();
    if (!cult) {
        cult = "en-US";
    }
    //for picker
    if ($(".datepicker")[0]) {
        $('.datepicker').pickadate({
            monthsFull: $pickerLangMonthFull[cult],
            monthsShort: $pickerLangMonth[cult],
            weekdaysFull: $pickerLangWeek[cult],
            weekdaysShort: $pickerLangWeek[cult],
            today: $pickerLangToday[cult],

            format: 'dd/mm/yyyy',
            formatSubmit: 'yyyymmdd',
            selectYears: 160,
            selectMonths: true,
            editable: true,
            clear: '',      //ẩn nút Clear, nếu muốn hiện ra thì nhập vào label của nút
            close: ''       //ẩn nút Close, nếu muốn hiện ra thì nhập vào label của nút
        });
        $('.datepicker').click(function () {
            var picker = $(this).pickadate('picker');
            picker.open();
        });
    }

    if ($(".monthpicker")[0]) {
        $('.monthpicker').pickadate({
            monthsFull: $pickerLangMonthFull[cult],
            monthsShort: $pickerLangMonth[cult],
            weekdaysFull: $pickerLangWeek[cult],
            weekdaysShort: $pickerLangWeek[cult],
            today: $pickerLangToday[cult],

            format: 'mm/yyyy',
            formatSubmit: 'yyyymm',
            selectYears: 160,
            selectMonths: true,
            editable: true,
            clear: '',      //ẩn nút Clear, nếu muốn hiện ra thì nhập vào label của nút
            close: ''       //ẩn nút Close, nếu muốn hiện ra thì nhập vào label của nút
        });
        $('.monthpicker').click(function () {
            const picker = $(this).pickadate('picker');
            picker.open();
        });
    }

    if ($(".timepicker")[0]) {
        $('.timepicker').pickatime({
            format: 'HH:i',
            editable: true,
            today: '',
            clear: '',      //ẩn nút Clear, nếu muốn hiện ra thì nhập vào label của nút
            close: ''       //ẩn nút Close, nếu muốn hiện ra thì nhập vào label của nút
        });
        $('.timepicker').click(function () {
            const picker = $(this).pickatime('picker');
            picker.open();
        });
    }

    if ($(".picker-fit")[0]) {
        const width = $(".picker-fit").find('input.datepicker').width() + 26;
        $(".picker-fit").find(".picker__holder").css("min-width", width);
        $(".picker-fit").find(".picker__holder").css("max-width", width);
    }
});

//$(document).ajaxSend(function () {
//    console.log('ajaxSend');
//});
//$(document).ajaxStart(function () {
//    $ksdialog.showLoading();
//});
//$(document).ajaxSuccess(function () {
//    console.log('ajaxSuccess');
//});
//$(document).ajaxError(function () {
//    console.log('ajaxError');
//});
//$(document).ajaxComplete(function () {
//    console.log('ajaxComplete');
//});
//$(document).ajaxStop(function () {
//    $ksdialog.closeLoading();
//});