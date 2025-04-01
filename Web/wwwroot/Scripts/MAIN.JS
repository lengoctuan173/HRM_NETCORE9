/*=========================================================================================
  File Name:    main.js
  Description:  main page script
  ----------------------------------------------------------------------------------------
  Author:       duy hung
  ----------------------------------------------------------------------------------------
  Date		    | Updater	| Modify Desc
  -------------------------------------------------------------------------------------
  2020-08-07    | duy hung	| first draft
  2022-01-14    | duy hung  | chỉnh lại hàm load ngôn ngữ và profile không dùng ajax
==========================================================================================*/
$(document).ready(function () {
    /**********************************
    *   Compact Menu
    **********************************/
    $('.app-admin-wrap').on('click', '.menu-toggle', function (event) {
        let isSidebarOpen = $(".sidebar-left").hasClass("open");
        if (isSidebarOpen) {
            cmSetCookie("compact", "0", 7);
        } else {
            cmSetCookie("compact", "1", 7);
        }
    });

    /**********************************
    *   Set theme
    **********************************/
    //$('.app-profilemenu').on('change', 'input.darktheme', function (event) {
    //    const checked = $(this).is(":checked");
    //    if (checked) {
    //        cmSetCookie("darktheme", "1", 7);
    //        if (!$('body').hasClass("dark-theme")) {
    //            $('body').addClass('dark-theme');
    //        }
    //    } else {
    //        cmSetCookie("darktheme", "0", 7);
    //        if ($('body').hasClass("dark-theme")) {
    //            $('body').removeClass('dark-theme');
    //        }
    //    }
    //});

    /**********************************
    *   Click scroll
    **********************************/
    $('.app-footer').on('click', '[btn-go-top]', function (event) {
        //window.scrollTo({ top: 0, behavior: 'smooth' });
        /* test show message */
        var mo = {};
        mo[toastProps.positionClass] = toastPosition.botright;
        $ksmessage.errorWithCopier("Test thông báo với nút copy! Test thử một thông báo dưới góc bot-right với nội dung là một đoạn văn bản dài thật là dài coi xem có copy được không!", "Nhấn để copy nội dung", mo);

        /* test show loading */
        $ksdialog.showLoading("Test Loading! Thông báo này sẽ tự ẩn sau 5s!", 5);
    });

    /**********************************
    *   Clickable menu
    **********************************/
    $('#appMegaMenuButton').on('click', function (e) {
        e.preventDefault(); // prevent default link button redirect behaviour
        $('.app-sidemenu').find('.sidebar-left-secondary').removeClass('open');
    });

    $('.app-megamenu').on('click', 'a[data-href]', function (e) {
        e.preventDefault(); // prevent default link button redirect behaviour
        $kspage.openmenu(this, 1);
    });

    $('.app-pageopened').on('click', 'li[page-opened]', function (e) {
        e.preventDefault(); // prevent default link button redirect behaviour
        $kspage.openmenu(this, 0);
    });

    $(".app-notificationarea [data-perfect-scrollbar]").each(function (index) {
        var $el = $(this);
        var ps = new PerfectScrollbar(this, {
            suppressScrollX: $el.data("suppress-scroll-x"),
            suppressScrollY: $el.data("suppress-scroll-y")
        });
    });

    /**********************************
    *   Search menu
    **********************************/
    $('.app-searchmenu-button').on('click', function (e) {
        e.preventDefault(); // prevent default link button redirect behaviour
        $('.app-searchmenu').find('input.app-searchmenu-textbox').focus();
    });

    $('.app-searchmenu').on('blur', 'input.app-searchmenu-textbox', function (e) {
        e.preventDefault(); // prevent default link button redirect behaviour
        searchMenu();
    });

    $('.app-searchmenu').on('keyup', 'input.app-searchmenu-textbox', function (e) {
        e.preventDefault(); // prevent default link button redirect behaviour
        searchMenu();
    });

    $('.app-searchmenu').on('click', 'a[data-href]', function (e) {
        e.preventDefault(); // prevent default link button redirect behaviour
        $kspage.openmenu(this, 1);
    });

    /**********************************
    *   Change Language
    **********************************/
    //$('.app-setlang').on('click', 'a[change-language]', function (e) {
    //    e.preventDefault(); // prevent default link button redirect behaviour
    //    const cult = this.getAttribute("data-language");
    //    let returnUrl = $(location).attr('pathname');
    //    if (!returnUrl) {
    //        returnUrl = "/";
    //    }
    //    $.ajax({
    //        type: "post",
    //        url: '/Home/SetLanguage?culture=' + cult + '&returnUrl=' + returnUrl,
    //        success: function (data) {
    //            $kspage.reload();
    //        },
    //    });
    //});

    /**********************************
    *   add by Hueerp (change language mobile
    **********************************/
    $('.app-setlang').on('click', 'a[change-languagem]', function (e) {
        e.preventDefault(); // prevent default link button redirect behaviour
        const cult = this.getAttribute("data-language");
        let returnUrl = $(location).attr('pathname');
        console.log(returnUrl);
        if (!returnUrl) {
            returnUrl = "/";
        }
        $.ajax({
            type: "post",
            url: '/Mobile/Home/SetLanguage?culture=' + cult + '&returnUrl=' + returnUrl,
            success: function (data) {
                $kspage.reload();
            },
        });
    });
});

function searchMenu() {
    const input = $('.app-searchmenu').find('input.app-searchmenu-textbox');
    const resultbody = $('.app-searchmenu').find('.app-searchmenu-result');
    if (input != null && input != undefined) {
        const text = input.val().trim();
        resultbody.empty();
        if (text.length > 0) {
            let arr = [];
            const menus = $('.app-sidemenu').find('.sidebar-left-secondary li.Ul_li--hover');
            $.each(menus, function () {
                if ($(this).text().toLowerCase().indexOf(text.toLowerCase()) >= 0)
                    arr.push($(this))
            });
            if (arr.length > 0) {
                $.each(arr, function () {
                    const href = $(this).find('a').attr('data-href');
                    const icon = $(this).find('i').removeClass('nav-icon').attr('class');
                    const text = $(this).text();
                    let s = '';
                    s += '<div class="col-lg-3 col-md-6 col-sm-6">';
                    s += '<div class="card card-icon-bg card-icon-bg-primary o-hidden mb-4">';
                    s += '<a class="card-body" href="#" data-href="' + href + '">';
                    s += '<i class="' + icon + ' text-primary"></i>'
                    s += '<div class="content">';
                    s += '<p class="text-muted h5 mt-2">' + text + '</p>';
                    s += '<p class="text-primary mb-0">' + href + '</p>';
                    s += '</div></a></div></div>';
                    resultbody.append(s);
                });
            }
        }
    }
}
/* End */