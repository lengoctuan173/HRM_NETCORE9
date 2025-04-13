"use strict";

var connection = new signalR.HubConnectionBuilder().withUrl("/chatHub").build();
// Vô hiệu hóa nút gửi khi chưa kết nối
document.getElementById("sendButton").disabled = true;

// Định nghĩa CallState
const CallState = {
    IDLE: 'idle',
    CALLING: 'calling',
    IN_CALL: 'in_call',
    ENDING: 'ending'
};

let currentCallState = CallState.IDLE;

// Thêm biến để theo dõi người gọi
let currentCallerId = null;

// Group chat related variables
let selectedGroupId = null;
let currentChatType = 'direct'; // 'direct' or 'group'

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
    //let avatar = isCurrentUser
    //    ? ``
    //    : `<img class="avatar-sm rounded-circle me-3" src="/content/images/avatar/${messageObj.senderImage}" alt="User Avatar">`;
    let avatar = `<img class="avatar-sm rounded-circle me-3" src="${messageObj.senderImage?.startsWith("http") ? messageObj.senderImage : `/content/images/avatar/${messageObj.senderImage}`}" alt="User Avatar">`;

    let messageContent = isFileMessage
        ? `📎 <a href="/uploads/${messageObj.filePath}" target="_blank">Tải file</a>`
        : messageObj.content;
    // Tạo HTML cho tin nhắn
    if (isCurrentUser) {
        messageDiv.innerHTML = `
            <div class="message flex-grow-1">
                <div class="d-flex">
                    <p class="mb-1 text-title text-16 flex-grow-1">${messageObj.senderName}</p>
                    <span class="text-small text-muted">${messageObj.timestamp}</span>
                 </div>
                <p class="m-0">${messageContent}</p>
             </div>
            ${avatar}
        `;
    } else {
        messageDiv.innerHTML = `
            ${avatar}
            <div class="message flex-grow-1">
                <div class="d-flex">
                    <p class="mb-1 text-title text-16 flex-grow-1">${messageObj.senderName}</p>
                    <span class="text-small text-muted">${messageObj.timestamp}</span>
                 </div>
                <p class="m-0">${messageContent}</p>
             </div>
        `;
    }
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
                ? (user.imagePath.startsWith("http") ? user.imagePath : `/content/images/avatar/${user.imagePath}`)
                : "/content/images/photo-long-1.jpg";

            let userItem = document.createElement("div");
            userItem.className = `contact ${isOnline ? "online" : ""}`;
            userItem.setAttribute("data-userid", user.userId);
            userItem.setAttribute("data-username", user.userName);
            
            userItem.innerHTML = `
                <img class="avatar-sm rounded-circle" src="${avatarPath}" alt="${user.userName}">
                <div class="contact-info">
                    <h6 class="mb-0">${user.userName}</h6>
                    <small class="text-muted">${isOnline ? 'Online' : 'Offline'}</small>
                </div>
                <span class="status-dot ${isOnline ? 'online' : 'offline'}"></span>
            `;
            
            contactList.appendChild(userItem);
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
    let message = document.getElementById("messageInput").value.trim();
    if (message === "") return;

    let chatType = document.getElementById("chatType").value;
    console.log("Loại chat hiện tại:", chatType);
    
    if (chatType === 'direct') {
        let senderId = document.getElementById("currentUser").value;
        let senderName = document.getElementById("currentUser").getAttribute("data-username");
        let senderImage = document.getElementById("currentUserImage").value;
        let receiverId = document.getElementById("selectedUser").value;
        let receiverName = document.getElementById("selectedUser").getAttribute("data-username");
        let receiverImage = document.getElementById("selectedUser").getAttribute("data-imagepath");

        if (!receiverId) {
            alert("⚠ Vui lòng chọn một người để nhắn tin.");
            return;
        }

        connection.invoke("SendMessage", senderId, senderName, senderImage, receiverId, receiverName, receiverImage, message)
            .catch(function (err) {
                console.error("❌ Lỗi gửi tin nhắn:", err.toString());
            });
    } else if (chatType === 'group') {
        let selectedGroupId = document.getElementById("selectedGroup").value;
        console.log("Đang gửi tin nhắn đến nhóm:", selectedGroupId);
        
        if (!selectedGroupId) {
            alert("⚠ Vui lòng chọn một nhóm để nhắn tin.");
            return;
        }

        connection.invoke("SendGroupMessage", selectedGroupId, message)
            .then(() => {
                console.log("✅ Đã gửi tin nhắn nhóm thành công");
            })
            .catch(function (err) {
                console.error("❌ Lỗi gửi tin nhắn nhóm:", err.toString());
                alert("Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại.");
            });
    }

    document.getElementById("messageInput").value = "";
}

// Xử lý sự kiện click trên danh sách người dùng
document.addEventListener("click", function (event) {
    const contactTarget = event.target.closest(".contact");
    if (contactTarget) {
        document.querySelectorAll(".contact").forEach(contact => {
            contact.classList.remove("active");
        });
        contactTarget.classList.add("active");

        if (contactTarget.classList.contains("group")) {
            handleGroupClick(contactTarget);
        } else {
            handleContactClick(contactTarget);
        }
    }

    // Handle call button click
    const callButton = event.target.closest(".startCallButton");
    if (callButton) {
        const currentUser = document.getElementById("currentUser").value;
        const receiverId = document.getElementById("selectedUser").value;
        
        if (!receiverId) {
            alert("⚠ Vui lòng chọn một người để gọi.");
            return;
        }

        try {
            startCall(receiverId);
        } catch (error) {
            console.error("Lỗi khi bắt đầu cuộc gọi:", error);
            handleCallError(error, 'startCall');
        }
    }
});

