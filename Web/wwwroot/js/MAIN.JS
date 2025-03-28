/*=========================================================================================
  File Name:    main.js
  Description:  main layout button script
  ----------------------------------------------------------------------------------------
  Author:       duy hung
  ----------------------------------------------------------------------------------------
  Date		    | Updater	| Modify Desc
  -------------------------------------------------------------------------------------
  2022-02-09    | duy hung	| first draft
==========================================================================================*/
$(document).ready(function () {
    $('a[change-language]').on('click', function (e) {
        e.preventDefault();
        let cult = this.getAttribute("data-language");
        $.ajax({
            type: "post",
            url: '/api/base/setlanguage?c=' + cult,
            success: function (res) {
                if (res) {
                    $kspage.reload();
                }
            },
        });
    });

    //////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////
    $('.app-sidemenu').on('click', 'a[clickable-menu]', function (e) {
        e.preventDefault(); // prevent default link button redirect behaviour
        $kspage.openmenu(this, 1);
    });

    $('.app-menu').on('click', 'a[clickable-menu]', function (e) {
        e.preventDefault(); // prevent default link button redirect behaviour
        $kspage.openmenu(this, 1);
    });

    $('.app-component-pagination').on('click', 'a[clickable-paging]', function (e) {
        e.preventDefault();
        $kspage.openmenu(this, 0);
    });

    //////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////
    let $toogleDark = $('i[toogle-dark]');
    $toogleDark.on('click', function () {
        let dark = cmGetCookie('darktheme');
        if (dark === "1") {
            if ($('body').hasClass("dark-theme")) {
                $('body').removeClass('dark-theme');
            }
            cmSetCookie("darktheme", "0", 7);
            $toogleDark.removeClass('bg-primary text-muted');
        } else {
            if (!$('body').hasClass("dark-theme")) {
                $('body').addClass('dark-theme');
            }
            cmSetCookie("darktheme", "1", 7);
            $toogleDark.addClass('bg-primary text-muted');
        }
    });
});