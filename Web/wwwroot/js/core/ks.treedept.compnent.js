/*----------------------------------------------------------------
* code help deptcode
-----------------------------------------------------------------*/
function GetDept(deptcode, text) {
    $('#txtDepartment').val(text);
    $('#hdfDeptcode').val(deptcode);
    $kscomponent.closeModal();
}
$('#txtDepartment').dblclick(function () {
    $kscomponent.openDeptTree();
});