"use strict";

var connection = new signalR.HubConnectionBuilder().withUrl("/chatHub").build();
// Vô hiệu hóa nút gửi khi chưa kết nối
document.getElementById("sendButton").disabled = true;
function createMessageElement(messageObj, isCurrentUser, isFileMessage = false) {
    let messageDiv = document.createElement("div");
    messageDiv.classList.add("d-flex", "mb-4", isCurrentUser && "user");

    let selectedUserId = document.getElementById("selectedUser").value; // Người đang chat
    let currentUserId = document.getElementById("currentUser").value;  // User hiện tại

    let isMessageForCurrentChat =
        (messageObj.senderId === currentUserId && messageObj.receiverId === selectedUserId) ||
        (messageObj.receiverId === currentUserId && messageObj.senderId === selectedUserId);

    if (!isMessageForCurrentChat) {
        console.warn("🚨 Tin nhắn không phải dành cho cuộc trò chuyện này, bỏ qua.");
        return null;
    }
    // Kiểm tra xem có file trong tin nhắn hay không
    isFileMessage = messageObj.filePath ? true : isFileMessage;
    let avatar = isCurrentUser
        ? ``
        : `<img class="avatar-sm rounded-circle me-3" src="/content/images/avatar/${messageObj.senderImage}" alt="User Avatar">`;

    let messageContent = isFileMessage
        ? `📎 <a href="/uploads/${messageObj.filePath}" target="_blank">Tải file</a>`
        : messageObj.content;

    messageDiv.innerHTML = `
        ${isCurrentUser ? avatar : ""}
        <div class="message flex-grow-1">
            <div class="d-flex">
                <p class="mb-1 text-title text-16 flex-grow-1">${messageObj.senderName}</p>
                <span class="text-small text-muted">${messageObj.timestamp}</span>
            </div>
            <p class="m-0">${messageContent}</p>
        </div>
        ${isCurrentUser ? "" : avatar}
    `;

    return messageDiv;
}

// Lắng nghe tin nhắn mới
connection.on("ReceiveMessage", function (messageObj) {
    let currentUser = document.getElementById("currentUser").value;
    let chatContent = document.querySelector(".chat-content");

    let messageElement = createMessageElement(messageObj, messageObj.senderId === currentUser, false);
    chatContent.appendChild(messageElement);

    // Cuộn xuống cuối
    chatContent.scrollTop = chatContent.scrollHeight;
});

// Lắng nghe danh sách người dùng
connection.on("UpdateUserList", function (allUsers, onlineUsers) {
    let contactList = document.querySelector(".contacts-scrollable");
    contactList.innerHTML = ""; // Xóa danh sách cũ

    let currentUser = document.getElementById("currentUser").value;

    allUsers.forEach(function (user) {
        if (user.userId !== currentUser) {
            let isOnline = onlineUsers.includes(user.userId);
            let avatarPath = user.imagePath && user.imagePath.trim() !== ""
                ? `/content/images/avatar/${user.imagePath}`
                : "/content/images/photo-long-1.jpg";

            let userItem = `
                <div class="p-3 d-flex border-bottom align-items-center contact ${isOnline ? "online" : ""}" 
                    data-userid="${user.userId}" data-username="${user.userName}">
                     <img class="avatar-sm rounded-circle me-3" src="${avatarPath}" alt="${user.userName}">
                     <div>
                      <h6>${user.userName}</h6>
                     </div>
                </div>
            `;
            contactList.innerHTML += userItem;
        }
    });
});

// Đảm bảo rằng bạn chỉ gửi tín hiệu khi SignalR kết nối thành công
connection.on("connected", function () {
    console.log("SignalR đã kết nối thành công!");
    let receiverId = document.getElementById("selectedUser").value;
    let signalType = "offer"; // Ví dụ tín hiệu offer khi bắt đầu cuộc gọi
    let signalData = { senderName: document.getElementById("currentUser").getAttribute("data-username") };
    sendCallSignal(receiverId, signalType, signalData);
});

// Kết nối SignalR
connection.start()
    .then(function () {
        document.getElementById("sendButton").disabled = false;
        console.log("✅ Kết nối SignalR thành công!");
    })
    .catch(function (err) {
        console.error("❌ Lỗi kết nối SignalR: ", err.toString());
    });

// Xử lý gửi tin nhắn
document.getElementById("sendButton").addEventListener("click", sendMessage);
document.getElementById("messageInput").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
    }
});

