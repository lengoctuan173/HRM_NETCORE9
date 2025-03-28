/*=========================================================================================
  File Name:    dialog.js
  Description:  dialog script
  ----------------------------------------------------------------------------------------
  Author:       duy hung
  ----------------------------------------------------------------------------------------
  Date		    | Updater	| Modify Desc
  -------------------------------------------------------------------------------------
  2020-08-04    | duy hung	| first draft
  2021-01-14    | duy hung	| sửa lại loader cho mượt mà
==========================================================================================*/
/**********************************
*   Loading
**********************************/
var $dialogDict = {
    'en-US': ['Close', 'OK', 'Please enter message'],
    'vi-VN': ['Đóng', 'Đồng ý', 'Vui lòng nhập tin nhắn'],
};

var $ksdialog = function () {
    var $objLoading = null;
    var $objTimeout = null;
    var $timeout = 300; /* mặc định là 5 phút quay loading */
    var $dialogID = "_mdDialog";
    var $closeText = "Close";
    var $OkText = "OK";
    var $messageText = "";
    try {
        var cult = $('#_currentCulture').val();
        if (cult != "" && cult != "en-US") {
            $closeText = $dialogDict[cult][0];
            $OkText = $dialogDict[cult][1];
            $messageText = $dialogDict[cult][2];
        }
    }
    catch { };

    //function initLoading_old(msg) {
    //    $objLoading = $('<div class="ajax-loading" style="display:none"><table height="100%" width="100%"><tr><td align="center"><p>' + (msg ? msg : '') + '</p></td></tr></table></div>');
    //    $objLoading.appendTo('body');
    //}
    function initLoading(msg) {
        s = "";
        s += '<div class="loadscreen" style="display: none;">';
        s += '<div class="loader spinner-bubble spinner-bubble-primary"></div>';
        s += (msg ? '<div class="loader mt-5 text-primary text-14 font-weight-bold">' + msg + '</div>' : '');
        s += '</div>';
        $objLoading = $(s);
        $objLoading.appendTo('body');
    }
    function initModal(msg, title) {
        if ($('#' + $dialogID).length > 0) {
            $('#' + $dialogID).remove();
        }
        var s = "";
        s += '<div class="modal fade" id="' + $dialogID + '" tabindex="-1" role="dialog" aria-labelledby="_md1label" aria-hidden="true" data-keyboard="false" data-backdrop="static">';
        s += '<div class="modal-dialog" role="document"><div class="modal-content"><div class="modal-header">';
        s += '<h5 class="modal-title" id="_md1label">' + title + '</h5>';
        s += '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>';
        s += '<div class="modal-body"><p> ' + msg + ' </p></div>';
        s += '<div class="modal-footer" > ';
        s += '<button type="button" class="btn btn-secondary btn-w60 btnCancel" data-dismiss="modal">' + $closeText + '</button > ';
        s += '<button type="button" class="btn btn-primary ml-2 btn-w60 btnOk">' + $OkText + '</button > ';
        s += '</div></div></div></div>';
        $(s).appendTo('body');
    }
    function initEnterMessageModal(fieldname, title) {
        if ($('#' + $dialogID).length > 0) {
            $('#' + $dialogID).remove();
        }
        var s = "";
        s += '<div class="modal fade" id="' + $dialogID + '" tabindex="-1" role="dialog" aria-labelledby="_md1label" aria-hidden="true" data-keyboard="false" data-backdrop="static">';
        s += '<div class="modal-dialog" role="document"><div class="modal-content"><div class="modal-header">';
        s += '<h5 class="modal-title" id="_md1label">' + title + '</h5>';
        s += '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>';
        s += '<div class="modal-body">';
        s += '<div class="form-group">';
        s += '<input type="text" id=' + fieldname + ' class="form-control" placeholder="' + $messageText + '">';
        s += '</div>';
        s += '</div>';
        s += '<div class="modal-footer" > ';
        s += '<button type="button" class="btn btn-secondary btn-w60 btnCancel" data-dismiss="modal">' + $closeText + '</button > ';
        s += '<button type="button" class="btn btn-primary ml-2 btn-w60 btnOk">' + $OkText + '</button > ';
        s += '</div></div></div></div>';
        $(s).appendTo('body');
    }
    function modalToggle() {
        $('#' + $dialogID).modal('toggle');
    }
    function setTimeOut(delay) {
        if (delay !== null || delay !== undefined)
            delay = $timeout;
        $objTimeout = setTimeout(function () {
            $(".loader").fadeOut("fast");
            $("#preloader").fadeOut();
            $(".app-pageopened").fadeIn("slow");
        }, delay * 1000);
    }
    return {
        showLoadingOld: function (msg, delay) {
            initLoading(msg);
            if (delay && delay > 0)
                $timeout = delay;

            if ($(".loadscreen").length > 0) {
                $objLoading.show();
            }
            $objTimeout = setTimeout(function () {
                $objLoading.remove();
            }, $timeout * 1000);
        },
        closeLoadingOld: function () {
            if ($(".loadscreen").length > 0) {
                $(".loadscreen").remove();
            }
            if ($objTimeout) {
                clearTimeout($objTimeout)
            }
        },
        showLoading: function (msg, delay) {
            if (msg !== null || msg !== undefined)
                $('#msgloader').text(msg);
            $("#preloader").fadeIn("fast");
            $(".loader").fadeIn("fast");
            $(".app-pageopened").fadeOut("fast");
            setTimeOut(delay);
        },
        closeLoading: function () {
            $(".loader").fadeOut("fast");
            $("#preloader").delay(200).fadeOut();
            $(".app-pageopened").fadeIn("slow");
            if ($objTimeout) {
                clearTimeout($objTimeout)
            }
        },
        showConfirm: function (msg, title, callback, params = null) {
            initModal(msg, title);
            modalToggle();
            $("#" + $dialogID + " .btnOk").on("click", function () {
                callback(true, params);
                $('#' + $dialogID).modal('toggle');
            });
            $("#" + $dialogID + " .btnCancel").on("click", function () {
                callback(false, params);
                $('#' + $dialogID).modal('toggle');
            });
        },
        showConfirmByMessage: function (fieldname, data, key, title, callback) {
            initEnterMessageModal(fieldname, title);
            modalToggle();
            $("#" + $dialogID + " .btnOk").on("click", function () {
                let message = $('#' + fieldname).val();
                callback(true, message, data, key);
                $('#' + $dialogID).modal('toggle');
            });
            $("#" + $dialogID + " .btnCancel").on("click", function () {
                let message = '';
                callback(false, message, data, key);
                $('#' + $dialogID).modal('toggle');
            });
        },
        showMessage: function (msg, title) {
            initModal(msg, title);
            modalToggle();
            $("#" + $dialogID + " .btnOk").hide();
        }
    }
}();

