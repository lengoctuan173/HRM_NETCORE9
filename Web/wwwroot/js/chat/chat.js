"use strict";

// Thêm enum CallState ở đầu file
const CallState = {
    IDLE: 'idle',
    CALLING: 'calling',
    IN_CALL: 'in_call',
    ENDING: 'ending'
};

class Chat {
    constructor() {
        this.connection = new signalR.HubConnectionBuilder()
            .withUrl("/chatHub")
            .withAutomaticReconnect([0, 2000, 5000, 10000, 30000]) // Thêm automatic reconnect với thời gian tăng dần
            .build();
        this.currentCallState = CallState.IDLE;
        this.currentCallerId = null;
        this.selectedGroupId = null;
        this.currentChatType = 'direct';
        this.callAccepted = false;
        this.peerConnection = null;
        this.isMicMuted = false;
        this.isSpeakerMuted = false;
        this.callDuration = 0;
        this.callTimer = null;
        this.incomingCallTimeout = null;
        this.reconnectAttempts = 0;
        this.MAX_RECONNECT_ATTEMPTS = 5; // Tăng số lần thử kết nối lại
        this.CALL_TIMEOUT = 60000; // Tăng timeout lên 60 giây
        this.CONNECTION_TIMEOUT = 15000; // Timeout cho việc thiết lập kết nối
        this.pendingCandidates = [];
        this.lastConnectionState = null;
        this.connectionCheckInterval = null;

        this.initEvents();
        this.startConnection();
    }

    initEvents() {
        this.initSignalREvents();
        this.initUIEvents();
        this.initContactListEvents();
    }

    initSignalREvents() {
        this.connection.on("ReceiveMessage", (messageObj) => this.handleReceiveMessage(messageObj));
        this.connection.on("UpdateUserList", (allUsers, onlineUsers) => this.handleUpdateUserList(allUsers, onlineUsers));
        this.connection.on("connected", () => this.handleConnected());
        this.connection.on("ReceiveCallSignal", (senderId, signalType, signalData) => this.handleReceiveCallSignal(senderId, signalType, signalData));
        this.connection.on("UpdateGroupList", (groups) => this.handleUpdateGroupList(groups));
        this.connection.on("GroupCreated", (group) => this.handleGroupCreated(group));
        this.connection.on("ReceiveGroupMessage", (messageObj) => this.handleReceiveGroupMessage(messageObj));
        this.connection.on("ReceiveGroupMessages", (messages) => this.handleReceiveGroupMessages(messages));
        this.connection.on("ReceiveOldMessages", (messages) => this.handleReceiveOldMessages(messages));
    }

    initUIEvents() {
        this.initMessageEvents();
        this.initFileEvents();
        this.initCallEvents();
        this.initSidebarEvents();
        this.initGroupEvents();
    }

