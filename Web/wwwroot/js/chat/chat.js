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
        this.connection = new signalR.HubConnectionBuilder().withUrl("/chatHub").build();
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
        this.MAX_RECONNECT_ATTEMPTS = 3;
        this.CALL_TIMEOUT = 30000;
        this.pendingCandidates = []; // Thêm mảng để lưu trữ các candidates đang chờ

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
                    // Đảm bảo kết thúc cuộc gọi cho cả hai bên
                    this.closeModal();
                    this.updateCallState(CallState.ENDING);
                    
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
                    
                    // Cập nhật UI
                    document.getElementById("connectionStatus").style.display = 'none';
                    document.getElementById("call-interface").style.display = 'none';
                    document.getElementById("incoming-call").style.display = 'none';
                    
                    // Hiển thị thông báo
                    this.showNotification('Cuộc gọi đã kết thúc', 'info');
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
            console.log("Answer data:", answerData);

            if (!this.peerConnection) {
                console.error("Không có peer connection");
                return;
            }

            const answerDesc = new RTCSessionDescription({
                type: 'answer',
                sdp: answerData.sdp
            });

            await this.peerConnection.setRemoteDescription(answerDesc);
            console.log("Đã set remote description từ answer");

            // Xử lý các pending candidates sau khi set remote description
            if (this.pendingCandidates.length > 0) {
                console.log("Xử lý", this.pendingCandidates.length, "ICE candidates đang chờ");
                for (const pendingCandidate of this.pendingCandidates) {
                    if (pendingCandidate.senderId === senderId) {
                        try {
                            await this.peerConnection.addIceCandidate(
                                new RTCIceCandidate(pendingCandidate.candidate)
                            );
                            console.log("Đã thêm pending ICE candidate thành công");
                        } catch (error) {
                            console.error("Lỗi khi thêm pending ICE candidate:", error);
                        }
                    }
                }
                this.pendingCandidates = []; // Xóa các candidates đã xử lý
            }

            // Cập nhật UI cho người gọi
            document.getElementById("call-interface").style.display = 'block';
            document.getElementById("connectionStatus").style.display = 'none';
            document.getElementById("incoming-call").style.display = 'none';

            // Cập nhật trạng thái cuộc gọi
            this.updateCallState(CallState.IN_CALL);
            this.startCallTimer();

        } catch (error) {
            console.error("Lỗi khi xử lý answer:", error);
            this.handleCallError(error, 'handleCallAnswer');
        }
    }

    async handleIncomingCall(senderId, offerData) {
        console.log("Xử lý cuộc gọi đến từ:", senderId, "State hiện tại:", this.currentCallState);
        console.log("Offer data received:", offerData);

        try {
            // Clear any existing timeout
            if (this.incomingCallTimeout) {
                clearTimeout(this.incomingCallTimeout);
                this.incomingCallTimeout = null;
            }

            // Cập nhật UI cuộc gọi đến
            let callerName = offerData.senderName ?? "Unknown User";
            document.getElementById("callerName").textContent = callerName;
            
            // Hiển thị giao diện cuộc gọi đến
            document.getElementById("incoming-call").style.display = 'block';
            document.getElementById("call-interface").style.display = 'none';
            document.getElementById("connectionStatus").style.display = 'none';
            document.getElementById("acceptCallButton").style.display = 'inline-block';
            document.getElementById("rejectCallButton").style.display = 'inline-block';
            this.showModal();

            this.updateCallState(CallState.CALLING);
            this.callAccepted = false;

            // Cập nhật bộ đếm thời gian
            let timeoutCounter = 30;
            const timeoutElement = document.getElementById('timeoutCounter');
            
            // Set timeout mới
            this.incomingCallTimeout = setTimeout(() => {
                if (!this.callAccepted) {
                    console.log("Cuộc gọi hết thời gian chờ");
                    this.sendCallSignal(senderId, "timeout", null);
                    this.closeModal();
                    this.updateCallState(CallState.IDLE);
                    this.currentCallerId = null;
                }
            }, this.CALL_TIMEOUT);

            // Cập nhật UI đếm ngược
            const countdownInterval = setInterval(() => {
                if (!this.callAccepted && timeoutCounter > 0) {
                    timeoutCounter--;
                    if (timeoutElement) {
                        timeoutElement.textContent = timeoutCounter;
                    }
                } else {
                    clearInterval(countdownInterval);
                }
            }, 1000);

            // Xóa event listeners cũ
            const acceptButton = document.getElementById("acceptCallButton");
            const rejectButton = document.getElementById("rejectCallButton");
            
            const newAcceptButton = acceptButton.cloneNode(true);
            const newRejectButton = rejectButton.cloneNode(true);
            
            acceptButton.parentNode.replaceChild(newAcceptButton, acceptButton);
            rejectButton.parentNode.replaceChild(newRejectButton, rejectButton);

            // Thêm event listeners mới
            newAcceptButton.addEventListener("click", async () => {
                try {
                    console.log("Chấp nhận cuộc gọi từ:", senderId);
                    if (!this.callAccepted) {
                        clearTimeout(this.incomingCallTimeout);
                        clearInterval(countdownInterval);
                        this.callAccepted = true;

                        // Khởi tạo peer connection trước khi xử lý offer
                        await this.initializePeerConnection(senderId);

                        // Set remote description từ offer
                        if (offerData && offerData.type === 'offer' && offerData.sdp) {
                            console.log("Setting remote description from offer");
                            const offerDesc = new RTCSessionDescription({
                                type: 'offer',
                                sdp: offerData.sdp
                            });
                            
                            await this.peerConnection.setRemoteDescription(offerDesc);
                            
                            // Tạo answer với transceivers cho cả audio và video
                            const answer = await this.peerConnection.createAnswer();
                            
                            // Set local description
                            console.log("Setting local description");
                            await this.peerConnection.setLocalDescription(answer);
                            
                            // Gửi answer
                            console.log("Sending answer");
                            await this.sendCallSignal(senderId, "answer", {
                                type: 'answer',
                                sdp: answer.sdp
                            });

                            // Cập nhật UI
                            document.getElementById("incoming-call").style.display = 'none';
                            document.getElementById("call-interface").style.display = 'block';
                            document.getElementById("connectionStatus").style.display = 'block';
                            document.getElementById("statusMessage").textContent = 'Đang thiết lập kết nối...';

                            // Cập nhật trạng thái cuộc gọi
                            this.updateCallState(CallState.IN_CALL);
                            this.currentCallerId = senderId;
                        } else {
                            throw new Error("Invalid offer data received");
                        }
                    }
                } catch (error) {
                    console.error("Lỗi khi chấp nhận cuộc gọi:", error);
                    this.handleCallError(error, 'acceptCall');
                }
            });

            newRejectButton.addEventListener("click", () => {
                console.log("Từ chối cuộc gọi từ:", senderId);
                clearTimeout(this.incomingCallTimeout);
                clearInterval(countdownInterval);
                this.sendCallSignal(senderId, "reject", null);
                this.closeModal();
                this.updateCallState(CallState.IDLE);
                this.currentCallerId = null;
            });

        } catch (error) {
            console.error("Lỗi khi xử lý cuộc gọi đến:", error);
            this.handleCallError(error, 'handleIncomingCall');
            this.closeModal();
        }
    }

    async handleReconnectOffer(senderId, offerData) {
        try {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offerData));
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            this.sendCallSignal(senderId, "answer", {
                type: 'answer',
                sdp: answer.sdp,
                senderName: document.getElementById("currentUser").getAttribute("data-username")
            });
        } catch (error) {
            console.error("Lỗi khi xử lý reconnect offer:", error);
            this.endCall();
        }
    }

    sendCallSignal(receiverId, signalType, signalData) {
        console.log("Gửi tín hiệu cuộc gọi:", { receiverId, signalType, signalData });

        // Lấy thông tin người gửi
        const senderId = document.getElementById("currentUser").value;
        const senderName = document.getElementById("currentUser").getAttribute("data-username");

        // Gửi tín hiệu đến server
        this.connection.invoke("SendCallSignal", senderId, receiverId, signalType, signalData)
            .then(() => {
                console.log("✅ Tín hiệu cuộc gọi đã được gửi thành công");
            })
            .catch(err => {
                console.error("❌ Lỗi gửi tín hiệu cuộc gọi:", err);
                this.handleCallError(err, 'sendCallSignal');
            });
    }

    async setupMediaStream() {
        try {
            console.log("Bắt đầu thiết lập media stream...");
            
            // Kiểm tra thiết bị
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasVideo = devices.some(device => device.kind === 'videoinput');
            const hasAudio = devices.some(device => device.kind === 'audioinput');
            console.log('Có camera:', hasVideo);
            console.log('Có microphone:', hasAudio);

            if (!hasAudio) {
                throw new Error('Không tìm thấy microphone');
            }

            // Thiết lập constraints dựa trên thiết bị có sẵn
            const constraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true
                },
                video: hasVideo ? {
                    width: { ideal: 640, max: 1280 },
                    height: { ideal: 480, max: 720 }
                } : false
            };

            // Lấy stream
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('Đã lấy được stream với:', {
                audio: stream.getAudioTracks().length > 0,
                video: stream.getVideoTracks().length > 0
            });

            // Hiển thị thông báo nếu không có video
            if (!hasVideo) {
                this.showNotification('Chuyển sang gọi audio', 'info');
                
                // Cập nhật UI cho cuộc gọi audio
                const localVideo = document.getElementById("localVideo");
                const remoteVideo = document.getElementById("remoteVideo");
                
                if (localVideo) {
                    localVideo.style.backgroundColor = '#000000';
                }
                if (remoteVideo) {
                    remoteVideo.style.backgroundColor = '#000000';
                }
            }

            return stream;
        } catch (error) {
            console.error('Lỗi khi lấy media stream:', error);
            
            // Nếu lỗi video, thử lại với chỉ audio
            if (error.name === 'NotFoundError' || error.name === 'NotAllowedError' || error.name === 'OverconstrainedError') {
                try {
                    const audioStream = await navigator.mediaDevices.getUserMedia({ 
                        audio: {
                            echoCancellation: true,
                            noiseSuppression: true
                        }
                    });
                    console.log('Đã kết nối với audio');
                    this.showNotification('Đã chuyển sang gọi audio', 'info');
                    
                    // Cập nhật UI cho cuộc gọi audio
                    const localVideo = document.getElementById("localVideo");
                    const remoteVideo = document.getElementById("remoteVideo");
                    
                    if (localVideo) {
                        localVideo.style.backgroundColor = '#000000';
                    }
                    if (remoteVideo) {
                        remoteVideo.style.backgroundColor = '#000000';
                    }
                    
                    return audioStream;
                } catch (audioError) {
                    console.error('Không thể kết nối audio:', audioError);
                    throw new Error('Không thể kết nối với thiết bị âm thanh');
                }
            }
            throw error;
        }
    }

    async safePlay(videoElement) {
        try {
            // Đợi một frame animation để đảm bảo DOM đã được cập nhật
            await new Promise(resolve => requestAnimationFrame(resolve));
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

    async handleRemoteStream(event, remoteVideo) {
        if (remoteVideo && event.streams && event.streams[0]) {
            const stream = event.streams[0];
            
            try {
                // Log chi tiết về stream và tracks
                const streamInfo = {
                    hasAudioTracks: stream.getAudioTracks().length,
                    hasVideoTracks: stream.getVideoTracks().length,
                    tracks: stream.getTracks().map(track => ({
                        kind: track.kind,
                        enabled: track.enabled,
                        muted: track.muted,
                        readyState: track.readyState,
                        id: track.id
                    }))
                };
                console.log('Chi tiết remote stream:', streamInfo);

                // Dừng stream cũ nếu có
                if (remoteVideo.srcObject) {
                    remoteVideo.srcObject.getTracks().forEach(track => track.stop());
                }
                
                // Gán stream mới và đảm bảo thuộc tính srcObject được set đúng
                remoteVideo.srcObject = null;
                await new Promise(resolve => setTimeout(resolve, 100));
                remoteVideo.srcObject = stream;
                
                // Kiểm tra xem có video track không
                const hasVideoTrack = stream.getVideoTracks().length > 0;
                console.log('Remote stream có video track:', hasVideoTrack);
                
                // Thiết lập style cho video element
                remoteVideo.style.display = 'block';
                remoteVideo.style.backgroundColor = '#000000';
                
                if (hasVideoTrack) {
                    remoteVideo.style.width = '100%';
                    remoteVideo.style.height = '100%';
                    remoteVideo.style.objectFit = 'contain';
                    
                    // Đảm bảo video track được kích hoạt
                    stream.getVideoTracks().forEach(track => {
                        track.enabled = true;
                        console.log('Video track settings:', track.getSettings());
                    });
                }
                
                // Xử lý icon audio only
                const audioOnlyIcon = document.getElementById('audioOnlyIcon');
                if (audioOnlyIcon) {
                    if (!hasVideoTrack) {
                        audioOnlyIcon.innerHTML = '<i class="fas fa-microphone fa-3x"></i>';
                        audioOnlyIcon.style.display = 'flex';
                        audioOnlyIcon.style.position = 'absolute';
                        audioOnlyIcon.style.top = '50%';
                        audioOnlyIcon.style.left = '50%';
                        audioOnlyIcon.style.transform = 'translate(-50%, -50%)';
                        audioOnlyIcon.style.color = '#ffffff';
                        audioOnlyIcon.style.zIndex = '1';
                    } else {
                        audioOnlyIcon.style.display = 'none';
                    }
                }

                // Đảm bảo audio được xử lý đúng
                remoteVideo.muted = this.isSpeakerMuted;
                
                // Thêm event listeners cho video element
                remoteVideo.onloadedmetadata = () => {
                    console.log('Video metadata loaded:', {
                        videoWidth: remoteVideo.videoWidth,
                        videoHeight: remoteVideo.videoHeight,
                        readyState: remoteVideo.readyState
                    });
                };
                
                remoteVideo.onplay = () => {
                    console.log('Video bắt đầu phát');
                };

                // Thử phát video
                try {
                    await remoteVideo.play();
                    console.log('Remote video đã bắt đầu phát thành công');
                    
                    // Ẩn thông báo "đang kết nối" khi stream đã phát được
                    document.getElementById("connectionStatus").style.display = 'none';
                    
                    // Log thông tin về tracks đang hoạt động
                    stream.getTracks().forEach(track => {
                        console.log(`Track ${track.kind} đang hoạt động:`, {
                            enabled: track.enabled,
                            muted: track.muted,
                            readyState: track.readyState,
                            constraints: track.getConstraints(),
                            settings: track.getSettings()
                        });
                    });

                    // Thêm event listeners cho tracks
                    stream.getTracks().forEach(track => {
                        track.onended = () => {
                            console.log(`${track.kind} track đã kết thúc`);
                        };
                        track.onmute = () => {
                            console.log(`${track.kind} track đã bị mute`);
                        };
                        track.onunmute = () => {
                            console.log(`${track.kind} track đã được unmute`);
                        };
                    });
                } catch (playError) {
                    console.error('Lỗi khi phát remote video:', playError);
                    
                    // Thử lại sau 1 giây
                    setTimeout(async () => {
                        try {
                            await remoteVideo.play();
                            console.log('Remote video đã phát thành công sau khi thử lại');
                        } catch (retryError) {
                            console.error('Vẫn không thể phát remote video sau khi thử lại:', retryError);
                            this.showNotification('Không thể phát video từ người dùng khác', 'warning');
                        }
                    }, 1000);
                }
            } catch (error) {
                console.error("Lỗi khi xử lý remote stream:", error);
                this.handleCallError(error, 'handleRemoteStream');
            }
        } else {
            console.error("Không nhận được remote stream hoặc video element không tồn tại");
        }
    }

    async initializePeerConnection(senderId) {
        try {
            if (this.peerConnection) {
                this.peerConnection.close();
                this.peerConnection = null;
            }

            // Lấy cấu hình ICE servers từ Twilio
            const twilioResponse = await fetch('/Chat/GetTwilioToken');
            if (!twilioResponse.ok) {
                throw new Error('Không thể lấy được cấu hình Twilio');
            }
            const twilioData = await twilioResponse.json();

            const configuration = {
                iceServers: twilioData.iceServers,
                iceTransportPolicy: 'all', // Cho phép tất cả các loại kết nối
                bundlePolicy: 'max-bundle',
                rtcpMuxPolicy: 'require',
                iceCandidatePoolSize: 1, // Tăng pool size để cải thiện tốc độ
                sdpSemantics: 'unified-plan'
            };

            this.peerConnection = new RTCPeerConnection(configuration);
            console.log("Khởi tạo peer connection với cấu hình:", configuration);

            // Thêm log để theo dõi candidate types
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log("ICE candidate:", {
                        type: event.candidate.type,
                        protocol: event.candidate.protocol,
                        address: event.candidate.address,
                        port: event.candidate.port
                    });
                    this.sendCallSignal(senderId, "candidate", event.candidate);
                }
            };

            // Log chi tiết về gathering state
            this.peerConnection.onicegatheringstatechange = () => {
                console.log("ICE gathering state:", this.peerConnection.iceGatheringState);
                if (this.peerConnection.iceGatheringState === 'complete') {
                    console.log("Tất cả ICE candidates đã được thu thập");
                }
            };

            // Xử lý kết nối state
            this.peerConnection.oniceconnectionstatechange = () => {
                const state = this.peerConnection.iceConnectionState;
                console.log("ICE connection state:", state);
                
                switch (state) {
                    case 'checking':
                        document.getElementById("connectionStatus").style.display = 'block';
                        document.getElementById("statusMessage").textContent = 'Đang thiết lập kết nối...';
                        break;

                    case 'connected':
                    case 'completed':
                        // Cập nhật UI cho cả hai bên
                        document.getElementById("connectionStatus").style.display = 'none';
                        document.getElementById("call-interface").style.display = 'block';
                        this.reconnectAttempts = 0;
                        this.updateCallState(CallState.IN_CALL);
                        this.startCallTimer();

                        // Gửi tín hiệu xác nhận kết nối thành công
                        if (this.currentCallerId) {
                            this.sendCallSignal(this.currentCallerId === senderId ? 
                                document.getElementById("selectedUser").value : senderId, 
                                "connection_established", 
                                { state: 'connected' }
                            );
                        }
                        break;

                    case 'disconnected':
                        console.log("Kết nối bị gián đoạn");
                        document.getElementById("connectionStatus").style.display = 'block';
                        document.getElementById("statusMessage").textContent = 'Kết nối không ổn định...';
                        
                        // Thử kết nối lại nhiều lần với thời gian chờ tăng dần
                        if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
                            const delay = (this.reconnectAttempts + 1) * 2000; // 2s, 4s, 6s
                            this.showNotification(`Đang thử kết nối lại (lần ${this.reconnectAttempts + 1})...`, 'warning');
                            
                            setTimeout(async () => {
                                if (this.peerConnection?.iceConnectionState === 'disconnected') {
                                    this.reconnectAttempts++;
                                    await this.restartIce();
                                }
                            }, delay);
                        } else {
                            // Nếu đã thử kết nối lại nhiều lần không thành công
                            this.showNotification('Không thể thiết lập lại kết nối sau nhiều lần thử', 'error');
                            setTimeout(() => this.endCall(), 2000);
                        }
                        break;

                    case 'failed':
                        console.log("Kết nối thất bại");
                        if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
                            this.showNotification('Kết nối cuộc gọi thất bại', 'error');
                            this.endCall();
                        } else {
                            // Vẫn còn cơ hội thử kết nối lại
                            this.reconnectAttempts++;
                            this.showNotification(`Đang thử kết nối lại (lần ${this.reconnectAttempts})...`, 'warning');
                            this.restartIce();
                        }
                        break;
                }
            };

            // Xử lý connection state
            this.peerConnection.onconnectionstatechange = () => {
                console.log("Connection state:", this.peerConnection.connectionState);
                
                // Chỉ kết thúc cuộc gọi khi connection failed và đã hết số lần thử lại
                if (this.peerConnection.connectionState === 'failed' && this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
                    this.showNotification('Kết nối không thành công sau nhiều lần thử', 'error');
                    this.endCall();
                }
            };

            // Xử lý remote stream
            this.peerConnection.ontrack = (event) => {
                const remoteVideo = document.getElementById("remoteVideo");
                this.handleRemoteStream(event, remoteVideo);
            };

            // Thiết lập local stream
            try {
                const stream = await this.setupMediaStream();
                
                stream.getTracks().forEach(track => {
                    console.log("Thêm track:", track.kind);
                    this.peerConnection.addTrack(track, stream);
                });

                const localVideo = document.getElementById("localVideo");
                if (localVideo) {
                    localVideo.srcObject = stream;
                    
                    // Kiểm tra xem có video track không
                    const hasVideoTrack = stream.getVideoTracks().length > 0;
                    
                    // Luôn hiển thị video element với background đen
                    localVideo.style.display = 'block';
                    localVideo.style.backgroundColor = '#000000';
                    
                    // Nếu chỉ có audio, hiển thị icon microphone ở giữa
                    const localAudioOnlyIcon = document.getElementById('localAudioOnlyIcon');
                    if (localAudioOnlyIcon) {
                        if (!hasVideoTrack) {
                            localAudioOnlyIcon.innerHTML = '<i class="fas fa-microphone fa-3x"></i>';
                            localAudioOnlyIcon.style.display = 'flex';
                            localAudioOnlyIcon.style.position = 'absolute';
                            localAudioOnlyIcon.style.top = '50%';
                            localAudioOnlyIcon.style.left = '50%';
                            localAudioOnlyIcon.style.transform = 'translate(-50%, -50%)';
                            localAudioOnlyIcon.style.color = '#ffffff';
                            localAudioOnlyIcon.style.zIndex = '1';
                        } else {
                            localAudioOnlyIcon.style.display = 'none';
                        }
                    }

                    if (hasVideoTrack) {
                        await localVideo.play();
                    }
                }
            } catch (error) {
                console.error("Lỗi khi thiết lập local stream:", error);
                if (!error.message.includes('audio')) {
                    throw error;
                }
            }

            return this.peerConnection;
        } catch (error) {
            console.error("Lỗi khởi tạo peer connection:", error);
            this.handleCallError(error, 'initializePeerConnection');
            throw error;
        }
    }

    async restartIce() {
        try {
            if (this.peerConnection && this.currentCallerId) {
                console.log("Đang thử khởi động lại kết nối ICE...");
                
                // Tạo offer với cấu hình ICE restart
                const offer = await this.peerConnection.createOffer({ 
                    iceRestart: true,
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: true
                });
                
                await this.peerConnection.setLocalDescription(offer);
                
                // Gửi offer mới
                this.sendCallSignal(this.currentCallerId, "reconnect-offer", {
                    type: 'offer',
                    sdp: offer.sdp,
                    senderName: document.getElementById("currentUser").getAttribute("data-username")
                });
                
                // Hiển thị thông báo
                document.getElementById("connectionStatus").style.display = 'block';
                document.getElementById("statusMessage").textContent = 'Đang thử kết nối lại...';
            }
        } catch (error) {
            console.error("Lỗi khi restart ICE:", error);
            if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
                this.showNotification('Không thể thiết lập lại kết nối', 'error');
                this.endCall();
            }
        }
    }

    selectContact(userId, userName, userImage) {
        this.currentChatType = 'direct';
        document.getElementById("chatType").value = 'direct';
        this.selectedGroupId = null;
        document.getElementById("selectedGroup").value = "";

        // Update selected user info
        document.getElementById("selectedUser").value = userId;
        document.getElementById("selectedUser").setAttribute("data-username", userName);
        document.getElementById("selectedUser").setAttribute("data-imagePath", userImage);

        // Update chat topbar
        const selectedUserInfo = document.querySelector(".selected-user-info");
        if (selectedUserInfo) {
            selectedUserInfo.querySelector(".selected-user-name").textContent = userName;

            // Kiểm tra trạng thái online thực tế của user
            const contactElement = document.querySelector(`.contact[data-userid="${userId}"]`);
            const isOnline = contactElement && contactElement.classList.contains('online');
            selectedUserInfo.querySelector(".user-status").textContent = isOnline ? "Online" : "Offline";
        }

        // Update avatar
        const selectedUserAvatarImg = document.getElementById("selectedUserAvatar");
        if (selectedUserAvatarImg) {
            selectedUserAvatarImg.src = userImage;
            selectedUserAvatarImg.classList.remove("d-none");
        }

        // Show call button, hide group info button
        document.querySelector(".startCallButton").style.display = "flex";
        document.querySelector(".groupInfoButton").style.display = "none";

        // Clear and focus message input
        document.getElementById("messageInput").value = "";
        document.getElementById("messageInput").focus();
        document.querySelector(".chat-content").innerHTML = "";

        // Load old messages
        let currentUser = document.getElementById("currentUser").value;
        this.connection.invoke("LoadOldMessages", currentUser, userId)
            .catch(function (err) {
                console.error("Lỗi khi tải tin nhắn cũ:", err.toString());
            });
    }

    createMessageElement(messageObj, isCurrentUser, isFileMessage = false) {
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

    createGroupMessageElement(messageObj, isCurrentUser, isFileMessage = false) {
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

    showGroupInfo() {
        if (!this.selectedGroupId) return;

        // Load and display group members
        this.connection.invoke("GetGroupMembers", this.selectedGroupId)
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
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.chat-sidebar-wrap');
        const overlay = document.querySelector('.sidebar-overlay');
        sidebar.classList.toggle('show');
        overlay.classList.toggle('show');
    }

    sendMessage() {
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

            this.connection.invoke("SendMessage", senderId, senderName, senderImage, receiverId, receiverName, receiverImage, message)
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

            this.connection.invoke("SendGroupMessage", selectedGroupId, message)
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

    sendFile(file) {
        let formData = new FormData();
        formData.append("file", file);

        if (this.currentChatType === 'direct') {
            let senderId = document.getElementById("currentUser").value;
            let receiverId = document.getElementById("selectedUser").value;

            if (!receiverId) {
                alert("Please select a contact to send the file to.");
                return;
            }

            formData.append("senderId", senderId);
            formData.append("receiverId", receiverId);
        } else if (this.currentChatType === 'group') {
            if (!this.selectedGroupId) {
                alert("Please select a group to send the file to.");
                return;
            }

            formData.append("groupId", this.selectedGroupId);
        }

        fetch("/Chat/UploadFile", {
            method: "POST",
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log("File uploaded:", data.fileUrl);

                    if (this.currentChatType === 'direct') {
                        let senderId = document.getElementById("currentUser").value;
                        let senderName = document.getElementById("currentUser").getAttribute("data-username");
                        let receiverId = document.getElementById("selectedUser").value;
                        let receiverName = document.getElementById("selectedUser").getAttribute("data-username");

                        this.connection.invoke("SendFileMessage", senderId, senderName, receiverId, receiverName, data.fileUrl)
                            .catch(err => console.error("Error sending file message:", err));
                    } else if (this.currentChatType === 'group') {
                        this.connection.invoke("SendGroupFileMessage", this.selectedGroupId, data.fileUrl)
                            .catch(err => console.error("Error sending group file message:", err));
                    }
                } else {
                    alert("Error uploading file!");
                }
            })
            .catch(err => console.error("Error uploading file:", err));
    }

    toggleMic() {
        const micButton = document.getElementById('toggleMicButton');
        const micIcon = micButton.querySelector('i');
        const localStream = document.getElementById('localVideo').srcObject;

        if (localStream) {
            const audioTracks = localStream.getAudioTracks();
            if (audioTracks.length > 0) {
                this.isMicMuted = !this.isMicMuted;
                audioTracks[0].enabled = !this.isMicMuted;

                // Cập nhật UI
                micIcon.className = this.isMicMuted ? 'fas fa-microphone-slash' : 'fas fa-microphone';
                micButton.classList.toggle('btn-danger', this.isMicMuted);
                micButton.classList.toggle('btn-outline-secondary', !this.isMicMuted);
            }
        }
    }

    toggleSpeaker() {
        const speakerButton = document.getElementById('toggleSpeakerButton');
        const speakerIcon = speakerButton.querySelector('i');
        const remoteVideo = document.getElementById('remoteVideo');

        this.isSpeakerMuted = !this.isSpeakerMuted;
        remoteVideo.muted = this.isSpeakerMuted;

        // Cập nhật UI
        speakerIcon.className = this.isSpeakerMuted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
        speakerButton.classList.toggle('btn-danger', this.isSpeakerMuted);
        speakerButton.classList.toggle('btn-outline-secondary', !this.isSpeakerMuted);
    }

    loadGroupMembers() {
        const currentUser = document.getElementById("currentUser").value;
        const membersList = document.querySelector(".group-members-list");

        if (!membersList) return;

        // Lấy danh sách người dùng từ server
        this.connection.invoke("GetAllUsers")
            .then(users => {
                membersList.innerHTML = "";

                users.forEach(user => {
                    if (user.userId !== currentUser) {
                        const memberItem = document.createElement("div");
                        memberItem.className = "d-flex align-items-center mb-2";

                        const avatarPath = user.imagePath && user.imagePath.trim() !== ""
                            ? (user.imagePath.startsWith("http") ? user.imagePath : `/content/images/avatar/${user.imagePath}`)
                            : "/content/images/photo-long-1.jpg";

                        memberItem.innerHTML = `
                            <div class="custom-control custom-checkbox">
                                <input type="checkbox" class="custom-control-input group-member-checkbox" 
                                       id="member-${user.userId}" value="${user.userId}">
                                <label class="custom-control-label" for="member-${user.userId}">
                                    <img class="avatar-xs rounded-circle me-2" src="${avatarPath}" alt="${user.userName}">
                                    <span>${user.userName}</span>
                                </label>
                            </div>
                        `;

                        membersList.appendChild(memberItem);
                    }
                });
            })
            .catch(err => {
                console.error("Lỗi khi tải danh sách thành viên:", err);
            });
    }

    async startCall(receiverId) {
        console.log("Bắt đầu cuộc gọi đến:", receiverId);

        try {
            // Kiểm tra trạng thái cuộc gọi hiện tại
            if (this.currentCallState !== CallState.IDLE) {
                throw new Error("Đang trong cuộc gọi khác");
            }

            // Cập nhật trạng thái cuộc gọi
            this.currentCallState = CallState.CALLING;
            this.currentCallerId = document.getElementById("currentUser").value;

            // Khởi tạo peer connection
            await this.initializePeerConnection(receiverId);

            // Tạo offer với transceivers cho cả audio và video
            const offer = await this.peerConnection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });
            
            await this.peerConnection.setLocalDescription(offer);

            // Gửi offer đến người nhận
            this.sendCallSignal(receiverId, "offer", {
                type: 'offer',
                sdp: offer.sdp,
                senderName: document.getElementById("currentUser").getAttribute("data-username")
            });
            
            this.showModal();
            document.getElementById("call-interface").style.display = 'block';
            document.getElementById("connectionStatus").style.display = 'block';
            document.getElementById("statusMessage").textContent = 'Đang kết nối cuộc gọi...';

            // Set timeout cho cuộc gọi
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

    endCall(initiatorId = null) {
        console.log("Kết thúc cuộc gọi", initiatorId ? `từ ${initiatorId}` : "");

        // Cập nhật trạng thái
        this.updateCallState(CallState.ENDING);

        // Nếu người hiện tại là người chủ động kết thúc cuộc gọi
        if (!initiatorId && this.currentCallerId) {
            console.log("Gửi tín hiệu kết thúc đến:", this.currentCallerId);
            this.sendCallSignal(this.currentCallerId, "end", {
                initiator: document.getElementById("currentUser").value,
                reason: "user_ended"
            });
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
}

// Khởi tạo class khi tài liệu sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
    new Chat();
});