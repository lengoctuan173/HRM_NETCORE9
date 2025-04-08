//ES6 Class
class Signup {
    constructor() {
        this.initEvents();
        this.otpTimer = null;
        this.otpTimeout = 60; // 1 minutes countdown (in seconds)
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
        let password = $("#inputPassword").val().trim();
        let confirmPassword = $("#inputConfirmPassword").val().trim();
        let isEmail = $("input[name='radioSendCode']:checked").val() === '1';
        // Kiểm tra dữ liệu nhập vào
        if (password === "" || confirmPassword === "") {
            alert("Password fields cannot be empty!");
            return;
        }
        // Kiểm tra nếu password và confirm password không khớp
        if (password !== confirmPassword) {
            // Thêm lỗi vào confirm password
            $("#formSignup")[0].classList.add("was-validated");
            $("#inputConfirmPassword")[0].setCustomValidity("err!");
            return;
        } else {
            // Đặt lại lỗi nếu mật khẩu khớp
            $("#inputConfirmPassword")[0].setCustomValidity("");
            
        }
        let requestData = isEmail
            ? { Email: $("#inputEmail").val().trim(), isEmail: true, Password: password }
            : { Mobile: $("#inputMobile").val().trim(), isEmail: false, Password: password };
        $.ajax({
            url: "/login/Signup", // Đảm bảo API này đúng đường dẫn
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(requestData),
            success: (response) => {
                if (response.isResult) {
                    // Thành công → chuyển trang hoặc hiện thông báo
                    window.location.href = "/home/index";
                }
            },
            error: (response) => {
               
            }
        });
        // Nếu hợp lệ, submit form
    /*    $("form").submit();*/
    }

    sendVerificationCode() {
        const form = document.getElementById("formSignup");
        let isEmail = $("input[name='radioSendCode']:checked").val() === '1';
        // Lấy giá trị từ trường email hoặc số điện thoại
        let contactInfo = isEmail ? $("#inputEmail").val().trim() : $("#inputMobile").val().trim();
        // Kiểm tra tính hợp lệ của trường tương ứng với lựa chọn (email hoặc số điện thoại)
        let isValid = isEmail ? $("#inputEmail")[0].checkValidity() : $("#inputMobile")[0].checkValidity();
        if (contactInfo === "" || !isValid) {
            form.classList.add("was-validated");
            return;
        }
        $('#btnReSendCode').hasClass('d-none') || $('#btnReSendCode').addClass('d-none');
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
            success: (response) => { 
                if (response.isResult) {
                    // Bắt đầu đếm ngược thời gian
                    this.otpTimeout = 60;  // Reset lại thời gian mỗi lần gửi mã mới
                    this.startOtpCountdown();
                }
                if (response.isExist) {
                    window.location.href = "/login/index";
                }
                else {
                    this.showFormSendCode(response.isResult);
                }
            },
            error:(response) => { 
                //alert("Error: " + xhr.responseText);
                this.showFormSendCode(false);
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
                if (response.isResult) {
                    this.showFormVerified(); // ✅ Đúng
                }
                else {
                    alert("Error: Invalid OTP!")
                }
            },
            error: function (xhr) {
               // alert("Error: " + xhr.responseText);  // Hiển thị thông báo lỗi nếu có
            }
        });
    }
    toggleVisibility = (selectors, action) => {
        $(selectors)[action]('d-none');
    };
    showFormSendCode(isResultSendcode) {
        this.toggleVisibility("#btnSendCode", "addClass");
        this.toggleVisibility("#btnVerifyCode,#lblVerifisuccess", "removeClass");
        $('#inputCode').prop('disabled', !isResultSendcode).focus();
        if (!isResultSendcode) {
            $("#lblVerifisuccess")
                .removeClass('alert-success')
                .addClass('alert-danger')
                .text(`OTP sent error. Please enter Resend to receive new OTP!`);
            this.toggleVisibility("#btnReSendCode", "removeClass");
        }
    }
    //Ham hien thi password
    showFormVerified() {
        this.toggleVisibility("#rowpassword,#rowconfirmpassword", "removeClass");
        this.toggleVisibility("#rowVerification", "addClass");
        $('#inputEmail').prop('disabled', true);
        $("#btnSignup").prop('disabled', false);
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
                countdownDisplay.text(`This OTP is valid for ${this.otpTimeout} seconds. Please enter the verification code send to your email!`);
                this.otpTimeout--; // Giảm thời gian mỗi giây
            }
        }, 1000); // Cập nhật mỗi giây
    }

}

// Khởi tạo class khi tài liệu sẵn sàng
$(document).ready(() => {
    new Signup();
});