/**********************************
*   CodeHelp use BootstrapTable
**********************************/
//bindColumns: function (table) {
//    var columns = [];
//    $("table" + table + " thead tr th").each(function () {
//        //if ($(this).attr("col-name") === "ColumnIndex")
//        //    columns.push({ 'data': '' });
//        //else
//        columns.push({ 'data': $(this).attr("col-name") });
//    });
//    return columns;
//},
var $kscodehelp = function () {
    var $modal = null;
    var $table = null;
    var $searchType = null;
    var $searchValue = null;
    var $deptcode = "";

    var $dataTable = "";
    var $count = 0;
    var $url = "";

    var $pageSize = 10;
    var $pageIndex = 1;
    var $totalPage = 1;

    function setTablePageSize() {
        return $pageSize;
    }
    function loadTableData(url) {
        $deptcode = "";
        $ksdialog.showLoading();
        var type = $searchType.find(":selected").val();
        if (!type)
            type = "";
        $.ajax({
            method: 'POST',
            async: false,
            url: url + '?type=' + type + '&text=' + $searchValue.val() + '&page=' + $pageIndex + '&size=' + $pageSize,
            dataType: 'json',
            contentType: "application/json",
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': 'false'
            },
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Token', 'super123#@!');
            },
            success: function (response) {
                console.log(response);
                if (response) {
                    var jsonResult = JSON.parse(response);
                    if (jsonResult != null) {
                        $dataTable = jsonResult.Data;
                        $totalPage = jsonResult.Total;
                        $table.bootstrapTable('load', $dataTable);            //nếu dùng 'load' thì phải thêm option data-toggle="table" vào table
                    }
                    else {
                        $table.children('tbody').empty();
                        $totalPage = 0;
                        $dataTable = '';
                    }
                }
            },
            error: function (e) {
                console.log("error: " + e.responseText);
                $dataTable = '';
                $ksdialog.closeLoading();
            },
            complete: function () {
                $ksdialog.closeLoading();
            },
        });
    }
    function loadTableEmpByDept(url, deptcode) {
        $deptcode = deptcode;
        $ksdialog.showLoading();
        var type = $searchType.find(":selected").val();
        if (!type)
            type = "";
        $.ajax({
            method: 'POST',
            async: false,
            url: url + '?dept=' + deptcode + '&type=' + type + '&text=' + $searchValue.val() + '&page=' + $pageIndex + '&size=' + $pageSize,
            dataType: 'json',
            contentType: "application/json",
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': 'false'
            },
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Auth-Token', 'ksems2021#@!');
            },
            success: function (response) {
                if (response) {
                    var jsonResult = JSON.parse(response);
                    if (jsonResult != null) {
                        $dataTable = jsonResult.Data;
                        $totalPage = jsonResult.Total;
                        $table.bootstrapTable('load', $dataTable);            //nếu dùng 'load' thì phải thêm option data-toggle="table" vào table
                    }
                    else {
                        $table.children('tbody').empty();
                        $totalPage = 0;
                        $dataTable = '';
                    }
                }
            },
            error: function (e) {
                console.log("error: " + e.responseText);
                $dataTable = '';
                $ksdialog.closeLoading();
            },
            complete: function () {
                $ksdialog.closeLoading();
            },
        });
    }
    function clearData() {
        $dataTable = "";
        $count = 0;
        $searchType.prop("selectedIndex", 0);
        $searchValue.val("");
    }
    function modalToggle() {
        $modal.modal('toggle');
    }
    return {
        Init: function (modalID, tableID, searchSelectID, searchInputID, paginationID) {
            $modal = $('#' + modalID);
            $table = $('#' + tableID);
            $searchType = $('#' + searchSelectID);
            $searchValue = $('#' + searchInputID);
            $kspagination.Init(paginationID);

            $pageSize = 10;
            $pageIndex = 1;
            $totalPage = 1;
        },
        SetPageIndex: function (num) {
            $pageIndex = num;
        },
        RefreshData: function () {
            if ($modal && $table && $searchType && $searchValue) {
                if ($deptcode == "") {
                    loadTableData($url);
                }
                else {
                    loadTableEmpByDept($url, $deptcode);
                }
                $kspagination.CheckChangeTotal($totalPage);
            }
            else {
                console.log("===> $kscodehelp.RefreshData() is not valid!");
            }
        },
        EnterSearch: function (event) {
            if (event.keyCode === 13) {
                if ($modal && $table && $searchType && $searchValue) {
                    $pageIndex = 1;
                    if ($deptcode == "") {
                        loadTableData($url);
                    }
                    else {
                        loadTableEmpByDept($url, $deptcode);
                    }
                    $kspagination.CheckChangeTotal($totalPage);
                }
                else {
                    console.log("===> $kscodehelp.SearchData() is not valid!");
                }
            }
        },
        SearchData: function () {
            if ($modal && $table && $searchType && $searchValue) {
                $pageIndex = 1;
                if ($deptcode == "") {
                    loadTableData($url);
                }
                else {
                    loadTableEmpByDept($url, $deptcode);
                }
                $kspagination.CheckChangeTotal($totalPage);
            }
            else {
                console.log("===> $kscodehelp.SearchData() is not valid!");
            }
        },
        ShowModalCodehelp: function (url, callBack) {
            // clear data for not show old data in different modal
            clearData();
            //console.log(url);
            if ($modal && $table && $searchType && $searchValue) {
                $url = url;
                loadTableData(url);
                modalToggle();
                $kspagination.Reset();
                $kspagination.SetSize($totalPage);
                // onDblClickRow => nếu dùng method 'load' thì phải dùng đoạn code này
                $table.on('dbl-click-row.bs.table', function (e, row, $element) {
                    modalToggle();
                    if ($count == 0) {          // for callback only 1 time in 1 doubleclick event
                        $count++;
                        callBack(row);
                    }
                });
            }
            else {
                console.log("===> $kscodehelp.ShowModalCodehelp() is not valid");
            }
        },
        //duyhung 2021.02.05
        ShowListEmpByDept: function (url, callBack, deptcode) {
            // clear data for not show old data in different modal
            clearData();
            if ($modal && $table && $searchType && $searchValue) {
                $url = url;
                loadTableEmpByDept(url, deptcode);
                modalToggle();
                //show pagination
                $kspagination.Reset();
                $kspagination.SetSize($totalPage);
                // onDblClickRow => nếu dùng method 'load' thì phải dùng đoạn code này
                $table.on('dbl-click-row.bs.table', function (e, row, $element) {
                    modalToggle();
                    if ($count == 0) {          // for callback only 1 time in 1 doubleclick event
                        $count++;
                        callBack(row);
                    }
                });
            }
            else {
                console.log("===> $kscodehelp.loadTableEmpByDept() is not valid");
            }
        },
    }
}();