function sendMessage() {
    let senderId = document.getElementById("currentUser").value;
    let senderName = document.getElementById("currentUser").getAttribute("data-username");
    let senderImage = document.getElementById("currentUserImage").value;

    let receiverId = document.getElementById("selectedUser").value;
    let receiverName = document.getElementById("selectedUser").getAttribute("data-username");
    let receiverImage = document.getElementById("selectedUser").getAttribute("data-imagepath");

    let message = document.getElementById("messageInput").value.trim();

    if (!receiverId) {
        alert("⚠ Vui lòng chọn một người để nhắn tin.");
        return;
    }

    if (message !== "") {
        connection.invoke("SendMessage", senderId, senderName, senderImage, receiverId, receiverName, receiverImage, message)
            .catch(function (err) {
                console.error("❌ Lỗi gửi tin nhắn:", err.toString());
            });
        document.getElementById("messageInput").value = "";
    }
}

// Xử lý sự kiện click trên danh sách người dùng
document.addEventListener("click", function (event) {
    let target = event.target.closest(".contact");
    if (!target) return;
    handleContactClick(target);
});

function handleContactClick(target) {
    let selectedUser = target.getAttribute("data-username");
    let selectedUserId = target.getAttribute("data-userid");
    let selectedUserAvatar = target.querySelector("img").getAttribute("src");
    let chatTopbar = document.querySelector(".chat-topbar .d-flex.align-items-center");
    chatTopbar.innerHTML = `
        <img class="avatar-sm rounded-circle me-2" src="${selectedUserAvatar}" alt="${selectedUser}">
        <p class="m-0 text-title text-16 flex-grow-1">${selectedUser}</p>
    `;
    document.querySelector(".chat-content").innerHTML = "";
    document.getElementById("messageInput").focus();
    document.getElementById("selectedUser").value = selectedUserId;
    document.getElementById("selectedUser").setAttribute("data-username", selectedUser);
    document.getElementById("selectedUser").setAttribute("data-imagePath", selectedUserAvatar);

    // Load tin nhắn cũ khi chọn user
    let currentUser = document.getElementById("currentUser").value;
    connection.invoke("LoadOldMessages", currentUser, selectedUserId)
        .catch(function (err) {
            console.error("❌ Lỗi tải tin nhắn cũ:", err.toString());
        });
}

// Lắng nghe tin nhắn cũ
connection.on("ReceiveOldMessages", function (messages) {
    let chatContent = document.querySelector(".chat-content");
    chatContent.innerHTML = "";

    let currentUser = document.getElementById("currentUser").value;

    messages.forEach(msg => {
        let messageElement = createMessageElement(msg, msg.senderId === currentUser);
        chatContent.appendChild(messageElement);
    });

    //// Cuộn xuống cuối
    chatContent.scrollTop = chatContent.scrollHeight;
    // Cuộn đến tin nhắn cuối cùng
    // chatContent.lastElementChild?.scrollIntoView({ behavior: "smooth" });
});

//FILE
document.getElementById("uploadFileButton").addEventListener("click", function () {
    document.getElementById("fileInput").click();
});

document.getElementById("fileInput").addEventListener("change", function () {
    let file = this.files[0];
    if (file) {
        sendFile(file);
    }
});
function sendFile(file) {
    let senderId = document.getElementById("currentUser").value;
    let senderName = document.getElementById("currentUser").getAttribute("data-username");

    let receiverId = document.getElementById("selectedUser").value;
    let receiverName = document.getElementById("selectedUser").getAttribute("data-username");

    if (!receiverId) {
        alert("⚠ Vui lòng chọn một người để gửi file.");
        return;
    }

    let formData = new FormData();
    formData.append("file", file);
    formData.append("senderId", senderId);
    formData.append("receiverId", receiverId);

    fetch("/Chat/UploadFile", {
        method: "POST",
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log("📎 File đã được tải lên:", data.fileUrl);

                // 📌 Debug: Kiểm tra file gửi qua SignalR
                console.log("🔹 Gửi file qua SignalR: ", senderId, senderName, receiverId, receiverName, data.fileUrl);

                connection.invoke("SendFileMessage", senderId, senderName, receiverId, receiverName, data.fileUrl)
                    .catch(err => console.error("❌ Lỗi gửi file:", err));
            } else {
                alert("❌ Lỗi tải file lên!");
            }
        })
        .catch(err => console.error("❌ Lỗi tải file lên:", err));
}
connection.on("ReceiveFileMessage", function (fileMessage) {
    let chatContent = document.querySelector(".chat-content");
    if (!chatContent) {
        return;
    }
    let currentUser = document.getElementById("currentUser")?.value;
    let selectedUser = document.getElementById("selectedUser")?.value;

    let isCurrentUser = fileMessage.senderId === currentUser;

    let isFileForCurrentChat =
        (fileMessage.senderId === currentUser && fileMessage.receiverId === selectedUser) ||
        (fileMessage.receiverId === currentUser && fileMessage.senderId === selectedUser);

    if (!isFileForCurrentChat) {
        return;
    }
    // Tạo phần tử tin nhắn với tham số isFileMessage là true
    let fileMessageElement = createMessageElement(fileMessage, isCurrentUser, true);

    if (fileMessageElement) {
        chatContent.appendChild(fileMessageElement);
        chatContent.scrollTop = chatContent.scrollHeight;
    }
});