function handleContactClick(target) {
    currentChatType = 'direct';
    document.getElementById("chatType").value = 'direct';
    selectedGroupId = null;
    document.getElementById("selectedGroup").value = "";
    
    let selectedUser = target.getAttribute("data-username");
    let selectedUserId = target.getAttribute("data-userid");
    let selectedUserAvatar = target.querySelector("img").getAttribute("src");
    
    // Update selected user info
    document.getElementById("selectedUser").value = selectedUserId;
    document.getElementById("selectedUser").setAttribute("data-username", selectedUser);
    document.getElementById("selectedUser").setAttribute("data-imagePath", selectedUserAvatar);

    // Update chat topbar
    const selectedUserInfo = document.querySelector(".selected-user-info");
    if (selectedUserInfo) {
        selectedUserInfo.querySelector(".selected-user-name").textContent = selectedUser;
        selectedUserInfo.querySelector(".user-status").textContent = "Online";
    }

    // Update avatar
    const selectedUserAvatarImg = document.getElementById("selectedUserAvatar");
    if (selectedUserAvatarImg) {
        selectedUserAvatarImg.src = selectedUserAvatar;
        selectedUserAvatarImg.classList.remove("d-none");
    }

    // Show call button, hide group info button
    document.querySelector(".startCallButton").style.display = "flex";
    document.querySelector(".groupInfoButton").style.display = "none";

    // Clear and focus message input
    document.getElementById("messageInput").focus();
    document.querySelector(".chat-content").innerHTML = "";

    // Load old messages
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
    let formData = new FormData();
    formData.append("file", file);

    if (currentChatType === 'direct') {
        let senderId = document.getElementById("currentUser").value;
        let receiverId = document.getElementById("selectedUser").value;

        if (!receiverId) {
            alert("Please select a contact to send the file to.");
            return;
        }

        formData.append("senderId", senderId);
        formData.append("receiverId", receiverId);
    } else if (currentChatType === 'group') {
        if (!selectedGroupId) {
            alert("Please select a group to send the file to.");
            return;
        }

        formData.append("groupId", selectedGroupId);
    }

    fetch("/Chat/UploadFile", {
        method: "POST",
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log("File uploaded:", data.fileUrl);

                if (currentChatType === 'direct') {
                    let senderId = document.getElementById("currentUser").value;
                    let senderName = document.getElementById("currentUser").getAttribute("data-username");
                    let receiverId = document.getElementById("selectedUser").value;
                    let receiverName = document.getElementById("selectedUser").getAttribute("data-username");

                    connection.invoke("SendFileMessage", senderId, senderName, receiverId, receiverName, data.fileUrl)
                        .catch(err => console.error("Error sending file message:", err));
                } else if (currentChatType === 'group') {
                    connection.invoke("SendGroupFileMessage", selectedGroupId, data.fileUrl)
                        .catch(err => console.error("Error sending group file message:", err));
                }
            } else {
                alert("Error uploading file!");
            }
        })
        .catch(err => console.error("Error uploading file:", err));
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
document.addEventListener("click", async function (event) {
    if (event.target.matches(".startCallButton")) {
        const currentUser = document.getElementById("currentUser").value;
        const receiverId = document.getElementById("selectedUser").value;
        
        try {
            // Khởi tạo peer connection cho người gọi
            await initializePeerConnection(receiverId);
            
            // Tạo offer
            const offer = await peerConnection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });
            
            // Set local description
            await peerConnection.setLocalDescription(offer);
            
            // Đặt người gọi là user hiện tại
            currentCallerId = currentUser;
            
            console.log("Bắt đầu cuộc gọi từ:", currentUser, "đến:", receiverId);
            
            // Gửi offer đến người nhận
            sendCallSignal(receiverId, "offer", {
                type: 'offer',
                sdp: offer.sdp,
                senderName: document.getElementById("currentUser").getAttribute("data-username")
            });

            // Cập nhật UI
            updateCallState(CallState.CALLING);
            document.getElementById("call-interface").style.display = 'block';
            
        } catch (error) {
            console.error("Lỗi khi bắt đầu cuộc gọi:", error);
            handleCallError(error, 'startCall');
        }
    }
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
// Thêm các biến quản lý state
let incomingCallTimeout = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;
const CALL_TIMEOUT = 30000; // 30 giây

// Thêm biến quản lý thời gian cuộc gọi
let callTimer = null;
let callDuration = 0;

