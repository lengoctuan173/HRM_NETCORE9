/*=========================================================================================
  File Name:    component.js
  Description:  View Component scripts
  ----------------------------------------------------------------------------------------
  Author:       duy hung
  ----------------------------------------------------------------------------------------
  Date		    | Updater	| Modify Desc
  -------------------------------------------------------------------------------------
  2020-12-14    | duy hung	| first draft
==========================================================================================*/

/**********************************
*  function for modal Department
**********************************/
var $kscomponent = function () {
    var $modalDeptId = "departmentmodal";
    var $modalDeptTreeId = "tree";

    function toggleDeptModal() {
        $('#' + $modalDeptId).modal('toggle');
    }
    function loadDeptTree(inputVal, tag) {
        $.ajax({
            type: "GET",
            url: '/DepartmentAll/GetTreeDept',
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (response) {
                if (response.children) {
                    bindDeptTree(response.children);
                }
            },
            error: function (jqXhr, exception) {
                console.log(jqXhr, exception);
                $ksmessage.error(getResource("ErrorExecuteAjaxFailed"));
            },
        });
    }
    function loadDeptTreeCheckbox(inputVal, tag) {
        $.ajax({
            type: "GET",
            url: '/DepartmentAll/GetTreeDept',
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (response) {
                if (response.children) {
                    bindDeptTreeCheckbox(response.children);
                }
            },
            error: function (jqXhr, exception) {
                console.log(jqXhr, exception);
                $ksmessage.error(getResource("ErrorExecuteAjaxFailed"));
            },
        });
    }
    function bindDeptTree(list) {
        var tree = $('#' + $modalDeptTreeId).tree({
            primaryKey: 'id',
            dataSource: list,
            select: function (e, node, id) {
                var data = tree.getDataById(id);
                GetDept(data.id, data.text);
            },
        });
    }
    function bindDeptTreeCheckbox(list) {
        var tree = $('#' + $modalDeptTreeId).tree({
            primaryKey: 'id',
            dataSource: list,
            checkboxes: true,
        });

        $('#btnSelect').on('click', function () {
            var result = tree.getCheckedNodes();
            //var deptid = [];
            var text = "";
            var deptid = result.join();
            var resultArray = deptid.split(',').map(function (deptid) { return String(deptid); });
            for (var i = 0; i < resultArray.length; i++) {
                var text = text.substr(0) + '-' + tree.getDataById(resultArray[i]).text;
            }
            GetDept(deptid, text);
        });
    }
    return {
        openDeptTree: function () {
            loadDeptTree();
            toggleDeptModal();
            $('#btnSelect').hide();
        },
        openDeptTreeCheckbox: function () {
            loadDeptTreeCheckbox();
            toggleDeptModal();
            $('#btnSelect').show();
        },
        closeModal: function () {
            toggleDeptModal();
        },
        //hideSelect: function () {
        //    $('#btnSelect').hide();
        //},
        //showSelect: function () {
        //    $('#btnSelect').show();
        //},
    }
}();