//CALLL
let callAccepted = false;  // Biến kiểm tra xem cuộc gọi đã được chấp nhận hay chưa
// Khi nhấn nút gọi điện
document.querySelector(".startCallButton").addEventListener("click", function () {
    let receiverId = document.getElementById("selectedUser").value;
    sendCallSignal(receiverId, "offer", { senderName: document.getElementById("currentUser").getAttribute("data-username") });
});
document.getElementById("endCallButton").addEventListener("click", function () {
    let currentUser = document.getElementById("currentUser")?.value;
    sendCallSignal(currentUser, "end", null); // Gửi tín hiệu kết thúc cuộc gọi
    closeModal(); // Đóng modal
    resetCallUI(); // Reset lại giao diện
});
function resetCallUI() {
    document.getElementById("incoming-call").style.display = 'none';  // Ẩn giao diện cuộc gọi đến
    document.getElementById("call-interface").style.display = 'none'; // Ẩn giao diện đang gọi
}
// Lắng nghe tín hiệu gọi điện đến
connection.on("ReceiveCallSignal", function (senderId, signalType, signalData) {
    if (callAccepted) return;  // Nếu cuộc gọi đã được chấp nhận, không xử lý tín hiệu mới
    console.log("Tín hiệu cuộc gọi nhận được:", senderId, signalType, signalData);
    if (signalType === "offer") {
        // Hiển thị modal khi có cuộc gọi đến
        $('#callModal').modal('show');
        handleIncomingCall(senderId, signalData);
    } else if (signalType === "answer") {
        handleCallAnswer(senderId, signalData);
    } else if (signalType === "end") {
        endCall(senderId);
    }
});

// Hàm gửi tín hiệu cuộc gọi (offer, answer, end)
function sendCallSignal(receiverId, signalType, signalData) {
    let senderId = document.getElementById("currentUser").value;
    console.log("Gửi tín hiệu cuộc gọi:", senderId, receiverId, signalType, signalData);

    connection.invoke("SendCallSignal", senderId, receiverId, signalType, signalData)
        .then(() => {
            console.log("✅ Tín hiệu cuộc gọi đã được gửi thành công.");
        })
        .catch(function (err) {
            console.error("❌ Lỗi gửi tín hiệu cuộc gọi:", err.toString());
        });
}

// Xử lý cuộc gọi đến (Offer)
function handleIncomingCall(senderId, offerData) {
    let callerName = offerData.senderName ?? document.getElementById("selectedUser").getAttribute("data-username");
    document.getElementById("callerName").textContent = `${callerName} đang gọi cho bạn.`;

    // Tạo lại nút để tránh sự kiện click bị gán nhiều lần
    let acceptButton = document.getElementById("acceptCallButton");
    let newAcceptButton = acceptButton.cloneNode(true);
    acceptButton.replaceWith(newAcceptButton);

    let rejectButton = document.getElementById("rejectCallButton");
    let newRejectButton = rejectButton.cloneNode(true);
    rejectButton.replaceWith(newRejectButton);

    // Gán sự kiện mới
    newAcceptButton.addEventListener("click", function () {
        if (!callAccepted) {  // Kiểm tra nếu chưa chấp nhận cuộc gọi
            sendCallSignal(senderId, "answer", { receiverId: document.getElementById("currentUser").value });
            startCall(senderId);

            // Đánh dấu cuộc gọi đã được chấp nhận
            callAccepted = true;

            // Chuyển modal sang chế độ cuộc gọi
            document.getElementById("incoming-call").style.display = 'none';
            document.getElementById("call-interface").style.display = 'block';
          /*  $('#callModal').modal('hide');  // Ẩn modal sau khi chấp nhận cuộc gọi*/
        }
    });

    newRejectButton.addEventListener("click", function () {
        sendCallSignal(senderId, "end", null);
        closeModal(); // Chỉ đóng modal khi từ chối cuộc gọi
    });

    // Hiển thị phần giao diện cuộc gọi đến
    document.getElementById("incoming-call").style.display = 'block';
    document.getElementById("call-interface").style.display = 'none';
}