// Hàm cập nhật thời gian cuộc gọi
function updateCallTimer() {
    const timerElement = document.getElementById('callTimer');
    if (!timerElement) return;

    callDuration++;
    const minutes = Math.floor(callDuration / 60);
    const seconds = callDuration % 60;
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Hàm bắt đầu đếm thời gian cuộc gọi
function startCallTimer() {
    const timerElement = document.getElementById('callTimer');
    if (timerElement) {
        timerElement.style.display = 'inline';
        callDuration = 0;
        callTimer = setInterval(updateCallTimer, 1000);
    }
}

// Hàm dừng đếm thời gian
function stopCallTimer() {
    if (callTimer) {
        clearInterval(callTimer);
        callTimer = null;
    }
    const timerElement = document.getElementById('callTimer');
    if (timerElement) {
        timerElement.style.display = 'none';
        timerElement.textContent = '00:00';
    }
    callDuration = 0;
}

// Hàm cập nhật đếm ngược cho cuộc gọi đến
function updateIncomingCallTimeout() {
    const timeoutCounter = document.getElementById('timeoutCounter');
    if (!timeoutCounter) return;

    let timeLeft = parseInt(timeoutCounter.textContent);
    if (timeLeft > 0) {
        timeoutCounter.textContent = (timeLeft - 1).toString();
    }
}

// Xử lý bật/tắt micro
let isMicMuted = false;
document.getElementById('toggleMicButton').addEventListener('click', function() {
    const micButton = this;
    const micIcon = micButton.querySelector('i');
    const localStream = document.getElementById('localVideo').srcObject;

    if (localStream) {
        const audioTracks = localStream.getAudioTracks();
        if (audioTracks.length > 0) {
            isMicMuted = !isMicMuted;
            audioTracks[0].enabled = !isMicMuted;
            
            // Cập nhật UI
            micIcon.className = isMicMuted ? 'fas fa-microphone-slash' : 'fas fa-microphone';
            micButton.classList.toggle('btn-danger', isMicMuted);
            micButton.classList.toggle('btn-outline-secondary', !isMicMuted);
        }
    }
});

// Xử lý bật/tắt loa
let isSpeakerMuted = false;
document.getElementById('toggleSpeakerButton').addEventListener('click', function() {
    const speakerButton = this;
    const speakerIcon = speakerButton.querySelector('i');
    const remoteVideo = document.getElementById('remoteVideo');

    isSpeakerMuted = !isSpeakerMuted;
    remoteVideo.muted = isSpeakerMuted;
    
    // Cập nhật UI
    speakerIcon.className = isSpeakerMuted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
    speakerButton.classList.toggle('btn-danger', isSpeakerMuted);
    speakerButton.classList.toggle('btn-outline-secondary', !isSpeakerMuted);
});

// Cập nhật hàm updateCallUI để xử lý UI mới
function updateCallUI(state) {
    const callError = document.getElementById('callError');
    const connectionStatus = document.getElementById('connectionStatus');
    const callInterface = document.getElementById('call-interface');
    const incomingCall = document.getElementById('incoming-call');
    const statusMessage = document.getElementById('statusMessage');

    switch(state) {
        case CallState.IDLE:
            callInterface.style.display = 'none';
            incomingCall.style.display = 'none';
            connectionStatus.style.display = 'none';
            stopCallTimer();
            break;

        case CallState.CALLING:
            callInterface.style.display = 'block';
            connectionStatus.style.display = 'block';
            statusMessage.textContent = 'Đang kết nối cuộc gọi...';
            break;

        case CallState.IN_CALL:
            callInterface.style.display = 'block';
            incomingCall.style.display = 'none';
            connectionStatus.style.display = 'none';
            startCallTimer();
            break;

        case CallState.ENDING:
            connectionStatus.style.display = 'block';
            statusMessage.textContent = 'Đang kết thúc cuộc gọi...';
            break;
    }
}

// Cập nhật hàm handleCallError để sử dụng alert mới
function handleCallError(error, context) {
    console.error(`Lỗi trong ${context}:`, error);
    
    const errorDiv = document.getElementById('callError');
    const errorMessage = document.getElementById('errorMessage');
    
    let message = 'Đã xảy ra lỗi trong cuộc gọi';
    switch(error.name) {
        case 'NotAllowedError':
            message = 'Vui lòng cho phép truy cập microphone/camera trong trình duyệt của bạn';
            break;
        case 'NotFoundError':
            message = 'Không tìm thấy thiết bị media (microphone/camera). Vui lòng kiểm tra kết nối thiết bị của bạn';
            break;
        case 'NotReadableError':
            message = 'Thiết bị media đang được sử dụng bởi ứng dụng khác';
            break;
        case 'ConnectionError':
            message = 'Lỗi kết nối mạng';
            break;
        default:
            message = `Lỗi: ${error.message || 'Không xác định'}`;
    }
    
    errorMessage.textContent = message;
    errorDiv.style.display = 'block';
    
    // Tự động ẩn thông báo lỗi sau 5 giây
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
    
    endCall();
}

// Thêm hàm để xử lý audio level indicator
function setupAudioLevelIndicator(stream, elementId) {
    if (!stream) return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);
    
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const indicator = document.querySelector(`#${elementId} .audio-indicator`);
    if (!indicator) return;

    function updateAudioLevel() {
        analyser.getByteFrequencyData(dataArray);
        let values = 0;
        const length = dataArray.length;
        for (let i = 0; i < length; i++) {
            values += dataArray[i];
        }
        const average = values / length;
        
        // Cập nhật màu sắc dựa trên mức độ âm thanh
        if (average > 50) {
            indicator.style.backgroundColor = '#4CAF50'; // Xanh lá khi có tiếng nói
        } else if (average > 20) {
            indicator.style.backgroundColor = '#FFC107'; // Vàng khi có âm thanh nhỏ
        } else {
            indicator.style.backgroundColor = '#757575'; // Xám khi im lặng
        }
        
        requestAnimationFrame(updateAudioLevel);
    }
    
    updateAudioLevel();
}

