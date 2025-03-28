/*=========================================================================================
  File Name:    ks.ems.cultures.js
  Description:  for all controls js need multiple language
  ----------------------------------------------------------------------------------------
  Author:       duy hung
  ----------------------------------------------------------------------------------------
  Date		    | Updater	| Modify Desc
  -------------------------------------------------------------------------------------
  2020-09-16    | duy hung	| first draft
==========================================================================================*/
var $cultureDataTable = function () {
    var lang = {
        'en-US': {
            "sEmptyTable": "No data available in table",
            "sInfo": "Showing _START_ to _END_ of _TOTAL_ entries",
            "sInfoEmpty": "Showing 0 to 0 of 0 entries",
            "sInfoFiltered": "(filtered from _MAX_ total entries)",
            "sInfoPostFix": "",
            "sInfoThousands": ",",
            "sLengthMenu": "Show _MENU_ entries",
            "sLoadingRecords": "Loading...",
            "sProcessing": "Processing...",
            "sSearch": "Search:",
            "sZeroRecords": "No matching records found",
            "oPaginate": {
                "sFirst": "First",
                "sLast": "Last",
                "sNext": "Next",
                "sPrevious": "Previous"
            },
            "oAria": {
                "sSortAscending": ": activate to sort column ascending",
                "sSortDescending": ": activate to sort column descending"
            }
        },
        'vi-VN': {
            "sEmptyTable": "Không có dữ liệu phù hợp",
            "sInfo": "Đang xem _START_ đến _END_ trong tổng số _TOTAL_ mục",
            "sInfoEmpty": "Đang xem 0 đến 0 trong tổng số 0 mục",
            "sInfoFiltered": "(được lọc từ _MAX_ mục)",
            "sInfoPostFix": "",
            "sInfoThousands": ",",
            "sLengthMenu": "Xem _MENU_ mục",
            "sLoadingRecords": "Đang tải...",
            "sProcessing": "Đang xử lý...",
            "sSearch": "Tìm kiếm:",
            "sZeroRecords": "Không tìm thấy mục phù hợp",
            "oPaginate": {
                "sFirst": "Đầu",
                "sPrevious": "Trước",
                "sNext": "Tiếp",
                "sLast": "Cuối"
            },
            "oAria": {
                "sSortAscending": ": nhấn đề sắp xếp tăng dần",
                "sSortDescending": ": nhấn đề sắp xếp giảm dần"
            },
            "sUrl": "",
        },
    };

    return {
        language: function (culture) {
            if (lang[culture])
                return lang[culture];
            else
                return lang['en-US'];
        }
    }
}();

var $cultureBootstrapTable = function () {
    var lang = {
        'en-US': {
        },
        'vi-VN': {
        },
    };
    return {
        language: function (culture) {
            if (lang[culture])
                return lang[culture];
            else
                return lang['en-US'];
        }
    }
}();