    initMessageEvents() {
        document.getElementById("sendButton").addEventListener("click", () => this.sendMessage());
        document.getElementById("messageInput").addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                this.sendMessage();
            }
        });
    }

    initFileEvents() {
        document.getElementById("uploadFileButton").addEventListener("click", () => {
            document.getElementById("fileInput").click();
        });
        document.getElementById("fileInput").addEventListener("change", (event) => {
            let file = event.target.files[0];
            if (file) {
                this.sendFile(file);
            }
        });
    }

    initCallEvents() {
        // Xử lý sự kiện click nút gọi điện
        document.querySelector(".startCallButton").addEventListener("click", () => {
            const currentUser = document.getElementById("currentUser").value;
            const receiverId = document.getElementById("selectedUser").value;

            if (!receiverId) {
                alert("⚠ Vui lòng chọn một người để gọi.");
                return;
            }

            try {
                this.startCall(receiverId);
            } catch (error) {
                console.error("Lỗi khi bắt đầu cuộc gọi:", error);
                this.handleCallError(error, 'startCall');
            }
        });

        // Xử lý sự kiện click nút kết thúc cuộc gọi
        document.getElementById("endCallButton").addEventListener("click", () => this.endCall());

        // Xử lý sự kiện click nút tắt/bật mic
        document.getElementById("toggleMicButton").addEventListener("click", () => this.toggleMic());

        // Xử lý sự kiện click nút tắt/bật loa
        document.getElementById("toggleSpeakerButton").addEventListener("click", () => this.toggleSpeaker());
    }

    initSidebarEvents() {
        document.querySelectorAll('[data-sidebar-toggle="chat"]').forEach(button => {
            button.addEventListener('click', () => this.toggleSidebar());
        });
    }

    initGroupEvents() {
        // Xử lý sự kiện click nút tạo nhóm
        document.getElementById("createGroupBtn").addEventListener("click", () => {
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
            //// Hiển thị modal
            this.showModalGroup();

        });
        // Xử lý sự kiện click nút thông tin nhóm
        document.querySelector(".groupInfoButton").addEventListener("click", () => this.showGroupInfo());
    }

    initContactListEvents() {
        document.addEventListener("click", (event) => {
            const contactTarget = event.target.closest(".contact");
            if (contactTarget) {
                const userId = contactTarget.getAttribute("data-userid");
                const userName = contactTarget.getAttribute("data-username");
                const userImage = contactTarget.querySelector("img").src;

                if (userId && userName) {
                    this.selectContact(userId, userName, userImage);
                }
            }
        });
    }

    selectContact(userId, userName, userImage) {
        this.currentChatType = 'direct';
        document.getElementById("chatType").value = 'direct';
        this.selectedGroupId = null;
        document.getElementById("selectedGroup").value = "";

        // Cập nhật thông tin người dùng được chọn
        document.getElementById("selectedUser").value = userId;
        document.getElementById("selectedUser").setAttribute("data-username", userName);
        document.getElementById("selectedUser").setAttribute("data-imagePath", userImage);

        // Cập nhật topbar chat
        const selectedUserInfo = document.querySelector(".selected-user-info");
        if (selectedUserInfo) {
            selectedUserInfo.querySelector(".selected-user-name").textContent = userName;

            // Kiểm tra trạng thái online thực tế của user
            const contactElement = document.querySelector(`.contact[data-userid="${userId}"]`);
            const isOnline = contactElement && contactElement.classList.contains('online');
            selectedUserInfo.querySelector(".user-status").textContent = isOnline ? "Online" : "Offline";
        }

        // Cập nhật avatar
        const selectedUserAvatarImg = document.getElementById("selectedUserAvatar");
        if (selectedUserAvatarImg) {
            selectedUserAvatarImg.src = userImage;
            selectedUserAvatarImg.classList.remove("d-none");
        }

        // Hiển thị nút gọi điện, ẩn nút thông tin nhóm
        document.querySelector(".startCallButton").style.display = "flex";
        document.querySelector(".groupInfoButton").style.display = "none";

        // Xóa và focus vào ô nhập tin nhắn
        document.getElementById("messageInput").value = "";
        document.getElementById("messageInput").focus();
        document.querySelector(".chat-content").innerHTML = "";

        // Tải tin nhắn cũ
        let currentUser = document.getElementById("currentUser").value;
        this.connection.invoke("LoadOldMessages", currentUser, userId)
            .catch(function (err) {
                console.error("Lỗi khi tải tin nhắn cũ:", err.toString());
            });
    }

    startConnection() {
        this.connection.start()
            .then(() => {
                console.log("✅ Kết nối SignalR thành công!");
            })
            .catch(function (err) {
                console.error("❌ Lỗi kết nối SignalR: ", err.toString());
            });
    }

    handleReceiveMessage(messageObj) {
        let currentUser = document.getElementById("currentUser").value;
        let chatContent = document.querySelector(".chat-content");

        let messageElement = this.createMessageElement(messageObj, messageObj.senderId === currentUser, false);
        chatContent.appendChild(messageElement);

        // Cuộn xuống cuối
        chatContent.scrollTop = chatContent.scrollHeight;
    }

    handleUpdateUserList(allUsers, onlineUsers) {
        console.log("Nhận danh sách người dùng:", { allUsers, onlineUsers });
        let contactList = document.querySelector(".contacts-scrollable");
        contactList.innerHTML = ""; // Xóa danh sách cũ

        let currentUser = document.getElementById("currentUser").value;
        console.log("User hiện tại:", currentUser);

        allUsers.forEach(function (user) {
            // Kiểm tra chặt chẽ hơn để đảm bảo không hiển thị user hiện tại
            if (user.userId && user.userId.toString() !== currentUser.toString()) {
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
    }

    handleConnected() {
        console.log("SignalR đã kết nối thành công!");
        let receiverId = document.getElementById("selectedUser").value;
        let signalType = "offer"; // Ví dụ tín hiệu offer khi bắt đầu cuộc gọi
        let signalData = { senderName: document.getElementById("currentUser").getAttribute("data-username") };
        this.sendCallSignal(receiverId, signalType, signalData);
    }

    async handleReceiveCallSignal(senderId, signalType, signalData) {
        console.log("Tín hiệu cuộc gọi nhận được:", senderId, signalType, signalData);
        console.log("Trạng thái cuộc gọi hiện tại:", this.currentCallState);
        console.log("Người gọi hiện tại:", this.currentCallerId);

        if (this.currentCallState === CallState.ENDING) {
            console.log("Bỏ qua tín hiệu vì cuộc gọi đang kết thúc");
            return;
        }

        try {
            switch (signalType) {
                case "offer":
                    // Nếu là người đã bắt đầu cuộc gọi, bỏ qua offer
                    if (this.currentCallerId === document.getElementById("currentUser").value) {
                        console.log("Bỏ qua offer vì đây là người gọi");
                        return;
                    }

                    // Nếu đang trong cuộc gọi với người khác
                    if (this.currentCallState === CallState.IN_CALL && 
                        this.currentCallerId && 
                        this.currentCallerId !== senderId) {
                        console.log("Từ chối cuộc gọi mới vì đang trong cuộc gọi khác");
                        this.sendCallSignal(senderId, "busy", null);
                        return;
                    }

                    // Nếu nhận được offer từ cùng người gọi khi đang trong trạng thái calling
                    if (this.currentCallState === CallState.CALLING && 
                        this.currentCallerId === senderId) {
                        console.log("Nhận được offer mới từ cùng người gọi, cập nhật offer");
                        if (this.peerConnection) {
                            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(signalData));
                        }
                        return;
                    }

                    console.log("Hiển thị cuộc gọi đến từ:", senderId);
                    this.currentCallerId = senderId;
                    await this.handleIncomingCall(senderId, signalData);
                    break;

                case "answer":
                    console.log("Nhận tín hiệu answer từ:", senderId);
                    if (this.currentCallState === CallState.CALLING || this.currentCallState === CallState.IDLE) {
                        await this.handleCallAnswer(senderId, signalData);
                    }
                    break;

                case "connection_established":
                    console.log("Nhận tín hiệu kết nối thành công từ:", senderId);
                    // Cập nhật UI cho bên nhận khi kết nối đã được thiết lập
                    document.getElementById("connectionStatus").style.display = 'none';
                    document.getElementById("call-interface").style.display = 'block';
                    this.updateCallState(CallState.IN_CALL);
                    this.startCallTimer();
                    break;

                case "candidate":
                    console.log("Nhận ICE candidate từ:", senderId);
                    if (!this.peerConnection || !this.peerConnection.remoteDescription) {
                        console.log("Lưu trữ ICE candidate để xử lý sau");
                        this.pendingCandidates.push({
                            senderId: senderId,
                            candidate: signalData
                        });
                        return;
                    }

                    try {
                        await this.peerConnection.addIceCandidate(new RTCIceCandidate(signalData));
                        console.log("Đã thêm ICE candidate thành công");
                    } catch (error) {
                        console.error("Lỗi khi thêm ICE candidate:", error);
                    }
                    break;

                case "end":
                    console.log("Nhận tín hiệu kết thúc từ:", senderId);
                    
                    // Hiển thị thông báo phù hợp với lý do kết thúc
                    if (signalData && signalData.reason) {
                        switch (signalData.reason) {
                            case "user_ended":
                                this.showNotification('Người dùng đã từ chối cuộc gọi', 'info');
                                break;
                            case "busy":
                                this.showNotification('Người dùng đang bận', 'warning');
                                break;
                            case "timeout":
                                this.showNotification('Cuộc gọi đã hết thời gian chờ', 'warning');
                                break;
                            case "error":
                                this.showNotification('Đã xảy ra lỗi trong cuộc gọi', 'error');
                                break;
                            default:
                                this.showNotification('Cuộc gọi đã kết thúc', 'info');
                        }
                    }
                    
                    this.endCall(senderId);
                    break;

                case "busy":
                    console.log("Người dùng đang bận");
                    this.showNotification('Người dùng đang trong cuộc gọi khác. Vui lòng thử lại sau.', 'warning');
                    this.endCall();
                    break;

                case "timeout":
                    console.log("Cuộc gọi hết thời gian");
                    this.showNotification('Cuộc gọi đã hết thời gian chờ.', 'warning');
                    this.endCall();
                    break;

                case "reject":
                    console.log("Cuộc gọi bị từ chối");
                    this.showNotification('Cuộc gọi đã bị từ chối.', 'info');
                    this.endCall();
                    break;

                case "reconnect-offer":
                    console.log("Nhận tín hiệu reconnect từ:", senderId);
                    this.handleReconnectOffer(senderId, signalData);
                    break;
            }
        } catch (error) {
            console.error("Lỗi xử lý tín hiệu cuộc gọi:", error);
            this.handleCallError(error, 'receiveCallSignal');
        }
    }

    handleUpdateGroupList(groups) {
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
    }

    handleGroupCreated(group) {
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
    }

    handleReceiveGroupMessage(messageObj) {
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
            let messageElement = this.createGroupMessageElement(messageObj, messageObj.senderId === currentUser);

            if (messageElement) {
                chatContent.appendChild(messageElement);
                chatContent.scrollTop = chatContent.scrollHeight;
            }
        } else {
            console.log("Tin nhắn không thuộc nhóm hiện tại");
        }
    }

    handleReceiveGroupMessages(messages) {
        console.log("Nhận lịch sử tin nhắn nhóm:", messages);
        let chatContent = document.querySelector(".chat-content");
        chatContent.innerHTML = "";
        let currentUser = document.getElementById("currentUser").value;

        if (Array.isArray(messages)) {
            messages.forEach(msg => {
                let messageElement = this.createGroupMessageElement(msg, msg.senderId === currentUser, msg.filePath !== null);
                if (messageElement) {
                    chatContent.appendChild(messageElement);
                }
            });
            chatContent.scrollTop = chatContent.scrollHeight;
        } else {
            console.log("Không có tin nhắn hoặc dữ liệu không hợp lệ:", messages);
        }
    }

    handleReceiveOldMessages(messages) {
        console.log("Nhận tin nhắn cũ:", messages);
        let chatContent = document.querySelector(".chat-content");
        let currentUser = document.getElementById("currentUser").value;
        let selectedUser = document.getElementById("selectedUser").value;

        if (Array.isArray(messages)) {
            messages.forEach(msg => {
                // Kiểm tra xem tin nhắn có thuộc cuộc trò chuyện hiện tại không
                if ((msg.senderId === currentUser && msg.receiverId === selectedUser) ||
                    (msg.receiverId === currentUser && msg.senderId === selectedUser)) {
                    let messageElement = this.createMessageElement(msg, msg.senderId === currentUser, msg.filePath !== null);
                    if (messageElement) {
                        chatContent.appendChild(messageElement);
                    }
                }
            });
            chatContent.scrollTop = chatContent.scrollHeight;
        } else {
            console.log("Không có tin nhắn cũ hoặc dữ liệu không hợp lệ:", messages);
        }
    }

    async handleCallAnswer(senderId, answerData) {
        try {
            console.log("Xử lý answer từ:", senderId);
            
            if (!this.peerConnection) {
                console.error("Không có peer connection");
                return;
            }

            // Set remote description từ answer
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription({
                type: 'answer',
                sdp: answerData.sdp
            }));

            // Cập nhật UI
            document.getElementById("call-interface").style.display = 'block';
            document.getElementById("connectionStatus").style.display = 'none';
            document.getElementById("incoming-call").style.display = 'none';

            // Cập nhật trạng thái
            this.updateCallState(CallState.IN_CALL);
            this.startCallTimer();

        } catch (error) {
            console.error("Lỗi khi xử lý answer:", error);
            this.handleCallError(error, 'handleCallAnswer');
        }
    }

    async handleIncomingCall(senderId, offerData) {
        try {
            console.log("Xử lý cuộc gọi đến từ:", senderId);

            // Kiểm tra các elements cần thiết
            const incomingCallDiv = document.getElementById("incoming-call");
            const callInterfaceDiv = document.getElementById("call-interface");
            const connectionStatusDiv = document.getElementById("connectionStatus");
            const callerNameElement = document.getElementById("incomingCallName");

            if (!incomingCallDiv || !callInterfaceDiv || !connectionStatusDiv) {
                console.error("Không tìm thấy các elements UI cần thiết");
                this.showNotification("Có lỗi khi hiển thị giao diện cuộc gọi", "error");
                return;
            }

            // Hiển thị modal cuộc gọi
            this.showModal();

            // Lấy tên người gọi từ danh bạ
            const callerContact = document.querySelector(`.contact[data-userid="${senderId}"]`);
            const callerName = callerContact ? callerContact.getAttribute("data-username") || "Người dùng" : "Người dùng";

            // Cập nhật UI cho cuộc gọi đến
            if (callerNameElement) {
                callerNameElement.textContent = callerName;
            }

            // Ẩn/hiện các phần giao diện
            incomingCallDiv.style.display = 'block';
            callInterfaceDiv.style.display = 'none';
            connectionStatusDiv.style.display = 'none';

            // Phát âm thanh chuông
            try {
                const ringtone = new Audio('/content/sounds/ringtone.mp3');
                ringtone.loop = true;
                await ringtone.play().catch(error => {
                    console.warn("Không thể phát âm thanh chuông:", error);
                });

                // Thiết lập timeout cho cuộc gọi đến
                this.incomingCallTimeout = setTimeout(() => {
                    if (!this.callAccepted) {
                        ringtone.pause();
                        this.sendCallSignal(senderId, "timeout", null);
                        this.endCall();
                    }
                }, this.CALL_TIMEOUT);

                // Xử lý sự kiện chấp nhận cuộc gọi
                const acceptButton = document.getElementById("acceptCallButton");
                const rejectButton = document.getElementById("rejectCallButton");

                if (!acceptButton || !rejectButton) {
                    throw new Error("Không tìm thấy nút điều khiển cuộc gọi");
                }

                // Xóa event listeners cũ nếu có
                const newAcceptButton = acceptButton.cloneNode(true);
                const newRejectButton = rejectButton.cloneNode(true);
                acceptButton.parentNode.replaceChild(newAcceptButton, acceptButton);
                rejectButton.parentNode.replaceChild(newRejectButton, rejectButton);

                // Thêm event listeners mới
                newAcceptButton.onclick = async () => {
                    try {
                        ringtone.pause();
                        this.callAccepted = true;
                        clearTimeout(this.incomingCallTimeout);

                        // Khởi tạo peer connection
                        await this.initializePeerConnection(senderId, offerData);

                        // Cập nhật UI
                        incomingCallDiv.style.display = 'none';
                        callInterfaceDiv.style.display = 'block';
                        connectionStatusDiv.style.display = 'block';
                        document.getElementById("statusMessage").textContent = 'Đang thiết lập kết nối...';

                        // Cập nhật trạng thái
                        this.updateCallState(CallState.IN_CALL);
                        this.currentCallerId = senderId;
                    } catch (error) {
                        console.error("Lỗi khi chấp nhận cuộc gọi:", error);
                        this.handleCallError(error, 'acceptCall');
                    }
                };

                newRejectButton.onclick = () => {
                    ringtone.pause();
                    clearTimeout(this.incomingCallTimeout);
                    this.sendCallSignal(senderId, "reject", null);
                    this.endCall();
                };

            } catch (error) {
                console.error("Lỗi khi xử lý âm thanh hoặc nút điều khiển:", error);
                this.handleCallError(error, 'handleIncomingCall');
            }

        } catch (error) {
            console.error("Lỗi khi xử lý cuộc gọi đến:", error);
            this.handleCallError(error, 'handleIncomingCall');
            this.closeModal();
        }
    }

    async initializePeerConnection(senderId, offerData) {
        try {
            // Lấy cấu hình ICE servers từ Twilio
            let configuration;
            try {
                const response = await fetch('/Chat/GetTwilioToken');
                if (!response.ok) {
                    throw new Error('Không thể lấy cấu hình ICE servers từ Twilio');
                }
                const data = await response.json();
                configuration = {
                    iceServers: [
                        ...(data.iceServers || []),
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:stun2.l.google.com:19302' },
                        { urls: 'stun:stun3.l.google.com:19302' },
                        { urls: 'stun:stun4.l.google.com:19302' }
                    ],
                    iceCandidatePoolSize: 10,
                    bundlePolicy: 'max-bundle',
                    rtcpMuxPolicy: 'require',
                    iceTransportPolicy: 'all'
                };
                console.log("Đã nhận cấu hình ICE servers:", configuration);
            } catch (error) {
                console.warn("Lỗi khi lấy Twilio ICE servers, sử dụng Google STUN:", error);
                configuration = {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:stun2.l.google.com:19302' }
                    ],
                    iceCandidatePoolSize: 10,
                    bundlePolicy: 'max-bundle',
                    rtcpMuxPolicy: 'require'
                };
            }

            this.peerConnection = new RTCPeerConnection(configuration);
            console.log("Khởi tạo peer connection với cấu hình:", configuration);

            // Thiết lập local stream trước khi kết nối
            const mediaStream = await this.setupMediaStream();
            const localVideoElement = document.getElementById("localVideo");

            // Thêm tất cả tracks vào peer connection ngay lập tức
            mediaStream.getTracks().forEach(track => {
                console.log("Thêm local track vào peer connection:", track.kind);
                this.peerConnection.addTrack(track, mediaStream);
            });

            // Hiển thị local video
            if (localVideoElement) {
                localVideoElement.srcObject = mediaStream;
                await this.safePlay(localVideoElement);
            }

            // Lắng nghe remote tracks
            this.peerConnection.addEventListener('track', async (event) => {
                console.log("Nhận được remote track:", event.track.kind);
                const [remoteStream] = event.streams;
                
                if (!remoteStream) {
                    console.error("Không có remote stream trong track event");
                    return;
                }

                const remoteVideo = document.getElementById("remoteVideo");
                if (remoteVideo) {
                    // Lưu stream ID để kiểm tra sau này
                    remoteVideo.dataset.streamId = remoteStream.id;
                    
                    // Nếu đã có stream, chỉ cập nhật nếu là stream mới
                    if (remoteVideo.srcObject && remoteVideo.srcObject.id === remoteStream.id) {
                        console.log("Stream đã tồn tại, bỏ qua");
                        return;
                    }

                    console.log("Cập nhật remote stream mới:", {
                        streamId: remoteStream.id,
                        tracks: remoteStream.getTracks().map(t => ({
                            kind: t.kind,
                            enabled: t.enabled,
                            muted: t.muted
                        }))
                    });

                    remoteVideo.srcObject = remoteStream;
                    
                    // Cập nhật UI dựa trên loại tracks
                    const hasVideo = remoteStream.getVideoTracks().length > 0;
                    const hasAudio = remoteStream.getAudioTracks().length > 0;
                    
                    this.updateRemoteVideoUI(hasVideo);
                    this.updateRemoteAudioUI(hasAudio);

                    // Theo dõi các thay đổi trong stream
                    remoteStream.onaddtrack = (e) => {
                        console.log("Track mới được thêm vào remote stream:", e.track.kind);
                    };
                    
                    remoteStream.onremovetrack = (e) => {
                        console.log("Track bị xóa khỏi remote stream:", e.track.kind);
                        // Kiểm tra lại số lượng tracks
                        const remainingVideoTracks = remoteStream.getVideoTracks().length;
                        const remainingAudioTracks = remoteStream.getAudioTracks().length;
                        this.updateRemoteVideoUI(remainingVideoTracks > 0);
                        this.updateRemoteAudioUI(remainingAudioTracks > 0);
                    };

                    try {
                        await remoteVideo.play();
                        console.log("Remote video đã bắt đầu phát");
                    } catch (error) {
                        console.warn("Không thể tự động phát video:", error);
                        if (error.name === 'NotAllowedError') {
                            this.showNotification('Vui lòng cho phép tự động phát video', 'warning');
                        }
                    }
                }
            });

            // Lắng nghe sự kiện ICE candidate
            this.peerConnection.addEventListener('icecandidate', async event => {
                if (event.candidate) {
                    console.log("Gửi ICE candidate đến:", senderId);
                    await this.sendCallSignal(senderId, "candidate", event.candidate);
                }
            });

            // Lắng nghe sự kiện kết nối thay đổi
            this.peerConnection.addEventListener('connectionstatechange', async event => {
                console.log("Connection state changed:", this.peerConnection.connectionState);
                switch (this.peerConnection.connectionState) {
                    case 'connected':
                        console.log("Peers connected successfully!");
                        this.showNotification('Kết nối thành công!', 'success');
                        document.getElementById("connectionStatus").style.display = 'none';
                        break;
                    case 'disconnected':
                    case 'failed':
                        console.log("Peer connection failed or disconnected");
                        this.showNotification('Kết nối bị gián đoạn', 'error');
                        // Thử kết nối lại trước khi kết thúc
                        if (this.currentCallState === CallState.IN_CALL) {
                            this.tryReconnect(senderId);
                        } else {
                            this.endCall();
                        }
                        break;
                }
            });

            // Set remote description từ offer
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription({
                type: 'offer',
                sdp: offerData.sdp
            }));

            // Tạo answer
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);

            // Gửi answer
            await this.sendCallSignal(senderId, "answer", {
                type: 'answer',
                sdp: answer.sdp,
                senderName: document.getElementById("currentUser").getAttribute("data-username")
            });

        } catch (error) {
            console.error("Lỗi khi khởi tạo peer connection:", error);
            this.handleCallError(error, 'initializePeerConnection');
            throw error;
        }
    }

    endCall(initiatorId = null) {
        console.log("Kết thúc cuộc gọi", initiatorId ? `từ ${initiatorId}` : "");

        // Cập nhật trạng thái
        this.updateCallState(CallState.ENDING);

        // Nếu người hiện tại là người chủ động kết thúc cuộc gọi
        // hoặc nếu không có initiatorId (tức là người này chủ động kết thúc)
        if (!initiatorId) {
            // Gửi tín hiệu kết thúc đến người còn lại trong cuộc gọi
            const currentUserId = document.getElementById("currentUser").value;
            const otherPartyId = this.currentCallerId === currentUserId ? 
                document.getElementById("selectedUser").value : this.currentCallerId;

            if (otherPartyId) {
                console.log("Gửi tín hiệu kết thúc đến:", otherPartyId);
                this.sendCallSignal(otherPartyId, "end", {
                    initiator: currentUserId,
                    reason: "user_ended"
                });
            }
        }

        // Dừng media streams
        const localVideo = document.getElementById("localVideo");
        const remoteVideo = document.getElementById("remoteVideo");

        if (localVideo && localVideo.srcObject) {
            localVideo.srcObject.getTracks().forEach(track => track.stop());
            localVideo.srcObject = null;
        }

        if (remoteVideo && remoteVideo.srcObject) {
            remoteVideo.srcObject.getTracks().forEach(track => track.stop());
            remoteVideo.srcObject = null;
        }

        // Đóng peer connection
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        // Reset các trạng thái
        this.currentCallState = CallState.IDLE;
        this.currentCallerId = null;
        this.callAccepted = false;
        this.stopCallTimer();

        // Đóng modal và cập nhật UI
        this.closeModal();
        document.getElementById("connectionStatus").style.display = 'none';
        document.getElementById("call-interface").style.display = 'none';
        document.getElementById("incoming-call").style.display = 'none';

        // Xóa timeout nếu có
        if (this.incomingCallTimeout) {
            clearTimeout(this.incomingCallTimeout);
            this.incomingCallTimeout = null;
        }

        // Xóa interval kiểm tra kết nối nếu có
        if (this.connectionCheckInterval) {
            clearInterval(this.connectionCheckInterval);
            this.connectionCheckInterval = null;
        }

        // Hiển thị thông báo phù hợp
        if (initiatorId) {
            this.showNotification('Cuộc gọi đã kết thúc bởi người dùng khác', 'info');
        } else {
            this.showNotification('Cuộc gọi đã kết thúc', 'info');
        }
    }

    closeModal() {
        $("#callModal").modal("hide");
        // Reset UI
        document.getElementById("incoming-call").style.display = 'none';
        document.getElementById("call-interface").style.display = 'none';
        document.getElementById("connectionStatus").style.display = 'none';
    }

    showModal() {
        $("#callModal").modal("show");
    }

    updateCallState(newState) {
        console.log(`Chuyển trạng thái cuộc gọi: ${this.currentCallState} -> ${newState}`);
        this.currentCallState = newState;
        this.updateCallUI(newState);
    }

    updateCallUI(state) {
        const callError = document.getElementById('callError');
        const connectionStatus = document.getElementById('connectionStatus');
        const callInterface = document.getElementById('call-interface');
        const incomingCall = document.getElementById('incoming-call');
        const statusMessage = document.getElementById('statusMessage');

        switch (state) {
            case CallState.IDLE:
                callInterface.style.display = 'none';
                incomingCall.style.display = 'none';
                connectionStatus.style.display = 'none';
                this.stopCallTimer();
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
                this.startCallTimer();
                break;

            case CallState.ENDING:
                connectionStatus.style.display = 'block';
                statusMessage.textContent = 'Đang kết thúc cuộc gọi...';
                break;
        }
    }

    handleCallError(error, context) {
        console.error(`Lỗi trong ${context}:`, error);

        const errorDiv = document.getElementById('callError');
        const errorMessage = document.getElementById('errorMessage');

        let message = 'Đã xảy ra lỗi trong cuộc gọi';
        switch (error.name) {
            case 'NotAllowedError':
                message = 'Vui lòng cho phép truy cập microphone/camera trong trình duyệt của bạn';
                break;
            case 'NotFoundError':
                message = 'Không tìm thấy thiết bị media (microphone/camera)';
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

        this.endCall();
    }

    startCallTimer() {
        // Đảm bảo dừng timer cũ nếu có
        this.stopCallTimer();

        const timerElement = document.getElementById('callTimer');
        if (timerElement) {
            timerElement.style.display = 'inline';
            this.callDuration = 0;
            this.callTimer = setInterval(() => {
                this.updateCallTimer();
            }, 1000);
        }
    }

    stopCallTimer() {
        if (this.callTimer) {
            clearInterval(this.callTimer);
            this.callTimer = null;
        }
        const timerElement = document.getElementById('callTimer');
        if (timerElement) {
            timerElement.style.display = 'none';
            timerElement.textContent = '00:00';
        }
        this.callDuration = 0;
    }

    updateCallTimer() {
        const timerElement = document.getElementById('callTimer');
        if (!timerElement) return;

        this.callDuration++;
        const minutes = Math.floor(this.callDuration / 60);
        const seconds = this.callDuration % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    showNotification(message, type = 'info') {
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

    showModalGroup() {
        // Load danh sách thành viên trước khi hiển thị modal
        this.loadGroupMembers();
        
        // Hiển thị modal
        $("#createGroupModal").modal("show");

        // Xử lý sự kiện submit form tạo nhóm
        const createGroupForm = document.getElementById("createGroupForm");
        if (createGroupForm) {
            createGroupForm.onsubmit = (e) => {
                e.preventDefault();
                
                // Lấy tên nhóm
                const groupName = document.getElementById("groupName").value.trim();
                if (!groupName) {
                    alert("Vui lòng nhập tên nhóm!");
                    return;
                }

                // Lấy danh sách thành viên được chọn
                const selectedMembers = [];
                document.querySelectorAll('.group-member-checkbox:checked').forEach(checkbox => {
                    selectedMembers.push(checkbox.value);
                });

                if (selectedMembers.length === 0) {
                    alert("Vui lòng chọn ít nhất một thành viên!");
                    return;
                }

                // Thêm người tạo nhóm vào danh sách thành viên
                const currentUserId = document.getElementById("currentUser").value;
                if (!selectedMembers.includes(currentUserId)) {
                    selectedMembers.push(currentUserId);
                }

                // Gọi API tạo nhóm
                this.connection.invoke("CreateGroup", groupName, selectedMembers)
                    .then(() => {
                        console.log("Tạo nhóm thành công");
                        this.closeModalGroup();
                        // Reset form
                        createGroupForm.reset();
                        document.querySelectorAll('.group-member-checkbox').forEach(cb => cb.checked = false);
                    })
                    .catch(err => {
                        console.error("Lỗi khi tạo nhóm:", err);
                        alert("Có lỗi xảy ra khi tạo nhóm. Vui lòng thử lại!");
                    });
            };
        }
    }

    closeModalGroup() {
        // Đóng modal
        $("#createGroupModal").modal("hide");
        
        // Reset form
        const createGroupForm = document.getElementById("createGroupForm");
        if (createGroupForm) {
            createGroupForm.reset();
        }
        
        // Bỏ chọn tất cả các checkbox thành viên
        document.querySelectorAll('.group-member-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Xóa danh sách thành viên
        const membersList = document.querySelector(".group-members-list");
        if (membersList) {
            membersList.innerHTML = "";
        }
    }

    async startCall(receiverId) {
        try {
            console.log("Bắt đầu cuộc gọi đến:", receiverId);

            if (this.currentCallState !== CallState.IDLE) {
                throw new Error("Đang trong cuộc gọi khác");
            }

            // Cập nhật trạng thái
            this.updateCallState(CallState.CALLING);
            this.currentCallerId = document.getElementById("currentUser").value;

            // Lấy cấu hình ICE servers từ Twilio
            let configuration;
            try {
                const response = await fetch('/Chat/GetTwilioToken');
                if (!response.ok) {
                    throw new Error('Không thể lấy cấu hình ICE servers từ Twilio');
                }
                const data = await response.json();
                configuration = {
                    iceServers: [
                        ...(data.iceServers || []),
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:stun2.l.google.com:19302' },
                        { urls: 'stun:stun3.l.google.com:19302' },
                        { urls: 'stun:stun4.l.google.com:19302' }
                    ],
                    iceCandidatePoolSize: 10,
                    bundlePolicy: 'max-bundle',
                    rtcpMuxPolicy: 'require',
                    iceTransportPolicy: 'all'
                };
                console.log("Đã nhận cấu hình ICE servers:", configuration);
            } catch (error) {
                console.warn("Lỗi khi lấy Twilio ICE servers, sử dụng Google STUN:", error);
                configuration = {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:stun2.l.google.com:19302' }
                    ],
                    iceCandidatePoolSize: 10,
                    bundlePolicy: 'max-bundle',
                    rtcpMuxPolicy: 'require'
                };
            }

            this.peerConnection = new RTCPeerConnection(configuration);
            console.log("Khởi tạo peer connection với cấu hình:", configuration);

            // Thiết lập local stream
            const mediaStream = await this.setupMediaStream();
            
            // Thêm transceivers cho audio và video
            this.peerConnection.addTransceiver('audio', {
                direction: 'sendrecv',
                streams: [mediaStream]
            });
            this.peerConnection.addTransceiver('video', {
                direction: 'sendrecv',
                streams: [mediaStream]
            });

            // Thêm tracks vào peer connection
            mediaStream.getTracks().forEach(track => {
                console.log("Thêm local track:", track.kind);
                this.peerConnection.addTrack(track, mediaStream);
            });

            // Hiển thị local video
            const localVideoElement = document.getElementById("localVideo");
            if (localVideoElement) {
                localVideoElement.srcObject = mediaStream;
                await this.safePlay(localVideoElement);
            }

            // Lắng nghe sự kiện ICE candidate
            this.peerConnection.addEventListener('icecandidate', async event => {
                if (event.candidate) {
                    console.log("Gửi ICE candidate đến:", receiverId);
                    await this.sendCallSignal(receiverId, "candidate", event.candidate);
                }
            });

            // Lắng nghe sự kiện kết nối thay đổi
            this.peerConnection.addEventListener('connectionstatechange', async event => {
                console.log("Connection state changed:", this.peerConnection.connectionState);
                if (this.peerConnection.connectionState === 'connected') {
                    console.log("Peers connected successfully!");
                    this.showNotification('Kết nối thành công!', 'success');
                    document.getElementById("connectionStatus").style.display = 'none';
                }
            });

            // Lắng nghe remote tracks
            this.peerConnection.addEventListener('track', async event => {
                console.log("Nhận được remote track:", event.track.kind);
                const remoteVideo = document.getElementById("remoteVideo");
                if (remoteVideo) {
                    await this.handleRemoteStream(event, remoteVideo);
                }
            });

            // Tạo và gửi offer
            const offer = await this.peerConnection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });
            await this.peerConnection.setLocalDescription(offer);
            
            this.sendCallSignal(receiverId, "offer", {
                type: 'offer',
                sdp: offer.sdp,
                senderName: document.getElementById("currentUser").getAttribute("data-username")
            });

            // Hiển thị UI
            this.showModal();
            document.getElementById("call-interface").style.display = 'block';
            document.getElementById("connectionStatus").style.display = 'block';
            document.getElementById("statusMessage").textContent = 'Đang kết nối cuộc gọi...';

            // Set timeout
            setTimeout(() => {
                if (this.currentCallState === CallState.CALLING) {
                    this.sendCallSignal(receiverId, "timeout", null);
                    this.endCall();
                }
            }, this.CALL_TIMEOUT);

        } catch (error) {
            console.error("Lỗi khi bắt đầu cuộc gọi:", error);
            this.handleCallError(error, 'startCall');
        }
    }

    async safePlay(videoElement) {
        try {
            // Đợi một frame animation để đảm bảo DOM đã được cập nhật
            await new Promise(resolve => requestAnimationFrame(resolve));
            
            if (!videoElement.srcObject) {
                console.warn('Video element không có srcObject');
                return false;
            }

            await videoElement.play();
            return true;
        } catch (error) {
            if (error.name === 'AbortError') {
                // Thử lại sau 100ms nếu bị gián đoạn
                await new Promise(resolve => setTimeout(resolve, 100));
                try {
                    await videoElement.play();
                    return true;
                } catch (retryError) {
                    console.error('Không thể phát video sau khi thử lại:', retryError);
                    return false;
                }
            }
            console.error('Lỗi khi phát video:', error);
            return false;
        }
    }

    async setupMediaStream() {
        try {
            console.log("Bắt đầu thiết lập media stream...");
            
            // Kiểm tra thiết bị trước khi yêu cầu quyền truy cập
            const devices = await navigator.mediaDevices.enumerateDevices();
            const cameras = devices.filter(device => device.kind === 'videoinput');
            const microphones = devices.filter(device => device.kind === 'audioinput');
            
            console.log('Thiết bị có sẵn:', {
                cameras: cameras.length,
                microphones: microphones.length
            });

            if (microphones.length === 0) {
                this.showNotification('Không tìm thấy microphone. Vui lòng kết nối microphone và thử lại.', 'error');
                throw new Error('Không tìm thấy thiết bị âm thanh');
            }

            // Thử với video trước
            let stream;
            try {
                if (cameras.length > 0) {
                    stream = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            deviceId: microphones[0].deviceId,
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true
                        },
                        video: {
                            deviceId: cameras[0].deviceId,
                            width: { ideal: 640, max: 1280 },
                            height: { ideal: 480, max: 720 },
                            frameRate: { ideal: 30, max: 60 }
                        }
                    });
                    console.log('Đã thiết lập stream video và audio thành công');
                } else {
                    console.log('Không tìm thấy camera, chuyển sang chế độ audio only');
                    this.showNotification('Không tìm thấy camera, chuyển sang chế độ audio only', 'warning');
                    stream = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            deviceId: microphones[0].deviceId,
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true
                        }
                    });
                }
            } catch (error) {
                console.error('Lỗi khi thiết lập media stream:', error);
                
                if (error.name === 'NotAllowedError') {
                    this.showNotification('Vui lòng cho phép truy cập microphone/camera trong trình duyệt của bạn', 'error');
                    throw error;
                }
                
                // Thử lại với audio only nếu video thất bại
                console.log('Thử lại với audio only...');
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        deviceId: microphones[0].deviceId,
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });
            }

            // Kiểm tra và log thông tin về tracks
            const videoTracks = stream.getVideoTracks();
            const audioTracks = stream.getAudioTracks();
            
            console.log('Stream tracks:', {
                video: videoTracks.map(track => ({
                    label: track.label,
                    enabled: track.enabled,
                    muted: track.muted
                })),
                audio: audioTracks.map(track => ({
                    label: track.label,
                    enabled: track.enabled,
                    muted: track.muted
                }))
            });

            // Thêm listeners cho tracks
            [...videoTracks, ...audioTracks].forEach(track => {
                track.onended = () => {
                    console.log(`${track.kind} track ended:`, track.label);
                    this.showNotification(`${track.kind === 'video' ? 'Camera' : 'Microphone'} đã bị ngắt kết nối. Vui lòng kiểm tra thiết bị.`, 'warning');
                };
                track.onmute = () => {
                    console.log(`${track.kind} track muted:`, track.label);
                };
                track.onunmute = () => {
                    console.log(`${track.kind} track unmuted:`, track.label);
                };
            });

            return stream;
        } catch (error) {
            console.error('Lỗi khi thiết lập media stream:', error);
            this.showNotification('Không thể thiết lập kết nối audio/video. Vui lòng kiểm tra thiết bị và quyền truy cập.', 'error');
            throw error;
        }
    }

    sendCallSignal(receiverId, signalType, signalData) {
        console.log("Gửi tín hiệu cuộc gọi:", { receiverId, signalType, signalData });

        // Lấy thông tin người gửi
        const senderId = document.getElementById("currentUser").value;
        const senderName = document.getElementById("currentUser").getAttribute("data-username");

        // Gửi tín hiệu đến server
        return this.connection.invoke("SendCallSignal", senderId, receiverId, signalType, signalData)
            .then(() => {
                console.log("✅ Tín hiệu cuộc gọi đã được gửi thành công");
            })
            .catch(err => {
                console.error("❌ Lỗi gửi tín hiệu cuộc gọi:", err);
                this.handleCallError(err, 'sendCallSignal');
            });
    }

    async handleRemoteStream(event, remoteVideo) {
        if (remoteVideo && event.streams && event.streams[0]) {
            const stream = event.streams[0];
            
            try {
                console.log('Xử lý remote stream mới');
                
                // Log chi tiết về stream và tracks
                const streamInfo = {
                    id: stream.id,
                    active: stream.active,
                    tracks: stream.getTracks().map(track => ({
                        kind: track.kind,
                        id: track.id,
                        enabled: track.enabled,
                        muted: track.muted,
                        readyState: track.readyState,
                        settings: track.getSettings()
                    }))
                };
                console.log('Chi tiết remote stream:', streamInfo);

                // Dừng stream cũ nếu có
                if (remoteVideo.srcObject) {
                    remoteVideo.srcObject.getTracks().forEach(track => track.stop());
                }
                
                // Đợi một chút trước khi set srcObject mới
                remoteVideo.srcObject = null;
                await new Promise(resolve => setTimeout(resolve, 100));

                // Đảm bảo video element đã được load
                await new Promise((resolve, reject) => {
                    remoteVideo.onloadedmetadata = resolve;
                    remoteVideo.onerror = reject;
                    remoteVideo.srcObject = stream;
                });
                
                // Kiểm tra và kích hoạt video track
                const videoTracks = stream.getVideoTracks();
                const audioTracks = stream.getAudioTracks();
                const hasVideoTrack = videoTracks.length > 0;
                const hasAudioTrack = audioTracks.length > 0;
                
                console.log('Remote stream tracks:', {
                    hasVideo: hasVideoTrack,
                    hasAudio: hasAudioTrack,
                    videoTracks: videoTracks.map(track => ({
                        label: track.label,
                        enabled: track.enabled,
                        settings: track.getSettings()
                    })),
                    audioTracks: audioTracks.map(track => ({
                        label: track.label,
                        enabled: track.enabled
                    }))
                });

                // Xử lý video tracks
                if (hasVideoTrack) {
                    videoTracks.forEach(track => {
                        track.enabled = true;
                        
                        track.onmute = () => {
                            console.log('Video track bị mute:', track.label);
                            this.showNotification('Video của người dùng khác đã bị tắt', 'info');
                            this.updateRemoteVideoUI(false);
                        };
                        
                        track.onunmute = () => {
                            console.log('Video track được unmute:', track.label);
                            this.showNotification('Video của người dùng khác đã được bật', 'info');
                            this.updateRemoteVideoUI(true);
                        };
                        
                        track.onended = () => {
                            console.log('Video track kết thúc:', track.label);
                            this.showNotification('Kết nối video đã bị ngắt', 'warning');
                            this.updateRemoteVideoUI(false);
                        };
                    });

                    // Thiết lập style cho video element
                    this.updateRemoteVideoUI(true);
                } else {
                    console.log('Không có video track, chuyển sang chế độ audio only');
                    this.updateRemoteVideoUI(false);
                }

                // Xử lý audio tracks
                if (hasAudioTrack) {
                    audioTracks.forEach(track => {
                        track.enabled = true;
                        
                        track.onmute = () => {
                            console.log('Audio track bị mute:', track.label);
                            this.showNotification('Âm thanh của người dùng khác đã bị tắt', 'info');
                            this.updateRemoteAudioUI(false);
                        };
                        
                        track.onunmute = () => {
                            console.log('Audio track được unmute:', track.label);
                            this.showNotification('Âm thanh của người dùng khác đã được bật', 'info');
                            this.updateRemoteAudioUI(true);
                        };
                    });
                } else {
                    console.log('Không có audio track');
                    this.showNotification('Không có âm thanh từ người dùng khác', 'warning');
                    this.updateRemoteAudioUI(false);
                }

                // Đảm bảo audio được xử lý đúng
                remoteVideo.muted = this.isSpeakerMuted;

                // Thử phát video
                try {
                    await remoteVideo.play();
                    console.log('Remote video đã bắt đầu phát');
                } catch (playError) {
                    console.error('Lỗi khi phát remote video:', playError);
                    if (playError.name === 'NotAllowedError') {
                        this.showNotification('Vui lòng cho phép tự động phát video', 'warning');
                    }
                }

                // Kiểm tra kết nối sau khi thiết lập
                this.checkStreamConnection(stream);

            } catch (error) {
                console.error("Lỗi khi xử lý remote stream:", error);
                this.handleCallError(error, 'handleRemoteStream');
            }
        } else {
            console.error("Không nhận được remote stream hoặc video element không tồn tại");
            this.showNotification('Không thể hiển thị video từ người dùng khác', 'error');
        }
    }

    updateRemoteVideoUI(hasVideo) {
        const remoteVideo = document.getElementById("remoteVideo");
        const remoteWrapper = remoteVideo?.closest('.remote-video-wrapper');
        const audioOnlyIcon = document.getElementById('remoteAudioOnlyIcon');
        
        if (remoteVideo && remoteWrapper) {
            if (hasVideo) {
                remoteVideo.style.display = 'block';
                remoteVideo.style.width = '100%';
                remoteVideo.style.height = '100%';
                remoteVideo.style.objectFit = 'contain';
                remoteWrapper.style.backgroundColor = '#000';
                if (audioOnlyIcon) audioOnlyIcon.style.display = 'none';
            } else {
                remoteVideo.style.display = 'none';
                remoteWrapper.style.backgroundColor = '#2f3136';
                if (audioOnlyIcon) {
                    audioOnlyIcon.style.display = 'flex';
                    audioOnlyIcon.innerHTML = '<i class="fas fa-microphone fa-3x"></i>';
                }
            }
        }
    }

    updateRemoteAudioUI(hasAudio) {
        const remoteAudioIndicator = document.getElementById('remoteAudioIndicator');
        if (remoteAudioIndicator) {
            remoteAudioIndicator.innerHTML = hasAudio ? 
                '<i class="fas fa-volume-up"></i>' : 
                '<i class="fas fa-volume-mute"></i>';
        }
    }

    checkStreamConnection(stream) {
        // Kiểm tra kết nối mỗi 5 giây
        const checkInterval = setInterval(() => {
            const activeTracks = stream.getTracks().filter(track => track.readyState === 'live');
            
            if (activeTracks.length === 0) {
                console.log('Tất cả tracks đã ngắt kết nối');
                this.showNotification('Kết nối với người dùng khác đã bị mất', 'error');
                clearInterval(checkInterval);
                this.endCall();
                return;
            }

            console.log('Trạng thái tracks:', activeTracks.map(track => ({
                kind: track.kind,
                readyState: track.readyState,
                enabled: track.enabled
            })));
        }, 5000);

        // Lưu interval để có thể clear khi kết thúc cuộc gọi
        this.connectionCheckInterval = checkInterval;
    }

    toggleMic() {
        try {
            // Đảo ngược trạng thái mic
            this.isMicMuted = !this.isMicMuted;

            // Cập nhật UI button
            const toggleMicButton = document.getElementById("toggleMicButton");
            if (toggleMicButton) {
                toggleMicButton.innerHTML = this.isMicMuted
                    ? '<i class="fas fa-microphone-slash"></i>'
                    : '<i class="fas fa-microphone"></i>';
                toggleMicButton.setAttribute('title', this.isMicMuted ? 'Bật mic' : 'Tắt mic');
            }

            // Cập nhật trạng thái mic cho tất cả audio tracks trong peer connection
            if (this.peerConnection) {
                const senders = this.peerConnection.getSenders();
                const audioSenders = senders.filter(sender => sender.track && sender.track.kind === 'audio');
                
                if (audioSenders.length === 0) {
                    console.log('Không tìm thấy audio tracks trong peer connection');
                    this.showNotification('Không tìm thấy microphone', 'warning');
                    return;
                }

                audioSenders.forEach(sender => {
                    if (sender.track) {
                        sender.track.enabled = !this.isMicMuted;
                    }
                });
            }

            // Cập nhật trạng thái mic cho local stream
            const localVideo = document.getElementById("localVideo");
            if (localVideo && localVideo.srcObject) {
                const audioTracks = localVideo.srcObject.getAudioTracks();
                
                if (audioTracks.length === 0) {
                    console.log('Không tìm thấy audio tracks trong local stream');
                    this.showNotification('Không tìm thấy microphone', 'warning');
                    return;
                }

                audioTracks.forEach(track => {
                    track.enabled = !this.isMicMuted;
                });
            }

            // Hiển thị thông báo
            this.showNotification(
                this.isMicMuted ? 'Đã tắt mic' : 'Đã bật mic',
                'info'
            );

            console.log('Trạng thái mic:', this.isMicMuted ? 'Đã tắt' : 'Đã bật');
        } catch (error) {
            console.error('Lỗi khi thay đổi trạng thái mic:', error);
            this.handleCallError(error, 'toggleMic');
        }
    }

    toggleSpeaker() {
        try {
            // Đảo ngược trạng thái loa
            this.isSpeakerMuted = !this.isSpeakerMuted;

            // Cập nhật UI button
            const toggleSpeakerButton = document.getElementById("toggleSpeakerButton");
            if (toggleSpeakerButton) {
                toggleSpeakerButton.innerHTML = this.isSpeakerMuted
                    ? '<i class="fas fa-volume-mute"></i>'
                    : '<i class="fas fa-volume-up"></i>';
                toggleSpeakerButton.setAttribute('title', this.isSpeakerMuted ? 'Bật loa' : 'Tắt loa');
            }

            // Cập nhật âm thanh cho remote video
            const remoteVideo = document.getElementById("remoteVideo");
            if (remoteVideo) {
                remoteVideo.muted = this.isSpeakerMuted;

                // Kiểm tra xem có audio tracks không
                if (remoteVideo.srcObject) {
                    const audioTracks = remoteVideo.srcObject.getAudioTracks();
                    if (audioTracks.length === 0) {
                        console.log('Không có audio tracks trong remote stream');
                        this.showNotification('Không có âm thanh từ người dùng khác', 'warning');
                        return;
                    }
                }
            }

            // Hiển thị thông báo
            this.showNotification(
                this.isSpeakerMuted ? 'Đã tắt loa' : 'Đã bật loa',
                'info'
            );

            console.log('Trạng thái loa:', this.isSpeakerMuted ? 'Đã tắt' : 'Đã bật');
        } catch (error) {
            console.error('Lỗi khi thay đổi trạng thái loa:', error);
            this.handleCallError(error, 'toggleSpeaker');
        }
    }
}

// Khởi tạo class khi tài liệu sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
    new Chat();
});