// Cập nhật hàm initializePeerConnection
async function initializePeerConnection(senderId) {
    console.log("Khởi tạo peer connection với:", senderId);
    
    // Đóng kết nối cũ nếu có
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }

    const configuration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
        ]
    };

    peerConnection = new RTCPeerConnection(configuration);

    // Xử lý ICE candidate
    peerConnection.onicecandidate = function (event) {
        if (event.candidate) {
            console.log("Gửi ICE candidate đến:", senderId);
            sendCallSignal(senderId, "candidate", event.candidate);
        }
    };

    // Xử lý kết nối ICE state
    peerConnection.oniceconnectionstatechange = function() {
        console.log("ICE connection state:", peerConnection.iceConnectionState);
        switch (peerConnection.iceConnectionState) {
            case 'connected':
                // Khi kết nối thành công, hiển thị giao diện cuộc gọi cho cả hai bên
                $('#callModal').modal('show');
                document.getElementById("incoming-call").style.display = 'none';
                document.getElementById("call-interface").style.display = 'block';
                document.getElementById("connectionStatus").style.display = 'none';
                updateCallState(CallState.IN_CALL);
                startCallTimer();
                break;
            case 'disconnected':
                console.log('Kết nối ICE bị ngắt');
                endCall();
                break;
            case 'failed':
                console.log('Kết nối ICE thất bại');
                handleCallError(new Error('Kết nối cuộc gọi thất bại'), 'iceConnection');
                endCall();
                break;
        }
    };

    peerConnection.ontrack = function (event) {
        console.log("Nhận track từ peer");
        let remoteStream = event.streams[0];
        document.getElementById("remoteVideo").srcObject = remoteStream;
        
        // Thiết lập audio indicator cho remote video
        setupAudioLevelIndicator(remoteStream, "remoteVideo");
    };

    try {
        // Thử lấy cả audio và video
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true
            });
            stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
            document.getElementById("localVideo").srcObject = stream;
            
            // Thiết lập audio indicator cho local video
            setupAudioLevelIndicator(stream, "localVideo");
        } catch (videoError) {
            console.log("Không thể lấy video, thử chỉ lấy audio:", videoError);
            const audioStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false
            });
            audioStream.getTracks().forEach(track => peerConnection.addTrack(track, audioStream));
            const localVideo = document.getElementById("localVideo");
            localVideo.srcObject = audioStream;
            localVideo.style.backgroundColor = "#333";
            localVideo.style.display = "flex";
            localVideo.style.alignItems = "center";
            localVideo.style.justifyContent = "center";
            
            // Thiết lập audio indicator cho local video (audio only)
            setupAudioLevelIndicator(audioStream, "localVideo");
            
            // Thêm icon microphone
            const micIcon = document.createElement("i");
            micIcon.className = "fas fa-microphone fa-3x text-white";
            localVideo.appendChild(micIcon);
        }
    } catch (error) {
        console.error("Không thể truy cập thiết bị media:", error);
        showNotification('Không thể truy cập micro hoặc camera. Vui lòng kiểm tra quyền truy cập thiết bị.', 'warning');
        throw error;
    }

    return peerConnection;
}

// Thêm CSS cho audio indicator
const style = document.createElement('style');
style.textContent = `
    .audio-indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background-color: #757575;
        transition: background-color 0.2s ease;
    }
    
    .audio-indicator.active {
        background-color: #4CAF50;
    }
`;
document.head.appendChild(style);

// Thêm hàm kiểm tra SDP
function isValidSDP(sdp) {
    if (!sdp || typeof sdp !== 'string') {
        console.error("SDP không hợp lệ:", sdp);
        return false;
    }
    return sdp.includes('v=0');
}

// Cập nhật hàm startCall
async function startCall(senderId) {
    console.log("Bắt đầu cuộc gọi với ID:", senderId);
    updateCallState(CallState.CALLING);

    try {
        await initializePeerConnection(senderId);

        // Tạo và gửi offer nếu là người gọi
        if (currentCallerId === document.getElementById("currentUser").value) {
            console.log("Tạo và gửi offer");
            const offer = await peerConnection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });
            
            console.log("Offer created:", offer);
            await peerConnection.setLocalDescription(offer);
            
            // Đợi cho đến khi local description được set
            await new Promise((resolve) => setTimeout(resolve, 100));
            
            const offerData = {
                type: offer.type,
                sdp: peerConnection.localDescription.sdp,
                senderName: document.getElementById("currentUser").getAttribute("data-username")
            };
            
            console.log("Sending offer data:", offerData);
            sendCallSignal(senderId, "offer", offerData);
        }

        // Hiển thị modal và giao diện chờ kết nối cho người gọi
        $('#callModal').modal('show');
        document.getElementById("call-interface").style.display = 'block';
        document.getElementById("connectionStatus").style.display = 'block';
        document.getElementById("statusMessage").textContent = 'Đang kết nối cuộc gọi...';
        document.getElementById("incoming-call").style.display = 'none';
    } catch (error) {
        console.error("Lỗi trong startCall:", error);
        handleCallError(error, 'startCall');
    }
}

function updateCallState(newState) {
    console.log(`Chuyển trạng thái cuộc gọi: ${currentCallState} -> ${newState}`);
    currentCallState = newState;
    updateCallUI(newState);
}

function cleanupCall() {
    // Dọn dẹp media streams
    if (localVideo.srcObject) {
        localVideo.srcObject.getTracks().forEach(track => {
            track.stop();
        });
        localVideo.srcObject = null;
    }
    
    // Dọn dẹp peer connection
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    
    // Reset state
    updateCallState(CallState.IDLE);
    callAccepted = false;
}

