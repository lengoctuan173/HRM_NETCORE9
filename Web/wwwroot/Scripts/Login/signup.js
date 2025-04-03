//ES6 Class
class Signup {
    constructor() {
        this.initEvents();
        this.otpTimer = null;
        this.otpTimeout = 120; // 2 minutes countdown (in seconds)
    }
    initEvents() {
        // Sự kiện thay đổi radio button
        $("input[name='radioSendCode']").change(() => this.toggleInputFields());

        // Sự kiện click nút "Signup"
        $("#btnSignup").click((e) => this.handleSignup(e));

        // Sự kiện click nút "Send Code"
        $("#btnSendCode").click(() => this.sendVerificationCode());

        // Sự kiện click nút "Send Code"
        $("#btnReSendCode").click(() => this.sendVerificationCode());

        // Sự kiện click nút "Verify Code"
        $("#btnVerifyCode").click(() => this.verifyOtp());
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
        $("#btnSendCode,#btnReSendCode").addClass('d-none');
        $("#btnVerifyCode,#lblVerifisuccess").removeClass('d-none');
        $('#inputCode').prop('disabled', false).focus();
        this.otpTimeout = 120;  // Reset lại thời gian mỗi lần gửi mã mới
        // Bắt đầu đếm ngược thời gian
        this.startOtpCountdown();
        // TODO: Gọi API gửi mã xác nhận tại đây
        let requestData = isEmail
            ? { email: contactInfo, mobile: "" }
            : { email: "", mobile: contactInfo };

        // Gửi request đến API
        $.ajax({
            url: "/api/login/send-code", // Đảm bảo API này đúng đường dẫn
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(requestData),
            success: function (response) {
               // alert(response.message);
                $("#btnSendCode").prop("disabled", false).text("Send");
            },
            error: function (xhr) {
                //alert("Error: " + xhr.responseText);
            }
        });
    }
    verifyOtp() {
        let isEmail = $("input[name='radioSendCode']:checked").val() === '1';
        let contactInfo = isEmail ? $("#inputEmail").val().trim() : $("#inputMobile").val().trim();
        let otp = $("#inputCode").val().trim();  // OTP nhập vào từ người dùng

        if (otp === "") {
            alert("Please enter the OTP!");
            return;
        }

        let requestData = isEmail
            ? { email: contactInfo, otp: otp }
            : { mobile: contactInfo, otp: otp };

        // Gửi request để xác thực OTP
        $.ajax({
            url: "/api/login/verify-code", // Đảm bảo API này đúng đường dẫn
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(requestData),
            success: (response) => { // Dùng arrow function để giữ ngữ cảnh `this`
                this.showFormPassword(); // ✅ Đúng
               // alert(response.message);
            },
            error: function (xhr) {
               // alert("Error: " + xhr.responseText);  // Hiển thị thông báo lỗi nếu có
            }
        });
    }
    //Ham hien thi password
    showFormPassword() {
        $('#rowpassword,#rowconfirmpassword').removeClass('d-none'); 
        $("#rowVerification").addClass('d-none');
        $('#inputEmail').prop('disabled', true);
        $('#rowpassword').focus();
    }
    // Hàm hiển thị thông báo lỗi gần trường nhập liệu
    showError(inputId, message) {
        $(inputId).addClass('is-invalid'); // Thêm class invalid vào trường nhập liệu
        $(inputId).next('.invalid-feedback').remove(); // Xóa thông báo lỗi cũ (nếu có)
        $(inputId).after(`<div class="invalid-feedback">${message}</div>`); // Thêm thông báo lỗi mới
    }
    startOtpCountdown() {
        let countdownDisplay = $("#lblVerifisuccess");
        let countdownInterval = setInterval(() => {
            if (this.otpTimeout <= 0) {
                clearInterval(countdownInterval); // Dừng đếm ngược
                $("#btnReSendCode").removeClass("d-none"); // Hiển thị nút resend
                countdownDisplay.text("OTP expired, please resend the code.");
            } else {
                countdownDisplay.text(`This OTP is valid for ${this.otpTimeout} seconds.`);
                this.otpTimeout--; // Giảm thời gian mỗi giây
            }
        }, 1000); // Cập nhật mỗi giây
    }

}

// Khởi tạo class khi tài liệu sẵn sàng
$(document).ready(() => {
    new Signup();
});