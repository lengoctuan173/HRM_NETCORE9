//ES6 Class
class Signup {
    constructor() {
        this.initEvents();
    }
    initEvents() {
        // Sự kiện thay đổi radio button
        $("input[name='radioSendCode']").change(() => this.toggleInputFields());

        // Sự kiện click nút "Signup"
        $("#btnSignup").click((e) => this.handleSignup(e));

        // Sự kiện click nút "Send Code"
        $("#btnSendCode").click(() => this.sendVerificationCode());
    }

    toggleInputFields() {
        $("#rowEmail, #rowMobile").toggleClass('d-none');
    }

    handleSignup(e) {
        e.preventDefault(); // Ngăn chặn form submit mặc định
        let email = $("#inputEmail").val().trim();
        let mobile = $("#inputMobile").val().trim();
        let password = $("#inputPassword").val().trim();
        let confirmPassword = $("#inputConfirmPassword").val().trim();
        let isEmail = $("input[name='radioSendCode']:checked").val() === '1';
        // Kiểm tra dữ liệu nhập vào
        if (isEmail && email === "") {
            alert("Email is required!");
            return;
        }

        if (!isEmail && mobile === "") {
            alert("Mobile is required!");
            return;
        }

        if (password === "" || confirmPassword === "") {
            alert("Password fields cannot be empty!");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        // Nếu hợp lệ, submit form
        $("form").submit();
    }

    sendVerificationCode() {
        let isEmail = $("input[name='radioSendCode']:checked").val() === '1';
        let contactInfo = isEmail ? $("#inputEmail").val().trim() : $("#inputMobile").val().trim();

        if (contactInfo === "") {
            alert(isEmail ? "Please enter your email!" : "Please enter your mobile number!");
            return;
        }
        alert("Verification code sent to " + contactInfo);
        // TODO: Gọi API gửi mã xác nhận tại đây
    }
}

// Khởi tạo class khi tài liệu sẵn sàng
$(document).ready(() => {
    new Signup();
});