/**********************************
*   Script for Pagination
**********************************/
var $kspagination = function () {
    var $pagination = null;

    const $iarea = 3;                   // maximum number of buttons in left and right side of selected page
    var $itotal = 1;                    // total page
    var $index = 1;                     // index of current active page

    function removeAll() {
        $pagination.children('li.page-item').remove();
    }
    function addButtonClick(num) {
        $pagination.append('<li class="page-item"><a class="page-link" href="#" onclick="$kspagination.GoToPage(' + num + ')">' + num + '</a></li>');
    }
    function addbtnPrev() {
        var s = '';
        s += '<li class="page-item ' + ($index == 1 ? "disabled" : "") + '">';
        s += '<a class="page-link" href="#" data-num="next" onclick="$kspagination.GoToPrev()">';
        s += '<span aria-hidden="true">&lsaquo;</span><span class="sr-only"></span></a></li>';
        $pagination.append(s);
    }
    function addbtnNext() {
        var s = '';
        s += '<li class="page-item ' + ($index == $itotal ? "disabled" : "") + '">';
        s += '    <a class="page-link" href="#" data-num="next" onclick="$kspagination.GoToNext()">';
        s += '        <span aria-hidden="true">&rsaquo;</span><span class="sr-only"></span></a></li>';
        $pagination.append(s);
    }
    function addbtnFirst() {
        if ($index > 1) {
            addButtonClick(1);
        }
        if ($index > $iarea + $iarea - 1) {
            var s = "";
            s += '<li class="page-item disabled">';
            s += '    <a class="page-link">';
            s += '        <span aria-hidden="true">...</span><span class="sr-only">...</span></a></li>';
            $pagination.append(s);
        }
    }
    function addListPrev() {
        if ($index > 1) {
            if ($index <= $iarea + $iarea - 1) {
                for (var i = $iarea - 1; i < $index; i++) {
                    addButtonClick(i);
                }
            }
            else {
                for (var i = $index - $iarea + 1; i > 0 && i < $index; i++) {
                    addButtonClick(i);
                }
            }
        }
    }
    function addCurrent() {
        $pagination.append('<li class="page-item active"><a class="page-link" href="#">' + $index + '</a></li>');
    }
    function addListNext() {
        if ($index < $itotal) {
            if ($index < $itotal - $iarea - 1) {
                for (var i = $index + 1; i < $index + $iarea && i <= $itotal - 1; i++) {
                    addButtonClick(i);
                }
            }
            else {
                for (var i = $index + 1; i < $itotal; i++) {
                    addButtonClick(i);
                }
            }
        }
    }
    function addbtnLast() {
        if ($index <= $itotal - $iarea - 2) {
            var s = "";
            s += '<li class="page-item disabled">';
            s += '    <a class="page-link">';
            s += '        <span aria-hidden="true">...</span><span class="sr-only">...</span></a></li>';
            $pagination.append(s);
        }
        if ($index < $itotal) {
            addButtonClick($itotal);
        }
    }
    function update() {
        removeAll();
        if ($itotal > 0 && $index >= 1) {
            addbtnPrev();
            addbtnFirst();
            addListPrev();
            addCurrent();
            addListNext();
            addbtnLast();
            addbtnNext();
        }
    }
    function reset() {
        $index = 1;
        removeAll();
        if ($itotal > 0 && $index >= 1) {
            addbtnPrev();
            addbtnFirst();
            addListPrev();
            addCurrent();
            addListNext();
            addbtnLast();
            addbtnNext();
        }
    }
    function refreshTableData() {
        $kscodehelp.SetPageIndex($index);
        $kscodehelp.RefreshData();
    }
    return {
        Init: function (paginationID) {
            $pagination = $('#' + paginationID);
            $itotal = 1;
            $index = 1;
        },
        Reset: function () {
            reset();
        },
        CheckChangeTotal(num) {
            if ($itotal != parseInt(num)) {
                $itotal = parseInt(num);
                reset();
            }
        },
        SetSize: function (num) {
            if ($pagination) {
                try {
                    $itotal = parseInt(num);
                    reset();
                }
                catch (e) {
                }
            }
            else {
                console.log("===> $kspagination.SetSize() is not valid");
            }
        },
        Show: function () {
            if ($pagination) {
                reset();
                $pagination.show();
            }
            else {
                console.log("===> $kspagination.Show() is not valid");
            }
        },
        GoToPrev: function () {
            if ($pagination) {
                $index = parseInt($index) - 1;
                update();
                refreshTableData();
            }
            else {
                console.log("===> $kspagination.GoToPrev() is not valid");
            }
        },
        GoToNext: function () {
            if ($pagination) {
                $index = parseInt($index) + 1;
                update();
                refreshTableData();
            }
            else {
                console.log("===> $kspagination.GoToNext() is not valid");
            }
        },
        GoToPage: function (num) {
            if ($pagination) {
                if (num && num != "") {
                    try {
                        $index = parseInt(num);
                        if ($index <= 0) {
                            $index = 1;
                        }
                        if ($index > $itotal) {
                            $index = $itotal;
                        }
                        update();
                        refreshTableData();
                    }
                    catch (e) {
                        $ksmessage.warning("* Please input valid page number!");
                    }
                }
                else {
                    $ksmessage.warning("* Please input page number!");
                }
            }
            else {
                console.log("===> $kspagination.GoToPage() is not valid");
            }
        },
    }
}();