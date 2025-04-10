//ES6 Class
class Signup {
    constructor() {
        this.otpTimer = null;
        this.otpTimeout = 60; // 1 minute countdown (in seconds)
        this.initEvents();
    }

    initEvents() {
        const radioSendCode = "input[name='radioSendCode']";
        const btnSignup = "#btnSignup";
        const btnSendCode = "#btnSendCode";
        const btnReSendCode = "#btnReSendCode";
        const btnVerifyCode = "#btnVerifyCode";

        $(radioSendCode).change(() => this.toggleInputFields());
        $(btnSignup).click((e) => this.handleSignup(e));
        $(btnSendCode).click(() => this.sendVerificationCode());
        $(btnReSendCode).click(() => this.sendVerificationCode());
        $(btnVerifyCode).click(() => this.verifyOtp());
    }

    toggleInputFields() {
        $("#rowEmail, #rowMobile").toggleClass('d-none');
    }

    handleSignup(e) {
        e.preventDefault();
        const password = $("#inputPassword").val().trim();
        const confirmPassword = $("#inputConfirmPassword").val().trim();
        const isEmail = $("input[name='radioSendCode']:checked").val() === '1';

        if (!password || !confirmPassword) {
            alert("Password fields cannot be empty!");
            return;
        }

        if (password !== confirmPassword) {
            $("#formSignup")[0].classList.add("was-validated");
            $("#inputConfirmPassword")[0].setCustomValidity("err!");
            return;
        } else {
            $("#inputConfirmPassword")[0].setCustomValidity("");
        }

        const requestData = isEmail
            ? { Email: $("#inputEmail").val().trim(), isEmail: true, Password: password }
            : { Mobile: $("#inputMobile").val().trim(), isEmail: false, Password: password };

        $.ajax({
            url: "/login/Signup",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(requestData),
            success: (response) => {
                if (response.isResult) {
                    window.location.href = "/home/index";
                }
            },
            error: (response) => {
                console.error("Signup error:", response);
            }
        });
    }

    sendVerificationCode() {
        const form = document.getElementById("formSignup");
        const isEmail = $("input[name='radioSendCode']:checked").val() === '1';
        const contactInfo = isEmail ? $("#inputEmail").val().trim() : $("#inputMobile").val().trim();
        const isValid = isEmail ? $("#inputEmail")[0].checkValidity() : $("#inputMobile")[0].checkValidity();

        if (!contactInfo || !isValid) {
            form.classList.add("was-validated");
            return;
        }

        $('#btnReSendCode').hasClass('d-none') || $('#btnReSendCode').addClass('d-none');

        const requestData = isEmail
            ? { email: contactInfo, mobile: "" }
            : { email: "", mobile: contactInfo };

        $.ajax({
            url: "/api/login/send-code",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(requestData),
            success: (response) => {
                if (response.isResult) {
                    this.otpTimeout = 60;
                    this.startOtpCountdown();
                }
                if (response.isExist) {
                    $ksdialog.showConfirm(emailExistsMessage, signupErrorMessage, this.redirectToActionLogin);
                } else {
                    this.showFormSendCode(response.isResult);
                }
            },
            error: (response) => {
                console.error("Send code error:", response);
                this.showFormSendCode(false);
            }
        });
    }

    redirectToActionLogin(confirm) {
        if (confirm) {
            window.location.href = "/Login/Index";
        }
    }

    verifyOtp() {
        const isEmail = $("input[name='radioSendCode']:checked").val() === '1';
        const contactInfo = isEmail ? $("#inputEmail").val().trim() : $("#inputMobile").val().trim();
        const otp = $("#inputCode").val().trim();

        if (!otp) {
            alert("Please enter the OTP!");
            return;
        }

        const requestData = isEmail
            ? { email: contactInfo, otp: otp }
            : { mobile: contactInfo, otp: otp };

        $.ajax({
            url: "/api/login/verify-code",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(requestData),
            success: (response) => {
                if (response.isResult) {
                    this.showFormVerified();
                } else {
                    alert("Error: Invalid OTP!");
                }
            },
            error: (xhr) => {
                console.error("Verify OTP error:", xhr);
            }
        });
    }

    toggleVisibility(selectors, action) {
        $(selectors)[action]('d-none');
    }

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

    showFormVerified() {
        this.toggleVisibility("#rowpassword,#rowconfirmpassword", "removeClass");
        this.toggleVisibility("#rowVerification", "addClass");
        $('#inputEmail').prop('disabled', true);
        $("#btnSignup").prop('disabled', false);
        $('#rowpassword').focus();
    }

    showError(inputId, message) {
        $(inputId).addClass('is-invalid');
        $(inputId).next('.invalid-feedback').remove();
        $(inputId).after(`<div class="invalid-feedback">${message}</div>`);
    }

    startOtpCountdown() {
        const countdownDisplay = $("#lblVerifisuccess");
        const countdownInterval = setInterval(() => {
            if (this.otpTimeout <= 0) {
                clearInterval(countdownInterval);
                $("#btnReSendCode").removeClass("d-none");
                countdownDisplay.text("OTP expired, please resend the code.");
            } else {
                countdownDisplay.text(`This OTP is valid for ${this.otpTimeout} seconds. Please enter the verification code sent to your email!`);
                this.otpTimeout--;
            }
        }, 1000);
    }
}

// Khởi tạo class khi tài liệu sẵn sàng
$(document).ready(() => {
    new Signup();
});