// Thêm hàm hiển thị thông báo
function showNotification(message, type = 'info') {
    const notificationDiv = document.createElement('div');
    notificationDiv.className = `alert alert-${type} notification-alert`;
    notificationDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        padding: 15px;
        border-radius: 4px;
        animation: slideIn 0.5s ease-in-out;
    `;
    
    notificationDiv.innerHTML = `
        <i class="fas ${type === 'info' ? 'fa-info-circle' : 'fa-exclamation-circle'}"></i>
        <span class="ml-2">${message}</span>
    `;
    
    document.body.appendChild(notificationDiv);
    
    // Thêm style animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Tự động ẩn sau 3 giây
    setTimeout(() => {
        notificationDiv.style.animation = 'fadeOut 0.5s ease-in-out';
        setTimeout(() => {
            document.body.removeChild(notificationDiv);
        }, 500);
    }, 3000);
}

// Cập nhật lại hàm xử lý tín hiệu cuộc gọi
connection.on("ReceiveCallSignal", async function (senderId, signalType, signalData) {
    console.log("Tín hiệu cuộc gọi nhận được:", senderId, signalType, signalData);
    console.log("Trạng thái cuộc gọi hiện tại:", currentCallState);
    console.log("Người gọi hiện tại:", currentCallerId);
    
    try {
        switch (signalType) {
            case "offer":
                // Nếu là người đã bắt đầu cuộc gọi, bỏ qua offer
                if (currentCallerId === document.getElementById("currentUser").value) {
                    console.log("Bỏ qua offer vì đây là người gọi");
                    return;
                }
                
                if (currentCallState === CallState.IN_CALL && callAccepted) {
                    console.log("Từ chối cuộc gọi mới vì đang trong cuộc gọi khác");
                    sendCallSignal(senderId, "busy", null);
                } else {
                    console.log("Hiển thị cuộc gọi đến từ:", senderId);
                    currentCallerId = senderId; // Lưu ID người gọi
                    handleIncomingCall(senderId, signalData);
                }
                break;
                
            case "answer":
                console.log("Nhận tín hiệu answer từ:", senderId);
                if (currentCallState === CallState.CALLING || currentCallState === CallState.IDLE) {
                    await handleCallAnswer(senderId, signalData);
                    updateCallState(CallState.IN_CALL);
                    document.getElementById("call-interface").style.display = 'block';
                    startCallTimer();
                }
                break;
                
            case "candidate":
                console.log("Nhận ICE candidate từ:", senderId);
                if (peerConnection && (currentCallState === CallState.CALLING || currentCallState === CallState.IN_CALL)) {
                    try {
                        await peerConnection.addIceCandidate(new RTCIceCandidate(signalData));
                        console.log("Đã thêm ICE candidate");
                    } catch (error) {
                        console.error("Lỗi khi thêm ICE candidate:", error);
                    }
                } else {
                    console.log("Bỏ qua candidate vì không trong cuộc gọi hoặc chưa có peerConnection");
                }
                break;
                
            case "end":
                console.log("Nhận tín hiệu kết thúc từ:", senderId);
                endCall(senderId);
                currentCallerId = null;
                break;
                
            case "busy":
                console.log("Người dùng đang bận");
                showNotification('Người dùng đang trong cuộc gọi khác. Vui lòng thử lại sau.', 'warning');
                endCall();
                break;
                
            case "timeout":
                console.log("Cuộc gọi hết thời gian");
                showNotification('Cuộc gọi đã hết thời gian chờ.', 'warning');
                endCall();
                break;
                
            case "reject":
                console.log("Cuộc gọi bị từ chối");
                showNotification('Cuộc gọi đã bị từ chối.', 'info');
                endCall();
                break;
                
            case "reconnect-offer":
                console.log("Nhận tín hiệu reconnect từ:", senderId);
                handleReconnectOffer(senderId, signalData);
                break;
        }
    } catch (error) {
        console.error("Lỗi xử lý tín hiệu cuộc gọi:", error);
        handleCallError(error, 'receiveCallSignal');
    }
});

// Cập nhật hàm handleIncomingCall
async function handleIncomingCall(senderId, offerData) {
    console.log("Xử lý cuộc gọi đến từ:", senderId, "State hiện tại:", currentCallState);
    console.log("Offer data received:", offerData);

    try {
        // Cập nhật UI cuộc gọi đến
        let callerName = offerData.senderName ?? "Unknown User";
        document.getElementById("callerName").textContent = callerName;
        
        // Hiển thị giao diện cuộc gọi đến
        document.getElementById("incoming-call").style.display = 'block';
        document.getElementById("call-interface").style.display = 'none';
        document.getElementById("acceptCallButton").style.display = 'inline-block';
        document.getElementById("rejectCallButton").style.display = 'inline-block';

        // Hiển thị modal
        $('#callModal').modal('show');

        updateCallState(CallState.CALLING);
        callAccepted = false;

        // Xóa timeout cũ nếu có
        if (incomingCallTimeout) {
            clearTimeout(incomingCallTimeout);
        }

        // Set timeout mới
        incomingCallTimeout = setTimeout(() => {
            if (!callAccepted) {
                console.log("Cuộc gọi hết thời gian chờ");
                sendCallSignal(senderId, "timeout", null);
                closeModal();
                updateCallState(CallState.IDLE);
                currentCallerId = null;
            }
        }, CALL_TIMEOUT);

        // Xóa event listeners cũ
        const acceptButton = document.getElementById("acceptCallButton");
        const rejectButton = document.getElementById("rejectCallButton");
        
        const newAcceptButton = acceptButton.cloneNode(true);
        const newRejectButton = rejectButton.cloneNode(true);
        
        acceptButton.parentNode.replaceChild(newAcceptButton, acceptButton);
        rejectButton.parentNode.replaceChild(newRejectButton, rejectButton);

        // Thêm event listeners mới
        newAcceptButton.addEventListener("click", async function () {
            try {
                console.log("Chấp nhận cuộc gọi từ:", senderId);
                if (!callAccepted) {
                    clearTimeout(incomingCallTimeout);
                    callAccepted = true;

                    // Khởi tạo peer connection khi chấp nhận cuộc gọi
                    await initializePeerConnection(senderId);

                    // Kiểm tra và set remote description từ offer
                    if (offerData && offerData.type === 'offer' && offerData.sdp) {
                        console.log("Setting remote description from offer");
                        await peerConnection.setRemoteDescription(new RTCSessionDescription({
                            type: 'offer',
                            sdp: offerData.sdp
                        }));
                        
                        // Tạo answer
                        console.log("Creating answer");
                        const answer = await peerConnection.createAnswer();
                        
                        // Set local description
                        console.log("Setting local description");
                        await peerConnection.setLocalDescription(answer);
                        
                        // Gửi answer về cho người gọi
                        console.log("Sending answer");
                        await sendCallSignal(senderId, "answer", {
                            type: 'answer',
                            sdp: answer.sdp
                        });
                        
                        // KHÔNG đóng modal ở đây, để đợi ICE connection thành công
                    } else {
                        throw new Error("Invalid offer data received");
                    }
                }
            } catch (error) {
                console.error("Lỗi khi chấp nhận cuộc gọi:", error);
                handleCallError(error, 'acceptCall');
            }
        });

        newRejectButton.addEventListener("click", function () {
            console.log("Từ chối cuộc gọi từ:", senderId);
            clearTimeout(incomingCallTimeout);
            sendCallSignal(senderId, "reject", null);
            closeModal();
            updateCallState(CallState.IDLE);
            currentCallerId = null;
        });

    } catch (error) {
        console.error("Lỗi khi xử lý cuộc gọi đến:", error);
        handleCallError(error, 'handleIncomingCall');
        closeModal();
    }
}

// Cập nhật hàm handleCallAnswer
async function handleCallAnswer(senderId, answerData) {
    try {
        console.log("Xử lý answer từ:", senderId);
        console.log("Answer data received:", answerData);
        
        if (!answerData || !answerData.sdp || !isValidSDP(answerData.sdp)) {
            console.error("Answer không hợp lệ");
            return;
        }

        if (!peerConnection) {
            console.log("Khởi tạo peer connection mới khi nhận answer");
            await initializePeerConnection(senderId);
        }

        const answerDesc = new RTCSessionDescription({
            type: 'answer',
            sdp: answerData.sdp
        });
        
        console.log("Setting remote description (answer):", answerDesc);
        await peerConnection.setRemoteDescription(answerDesc);
        
        // Hiển thị modal cho người gọi
        $('#callModal').modal('show');
        document.getElementById("call-interface").style.display = 'block';
        document.getElementById("connectionStatus").style.display = 'block';
        document.getElementById("statusMessage").textContent = 'Đang thiết lập kết nối...';
        document.getElementById("incoming-call").style.display = 'none';
        
        console.log("Đã hoàn tất xử lý answer");
    } catch (error) {
        console.error("Lỗi khi xử lý answer:", error);
        handleCallError(error, 'handleCallAnswer');
    }
}

// Xử lý reconnect offer
async function handleReconnectOffer(senderId, offerData) {
    try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offerData));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        sendSignal('answer', answer);
    } catch (error) {
        console.error("Lỗi khi xử lý reconnect offer:", error);
        endCall();
    }
}

// Gửi tín hiệu WebRTC
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

// Thiết lập media stream
async function setupMediaStream(audioOnly = false) {
    try {
        // First check if media devices are available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Media devices not supported in this browser');
        }

        // List available devices to debug
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasAudio = devices.some(device => device.kind === 'audioinput');
        const hasVideo = devices.some(device => device.kind === 'videoinput');

        console.log('Available devices:', {
            audio: hasAudio,
            video: hasVideo
        });

        // Set up constraints based on available devices
        const constraints = {
            audio: hasAudio,
            video: !audioOnly && hasVideo ? {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } : false
        };

        // If no devices are available, throw error
        if (!hasAudio && (!hasVideo || audioOnly)) {
            throw new Error('No audio or video devices found');
        }

        // Try to get the stream
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        return stream;
    } catch (error) {
        console.error('Media setup error:', error);
        
        // Try fallback to audio only if video fails
        if (!audioOnly && error.name === 'NotFoundError') {
            console.log('Falling back to audio only...');
            return setupMediaStream(true);
        }
        
        handleCallError(error, 'setupMediaStream');
        throw error;
    }
}

// Kết thúc cuộc gọi
function endCall(senderId) {
    console.log("Kết thúc cuộc gọi");
    
    const localVideo = document.getElementById("localVideo");
    const remoteVideo = document.getElementById("remoteVideo");
    
    if (localVideo.srcObject) {
        localVideo.srcObject.getTracks().forEach(track => track.stop());
        localVideo.srcObject = null;
    }
    
    if (remoteVideo.srcObject) {
        remoteVideo.srcObject.getTracks().forEach(track => track.stop());
        remoteVideo.srcObject = null;
    }
    
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    
    document.getElementById("call-interface").style.display = 'none';
    document.getElementById("incoming-call").style.display = 'none';
    
    callAccepted = false;
    currentCallerId = null; // Reset người gọi
    updateCallState(CallState.IDLE);
    
    stopCallTimer();
    closeModal();
}

// Đóng modal cuộc gọi
function closeModal() {
    $('#callModal').modal('hide');

    // Reset UI
    document.getElementById("incoming-call").style.display = 'none';
    document.getElementById("call-interface").style.display = 'none';
    
    if (incomingCallTimeout) {
        clearTimeout(incomingCallTimeout);
        incomingCallTimeout = null;
    }
}

// Khởi tạo biến peerConnection
let peerConnection = null;

document.querySelectorAll('[data-sidebar-toggle="chat"]').forEach(button => {
    button.addEventListener('click', () => {
        const sidebar = document.querySelector('.chat-sidebar-wrap');
        const overlay = document.querySelector('.sidebar-overlay');
        sidebar.classList.toggle('show');
        overlay.classList.toggle('show');
    });
});

// Update the connection handlers for group functionality
connection.on("UpdateGroupList", function (groups) {
    console.log('Nhận danh sách nhóm mới:', groups);
    let groupsList = document.querySelector('.groups-list');
    groupsList.innerHTML = '';

    groups.forEach(function (group) {
        let groupItem = document.createElement('div');
        groupItem.className = 'contact group';
        groupItem.setAttribute('data-groupid', group.groupChatId);
        groupItem.setAttribute('data-groupname', group.groupChatName);
        
        groupItem.innerHTML = `
            <div class="avatar-sm rounded-circle bg-primary text-white d-flex align-items-center justify-content-center">
                <i class="fas fa-users"></i>
            </div>
            <div class="contact-info">
                <h6 class="mb-0">${group.groupChatName}</h6>
                <small class="text-muted">Nhóm chat</small>
            </div>
        `;
        
        groupsList.appendChild(groupItem);
    });
});

connection.on("GroupCreated", function (group) {
    console.log('Nhóm mới được tạo:', group);
    let groupsList = document.querySelector('.groups-list');
    
    let groupItem = document.createElement('div');
    groupItem.className = 'contact group';
    groupItem.setAttribute('data-groupid', group.groupChatId);
    groupItem.setAttribute('data-groupname', group.groupChatName);
    
    groupItem.innerHTML = `
        <div class="avatar-sm rounded-circle bg-primary text-white d-flex align-items-center justify-content-center">
            <i class="fas fa-users"></i>
        </div>
        <div class="contact-info">
            <h6 class="mb-0">${group.groupChatName}</h6>
            <small class="text-muted">Nhóm chat</small>
        </div>
    `;
    
    groupsList.appendChild(groupItem);
});

// Hàm xử lý tin nhắn nhóm
function createGroupMessageElement(messageObj, isCurrentUser, isFileMessage = false) {
    console.log("Tạo element tin nhắn nhóm:", messageObj);
    
    let messageDiv = document.createElement("div");
    messageDiv.classList.add("d-flex", "mb-4");
    if (isCurrentUser) {
        messageDiv.classList.add("user");
    }

    // Kiểm tra xem có file trong tin nhắn hay không
    isFileMessage = messageObj.filePath ? true : isFileMessage;

    // Xử lý ảnh đại diện
    let senderImage = messageObj.senderImage || "/content/images/avatar/default-avatar.jpg";
    let avatar = `<img class="avatar-sm rounded-circle me-3" src="${messageObj.senderImage?.startsWith("http") ? messageObj.senderImage : `/content/images/avatar/${messageObj.senderImage}`}" alt="User Avatar">`;

    // Xử lý nội dung tin nhắn
    let messageContent = "";
    if (isFileMessage && messageObj.filePath) {
        messageContent = `📎 <a href="/uploads/${messageObj.filePath}" target="_blank">Tải file</a>`;
    } else {
        messageContent = messageObj.content || messageObj.message || "";
    }

    // Xử lý thời gian
    let timestamp = messageObj.timestamp || new Date().toLocaleString();

    // Tạo HTML cho tin nhắn
    if (isCurrentUser) {
        messageDiv.innerHTML = `
            <div class="message flex-grow-1">
                <div class="d-flex">
                    <p class="mb-1 text-title text-16 flex-grow-1">${messageObj.senderName}</p>
                    <span class="text-small text-muted">${messageObj.timestamp}</span>
                 </div>
                <p class="m-0">${messageContent}</p>
             </div>
            ${avatar}
        `;
    } else {
        messageDiv.innerHTML = `
            ${avatar}
            <div class="message flex-grow-1">
                <div class="d-flex">
                    <p class="mb-1 text-title text-16 flex-grow-1">${messageObj.senderName}</p>
                    <span class="text-small text-muted">${messageObj.timestamp}</span>
                 </div>
                <p class="m-0">${messageContent}</p>
             </div>
        `;
    }

    return messageDiv;
}

// Cập nhật event handler nhận tin nhắn nhóm
connection.on("ReceiveGroupMessage", function (messageObj) {
    console.log("Nhận tin nhắn nhóm:", messageObj);
    let selectedGroupId = document.getElementById("selectedGroup").value;
    
    console.log("So sánh groupId:", {
        selectedGroupId: selectedGroupId,
        messageGroupId: messageObj.groupChatId,
        isEqual: String(messageObj.groupChatId) === String(selectedGroupId)
    });
    
    if (String(messageObj.groupChatId) === String(selectedGroupId)) {
        let chatContent = document.querySelector(".chat-content");
        let currentUser = document.getElementById("currentUser").value;
        
        console.log("Hiển thị tin nhắn nhóm từ:", messageObj.senderName);
        let messageElement = createGroupMessageElement(messageObj, messageObj.senderId === currentUser);
        
        if (messageElement) {
            chatContent.appendChild(messageElement);
            chatContent.scrollTop = chatContent.scrollHeight;
        }
    } else {
        console.log("Tin nhắn không thuộc nhóm hiện tại");
    }
});

// Cập nhật event handler nhận lịch sử tin nhắn nhóm
connection.on("ReceiveGroupMessages", function (messages) {
    console.log("Nhận lịch sử tin nhắn nhóm:", messages);
    let chatContent = document.querySelector(".chat-content");
    chatContent.innerHTML = "";
    let currentUser = document.getElementById("currentUser").value;

    if (Array.isArray(messages)) {
        messages.forEach(msg => {
            let messageElement = createGroupMessageElement(msg, msg.senderId === currentUser, msg.filePath !== null);
            if (messageElement) {
                chatContent.appendChild(messageElement);
            }
        });
        chatContent.scrollTop = chatContent.scrollHeight;
    } else {
        console.log("Không có tin nhắn hoặc dữ liệu không hợp lệ:", messages);
    }
});

// Cập nhật hàm xử lý khi click vào nhóm
function handleGroupClick(target) {
    currentChatType = 'group';
    document.getElementById("chatType").value = 'group';
    
    let groupName = target.getAttribute("data-groupname");
    selectedGroupId = target.getAttribute("data-groupid");
    document.getElementById("selectedGroup").value = selectedGroupId;
    
    console.log("Đã chọn nhóm:", groupName, "ID:", selectedGroupId);
    
    // Update chat topbar
    const selectedUserInfo = document.querySelector(".selected-user-info");
    if (selectedUserInfo) {
        selectedUserInfo.querySelector(".selected-user-name").textContent = groupName;
        selectedUserInfo.querySelector(".user-status").textContent = "Nhóm chat";
    }
    
    // Show group avatar
    const selectedUserAvatarImg = document.getElementById("selectedUserAvatar");
    if (selectedUserAvatarImg) {
        selectedUserAvatarImg.src = "/content/images/avatar/default-avatar.jpg";
        selectedUserAvatarImg.classList.remove("d-none");
    }
    
    // Show group info button, hide call button
    document.querySelector(".startCallButton").style.display = "none";
    
    // Clear and focus message input
    document.getElementById("messageInput").value = "";
    document.getElementById("messageInput").focus();
    document.querySelector(".chat-content").innerHTML = "";
    
    // Load group messages
    console.log("Đang tải tin nhắn nhóm cho nhóm ID:", selectedGroupId);
    connection.invoke("LoadGroupMessages", selectedGroupId)
        .catch(function (err) {
            console.error("Lỗi khi tải tin nhắn nhóm:", err.toString());
        });
}

// Group info button click handler
document.querySelector(".groupInfoButton").addEventListener("click", function() {
    if (!selectedGroupId) return;
    
    // Load and display group members
    connection.invoke("GetGroupMembers", selectedGroupId)
        .then(members => {
            let membersList = document.querySelector(".group-members-list");
            membersList.innerHTML = "";
            
            members.forEach(member => {
                let memberItem = document.createElement("div");
                memberItem.className = "d-flex align-items-center mb-2";
                memberItem.innerHTML = `
                    <img class="avatar-xs rounded-circle me-2" src="/content/images/avatar/${member.userImage}" alt="${member.userName}">
                    <span>${member.userName}</span>
                `;
                membersList.appendChild(memberItem);
            });
            
            $('#groupInfoModal').modal('show');
        })
        .catch(err => console.error("Error loading group members:", err));
});

// Xử lý sự kiện tạo nhóm
document.addEventListener('DOMContentLoaded', function() {
    // Xử lý nút tạo nhóm
    document.getElementById('createGroupBtn').addEventListener('click', function() {
        console.log('Nút tạo nhóm được click');
        
        // Lấy danh sách người dùng để chọn thành viên
        let allUsers = [];
        document.querySelectorAll('.contacts-scrollable .contact').forEach(contact => {
            let userId = contact.getAttribute('data-userid');
            let userName = contact.querySelector('h6').textContent;
            
            // Không thêm user hiện tại vào danh sách
            if (userId !== document.getElementById('currentUser').value) {
                allUsers.push({
                    id: userId,
                    name: userName
                });
            }
        });

        // Tạo danh sách checkbox cho từng user
        let memberListHtml = '';
        allUsers.forEach(user => {
            memberListHtml += `
                <div class="form-check mb-2">
                    <input class="form-check-input" type="checkbox" value="${user.id}" id="member${user.id}">
                    <label class="form-check-label" for="member${user.id}">
                        ${user.name}
                    </label>
                </div>
            `;
        });

        // Cập nhật nội dung modal
        document.querySelector('.member-list').innerHTML = memberListHtml;

        // Hiển thị modal
        showModalGroup()
    });

    // Xử lý nút submit tạo nhóm
    document.getElementById('createGroupSubmit').addEventListener('click', function() {
        let groupName = document.getElementById('groupName').value.trim();
        if (!groupName) {
            alert('Vui lòng nhập tên nhóm');
            return;
        }

        // Lấy danh sách thành viên được chọn
        let selectedMembers = Array.from(document.querySelectorAll('.member-list input:checked'))
            .map(input => input.value);

        if (selectedMembers.length === 0) {
            alert('Vui lòng chọn ít nhất một thành viên');
            return;
        }

        // Thêm người tạo nhóm vào danh sách thành viên
        let currentUserId = document.getElementById('currentUser').value;
        if (!selectedMembers.includes(currentUserId)) {
            selectedMembers.push(currentUserId);
        }

        console.log('Tạo nhóm với tên:', groupName);
        console.log('Thành viên:', selectedMembers);

        // Gọi hàm tạo nhóm qua SignalR
        connection.invoke('CreateGroup', groupName, selectedMembers)
            .then(() => {
                console.log('Nhóm đã được tạo thành công');
                // Đóng modal
                closeModalGroup();
                // Reset form
                document.getElementById('groupName').value = '';
                document.querySelectorAll('.member-list input:checked').forEach(input => {
                    input.checked = false;
                });
            })
            .catch(function (err) {
                console.error('Lỗi khi tạo nhóm:', err.toString());
                alert('Có lỗi xảy ra khi tạo nhóm. Vui lòng thử lại.');
            });
    });
});
function closeModalGroup() {
    $('#createGroupModal').modal('hide');
}
function showModalGroup() {
    $('#createGroupModal').modal('show');
}