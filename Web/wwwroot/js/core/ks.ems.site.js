/*=========================================================================================
  File Name:    site.js
  Description:  Site script
  ----------------------------------------------------------------------------------------
  Author:       duy hung
  ----------------------------------------------------------------------------------------
  Date		    | Updater	| Modify Desc
  -------------------------------------------------------------------------------------
  2020-07-31    | duy hung	| first draft
==========================================================================================*/

/**********************************
*   Menu & Pages function
**********************************/
var $kspage = function () {
    function redirectUrl(url) {
        window.location.href = url;
    }
    function getAction() {
        const path = $(location).attr('pathname');
        if (path && path.indexOf('?') >= 0) {
            return path.split('?')[0];
        }
        return (path || "/");
    }
    function getParam() {
        const path = $(location).attr('href');
        if (path && path.indexOf('?') >= 0) {
            return path.split('?')[1];
        }
        return '';
    }
    function addPageOpened(url) {
        if (!url) {
            return;
        }
        let list = sessionStorage.LOpened;
        if (!list || list === 'undefined') {
            list = '';
        }
        if (list.indexOf(url) < 0) {
            list = url + "," + list;    //add vào đầu để trang mới mở sẽ nằm trên cùng
        }
        sessionStorage.LOpened = list;
    }
    function drawPageOpened() {
        let list = sessionStorage.LOpened + '';
        if (list && list !== 'undefined') {
            const a = list.split(',');
            for (let i = 0; i < a.length; i++) {
                if (a[i].length <= 2 || a[i] == 'undefined')
                    continue;

                let menu = null;
                $('.app-sidemenu').find('.sidebar-left-secondary a[data-href]').each(function () {
                    if ($(this).attr("data-href").indexOf(a[i]) >= 0) {
                        menu = $(this);
                    }
                });
                if (menu !== null && menu !== undefined) {
                    let s = '';
                    let url = a[i];
                    if (url.indexOf('?') >= 0) {
                        url += ('&' + 'ls=1');
                    }
                    else {
                        url += ('?' + 'ls=1');
                    }
                    s += '<li class="nav-item" page-opened data-href="' + url + '">' + menu.html().trim() + '</li>';
                    $('.app-pageopened ul').append(s);
                }
            }
        }
    }
    return {
        checkInitMessage: function () {
            const m1 = getAction();
            const m2 = getParam();
            $ksmessage.info(m1 + ", " + m2);
        },
        redirectUrl: function (url) {
            redirectUrl(url);
        },
        openmenu: function (obj, saveopened) {
            const href = obj.getAttribute("data-href");
            if (href && href != "#") {
                const url = href.replace("~", "").replace("//", "/").trim();
                if (url == null || url == undefined || url == '')
                    return;
                if (saveopened == 1 && url != '/') {
                    addPageOpened(url);
                }
                redirectUrl(url);
            }
        },
        open: function (url, saveopened) {
            if (url == null || url == undefined || url == '')
                return;
            if (saveopened == 1 && url != '/') {
                addPageOpened(url);
            }
            redirectUrl(url);
        },
        reload: function () {
            window.location.reload();
        },
        backprev: function () {
            window.location.backprev();
        },
        checkPageOpened: function () {
            drawPageOpened();
        },
    }
}();