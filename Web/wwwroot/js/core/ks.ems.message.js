/*=========================================================================================
  File Name:    message.js
  Description:  message function script
  ----------------------------------------------------------------------------------------
  Author:       duy hung
  ----------------------------------------------------------------------------------------
  Date		    | Updater	| Modify Desc
  -------------------------------------------------------------------------------------
  2020-08-04    | duy hung	| first draft
==========================================================================================*/

/**********************************
*   message box object
**********************************/
var $ksmessage = {
    culture: document.getElementById('_currentCulture').value == '' ? 'en-US' : document.getElementById('_currentCulture').value,
    info: function (msg, title, optionsOverride) {
        this.show(toastType.info, msg, title ?? toastTitle[this.culture][4], optionsOverride);
    },
    success: function (msg, title, optionsOverride) {
        this.show(toastType.success, msg, title ?? toastTitle[this.culture][0], optionsOverride);
    },
    error: function (msg, title, optionsOverride) {
        this.show(toastType.error, msg, title ?? toastTitle[this.culture][1], optionsOverride);
    },
    warning: function (msg, title, optionsOverride) {
        this.show(toastType.warning, msg, title ?? toastTitle[this.culture][2], optionsOverride);
    },
    messFlag: function (flag, msg, title, optionsOverride) {
        var tit = "";
        if (toastTitle.hasOwnProperty(this.culture))
            tit = toastTitle[this.culture][flag];
        switch (flag + '') {
            case '0':
                this.show(toastType.success, msg, title ?? tit, optionsOverride);
                break;
            case '1':
                this.show(toastType.error, msg, title ?? tit, optionsOverride);
                break;
            case '2':
            case '3':
                this.show(toastType.warning, msg, title ?? tit, optionsOverride);
                break;
            default:
                this.show(toastType.info, msg, title ?? tit, optionsOverride);
                break;
        }
    },
    errorWithCopier: function (msg, title, optionsOverride) {
        copyToClipboard(msg);
        this.show(toastType.error, (msg + '<br/><br/><button type="button" class="btn btn-dark" onclick=\'copyToClipboard("' + msg + '");\'><i class="ft-copy"></i> Copy it! </button>'), title, optionsOverride);
    },
    show: function (type, msg, title, optionsOverride) {
        toastr.options.positionClass = toastPosition.topright;
        toastr.options.showDuration = 330;
        toastr.options.hideDuration = 330;
        toastr.options.timeOut = 5000;
        toastr.options.extendedTimeOut = 1000;
        toastr.options.showEasing = toastEasing.swing;
        toastr.options.hideEasing = toastEasing.swing;
        toastr.options.showMethod = toastShowMethod.fadeIn;
        toastr.options.hideMethod = toastHideMethod.fadeOut;
        toastr.options.closeButton = false;
        toastr.options.debug = false;
        toastr.options.newestOnTop = true;
        toastr.options.progressBar = true;
        toastr.options.rtl = false;
        toastr.options.preventDuplicates = true;
        toastr.options.onclick = null;

        if (optionsOverride) {
            this.overrideProperty(optionsOverride);
        }

        var $toast = toastr[type](msg, title ?? "<br/>");      /* Wire up an event handler to a button in the toast, if it exists */
        $toastlast = $toast;
        var $toastElement = $('<div/>');
        $toastElement.addClass('toast').addClass('toast-info');

        if (typeof $toast === 'undefined') {
            return;
        }

        if ($toast.find('.clear').length) {
            $toast.delegate('.clear', 'click', function () {
                toastr.clear($toast, { force: true });
            });
        }
    },
    overrideProperty: function (optionsOverride) {
        objOverrideProps(toastr, optionsOverride);
    },
};

/**********************************
*   Toast message
**********************************/
var toastProps = {
    positionClass: 'positionClass',
    showDuration: 'showDuration',
    hideDuration: 'hideDuration',
    timeOut: 'timeOut',
    extendedTimeOut: 'extendedTimeOut',
    showEasing: 'showEasing',
    hideEasing: 'hideEasing',
    showMethod: 'showMethod',
    hideMethod: 'hideMethod',
    closeButton: 'closeButton',
    debug: 'debug',
    newestOnTop: 'newestOnTop',
    progressBar: 'progressBar',
    rtl: 'rtl',
    preventDuplicates: 'preventDuplicates',
    onclick: 'onclick',
    iconClass: 'iconClass',
};

var toastType = {
    error: 'error',
    info: 'info',
    success: 'success',
    warning: 'warning'
};

var toastPosition = {
    top: 'toast-top',
    topleft: 'toast-top-left',
    topright: 'toast-top-right',
    topfull: 'toast-top-full-width',
    bot: 'toast-bottom',
    botleft: 'toast-bottom-left',
    botright: 'toast-bottom-right',
    botfull: 'toast-bottom-full-width',
};

var toastEasing = {
    swing: 'swing',
    linear: 'linear',
};

var toastShowMethod = {
    slideDown: 'slideDown',
    fadeIn: 'fadeIn',
    show: 'show',
};

var toastHideMethod = {
    slideUp: 'slideUp',
    fadeOut: 'fadeOut',
    hide: 'hide',
};

var toastTitle = {
    'en-US': ['Success', 'Error', 'Warning', 'Warning', 'Info'],
    'vi-VN': ['Thành công', 'Lỗi', 'Cảnh báo', 'Cảnh báo', 'Thông tin'],
};