// Xử lý trả lời cuộc gọi (Answer)
function handleCallAnswer(senderId, answerData) {
    startCall(senderId);
}

// Bắt đầu cuộc gọi (Khởi tạo WebRTC hoặc giao diện gọi)
let peerConnection = null;  // Đảm bảo khai báo ở phạm vi toàn cục
function startCall(senderId) {
    console.log("Bắt đầu cuộc gọi với ID:", senderId);
    // Giao diện cuộc gọi đã được mở, bắt đầu WebRTC và giao diện video
    console.log("Bắt đầu cuộc gọi với ID:", senderId);

    document.getElementById("call-interface").style.display = 'block';  // Hiển thị giao diện cuộc gọi
    document.getElementById("incoming-call").style.display = 'none';    // Ẩn giao diện cuộc gọi đến
    // Thực hiện khởi tạo WebRTC (cấu hình ICE servers)
    const configuration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
        ]
    };
    peerConnection = new RTCPeerConnection(configuration);
    // Thiết lập các sự kiện của WebRTC (ontrack, onicecandidate...)
    peerConnection.onicecandidate = function (event) {
        if (event.candidate) {
            sendSignal('candidate', event.candidate);
        }
    };

    peerConnection.ontrack = function (event) {
        // Khi có video/audio track từ peer, hiển thị nó lên giao diện
        let remoteStream = event.streams[0];
        document.getElementById("remoteVideo").srcObject = remoteStream;
    };

    // Giao diện cuộc gọi (hiển thị cửa sổ cuộc gọi)
    document.getElementById('call-interface').style.display = 'block';
    document.getElementById('incoming-call').style.display = 'none'; // Ẩn thông báo cuộc gọi đến

    //Truyền video/audio stream của người gọi vào peerConnection
    navigator.mediaDevices.getUserMedia({ video: false, audio: true })
        .then(function (stream) {
            // Gửi stream của người gọi vào peerConnection
            stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

            // Hiển thị stream của người gọi lên giao diện
            document.getElementById("localVideo").srcObject = stream;

            // Tạo offer và gửi
            peerConnection.createOffer()
                .then(offer => peerConnection.setLocalDescription(offer))
                .then(() => {
                    sendSignal('offer', peerConnection.localDescription);
                })
                .catch(error => console.error("❌ Lỗi tạo offer:", error));
        })
        .catch(function (error) {
            console.error("❌ Lỗi truy cập camera/microphone:", error);
        });
}

// Kết thúc cuộc gọi
function endCall(callerId) {
    console.log("Cuộc gọi kết thúc với ID:", callerId);

    // 🛑 Dừng tất cả tracks trong local video
    let localVideo = document.getElementById("localVideo");
    if (localVideo.srcObject) {
        localVideo.srcObject.getTracks().forEach(track => track.stop());
        localVideo.srcObject = null;
    }

    // 🛑 Dừng tất cả tracks trong remote video
    let remoteVideo = document.getElementById("remoteVideo");
    if (remoteVideo.srcObject) {
        remoteVideo.srcObject.getTracks().forEach(track => track.stop());
        remoteVideo.srcObject = null;
    }

    // 🛑 Xóa ICE Candidates (chỉ thực hiện nếu connection còn tồn tại)
    if (peerConnection) {
        peerConnection.onicecandidate = null;
        peerConnection.ontrack = null;
        peerConnection.oniceconnectionstatechange = null;
        peerConnection.ondatachannel = null;

        // Đóng và giải phóng connection
        peerConnection.close();
        peerConnection = null;
    }

    // Reset trạng thái cuộc gọi
    callAccepted = false;

    // Reset giao diện video
    resetCallUI();

    // Đóng modal
    closeModal();
}

// Gửi tín hiệu WebRTC (candidate, answer...) qua SignalR
function sendSignal(type, data) {
    let senderId = document.getElementById("currentUser").value;
    let receiverId = document.getElementById("selectedUser").value;

    connection.invoke("SendCallSignal", senderId, receiverId, type, data)
        .then(() => {
            console.log("✅ Tín hiệu WebRTC đã được gửi thành công.");
        })
        .catch(function (err) {
            console.error("❌ Lỗi gửi tín hiệu WebRTC:", err.toString());
        });
}
// Hàm đóng modal
// Gửi candidate qua SignalR
function sendCandidate(candidate) {
    sendSignal('candidate', candidate);
}
// Xử lý candidate nhận được
connection.on("ReceiveIceCandidate", function (candidate) {
    if (peerConnection) {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
});
function closeModal() {
    $('#callModal').modal('hide');  // Sử dụng Bootstrap modal để ẩn modal
}