"use strict";
class Chat {
    constructor() {
        this.connection = new signalR.HubConnectionBuilder()
            .withUrl("/chatHub")
            .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
            .build();
        this.selectedGroupId = null;
        this.currentChatType = 'direct';
        this.peerConnection = null;
        this.localStream = null;
        this.remoteStream = null;
        this.configuration = null; // Will be set after getting Twilio token
        this.hasCamera = false;
        this.hasMicrophone = false;
        this.isAudioOnly = false;
        this.callState = 'idle'; // idle, calling, inCall, ending
        this.currentCallId = null;
        this.callTimeout = null;
        this.iceGatheringTimeout = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
        this.incomingCallTimeout = null;
        this.countdownInterval = null;
        this.remoteDescription = null;
        this.remoteUserId = null;
        this.isReceivingCall = false;
        this.callType = null;
        this.initEvents();
        this.startConnection();
        this.checkMediaDevices();
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
                // console.error("Lỗi khi bắt đầu cuộc gọi:", error);
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
    //#region Chat
    initSidebarEvents() {
        document.querySelectorAll('[data-sidebar-toggle="chat"]').forEach(button => {
            button.addEventListener('click', () => this.toggleSidebar());
        });
    }

    initGroupEvents() {
        // Xử lý sự kiện click nút tạo nhóm
        document.getElementById("createGroupBtn").addEventListener("click", () => {
            this.showModalGroup();
        });

        // Xử lý sự kiện click nút submit tạo nhóm
        document.getElementById("createGroupSubmit").addEventListener("click", (e) => {
            this.createGroupSubmit(e);
        });

        // Xử lý sự kiện click nút thông tin nhóm
        document.querySelector(".groupInfoButton").addEventListener("click", () => this.showGroupInfo());
    }

    initContactListEvents() {
        document.addEventListener("click", (event) => {
            // Xử lý click vào contact cá nhân
            const contactTarget = event.target.closest(".contact:not(.group)");
            if (contactTarget) {
                const userId = contactTarget.getAttribute("data-userid");
                const userName = contactTarget.getAttribute("data-username");
                const userImage = contactTarget.querySelector("img").src;

                if (userId && userName) {
                    this.selectContact(userId, userName, userImage);
                }
            }

            // Xử lý click vào nhóm chat
            const groupTarget = event.target.closest(".contact.group");
            if (groupTarget) {
                const groupId = groupTarget.getAttribute("data-groupid");
                const groupName = groupTarget.getAttribute("data-groupname");

                if (groupId && groupName) {
                    this.selectGroup(groupId, groupName);
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

        // Xóa tin nhắn cũ
        document.querySelector(".chat-content").innerHTML = "";

        // Mở khung chat và focus vào ô nhập tin nhắn
        this.openChatInterface();

        // Tải tin nhắn cũ
        let currentUser = document.getElementById("currentUser").value;
        this.connection.invoke("LoadOldMessages", currentUser, userId)
            .catch(function (err) {
                //// console.error("Lỗi khi tải tin nhắn cũ:", err.toString());
            });
    }

    selectGroup(groupId, groupName) {
        this.currentChatType = 'group';
        document.getElementById("chatType").value = 'group';
        this.selectedGroupId = groupId;
        document.getElementById("selectedGroup").value = groupId;

        // Cập nhật thông tin nhóm được chọn
        const selectedUserInfo = document.querySelector(".selected-user-info");
        if (selectedUserInfo) {
            selectedUserInfo.querySelector(".selected-user-name").textContent = groupName;
            selectedUserInfo.querySelector(".user-status").textContent = "Nhóm chat";
        }

        // Cập nhật avatar nhóm
        const selectedUserAvatarImg = document.getElementById("selectedUserAvatar");
        if (selectedUserAvatarImg) {
            selectedUserAvatarImg.src = "/content/images/avatar/group-avatar.png";
            selectedUserAvatarImg.classList.remove("d-none");
        }

        // Ẩn nút gọi điện, hiện nút thông tin nhóm
        document.querySelector(".startCallButton").style.display = "none";
        document.querySelector(".groupInfoButton").style.display = "flex";

        // Xóa tin nhắn cũ
        document.querySelector(".chat-content").innerHTML = "";

        // Mở khung chat và focus vào ô nhập tin nhắn
        this.openChatInterface();

        // Tải tin nhắn cũ của nhóm
        this.connection.invoke("LoadGroupMessages", groupId)
            .catch(function (err) {
                console.error("Lỗi khi tải tin nhắn nhóm:", err.toString());
            });
    }

    openChatInterface() {
        // Đóng sidebar trên mobile (nếu đang mở)
        const sidebar = document.querySelector('.chat-sidebar-wrap');
        const overlay = document.querySelector('.sidebar-overlay');
        if (sidebar && sidebar.classList.contains('show')) {
            sidebar.classList.remove('show');
            if (overlay) overlay.classList.remove('show');
        }

        // Hiển thị khung chat chính
        const chatMain = document.querySelector('.chat-content-wrap');
        if (chatMain) {
            chatMain.classList.add('show');
        }

        // Focus vào ô nhập tin nhắn
        const messageInput = document.getElementById("messageInput");
        const inputForm = document.querySelector(".inputForm");
        if (inputForm) {
            inputForm.classList.remove('d-none');
            messageInput.value = "";
            messageInput.focus();
        }
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
    startConnection() {
        this.connection.start()
            .then(() => {
               // // console.log("✅ Kết nối SignalR thành công!");
            })
            .catch(function (err) {
               // // console.error("❌ Lỗi kết nối SignalR: ", err.toString());
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
       // // console.log("Nhận danh sách người dùng:", { allUsers, onlineUsers });
        let contactList = document.querySelector(".contacts-scrollable");
        contactList.innerHTML = ""; // Xóa danh sách cũ

        let currentUser = document.getElementById("currentUser").value;
        //// console.log("User hiện tại:", currentUser);

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
       // // console.log("SignalR đã kết nối thành công!");
        let receiverId = document.getElementById("selectedUser").value;
        let signalType = "offer"; // Ví dụ tín hiệu offer khi bắt đầu cuộc gọi
        let signalData = { senderName: document.getElementById("currentUser").getAttribute("data-username") };
        this.sendCallSignal(receiverId, signalType, signalData);
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
        //console.log("Loại chat hiện tại:", chatType);

        if (chatType === 'direct') {
            let senderId = document.getElementById("currentUser").value;
            let senderName = document.getElementById("currentUser").getAttribute("data-username");
            let senderImage = document.getElementById("currentUserImage").value;
            let receiverId = document.getElementById("selectedUser").value;
            let receiverName = document.getElementById("selectedUser").getAttribute("data-username");
            let receiverImage = document.getElementById("selectedUser").getAttribute("data-imagepath");

            if (!receiverId) {
               // alert("⚠ Vui lòng chọn một người để nhắn tin.");
                return;
            }

            this.connection.invoke("SendMessage", senderId, senderName, senderImage, receiverId, receiverName, receiverImage, message)
                .catch(function (err) {
                    console.error("❌ Lỗi gửi tin nhắn:", err.toString());
                });
        } else if (chatType === 'group') {
            let selectedGroupId = document.getElementById("selectedGroup").value;
           // console.log("Đang gửi tin nhắn đến nhóm:", selectedGroupId);

            if (!selectedGroupId) {
               // alert("⚠ Vui lòng chọn một nhóm để nhắn tin.");
                return;
            }

            this.connection.invoke("SendGroupMessage", selectedGroupId, message)
                .then(() => {
                    console.log("✅ Đã gửi tin nhắn nhóm thành công");
                })
                .catch(function (err) {
                    //console.error("❌ Lỗi gửi tin nhắn nhóm:", err.toString());
                    //alert("Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại.");
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
               // alert("Please select a contact to send the file to.");
                return;
            }

            formData.append("senderId", senderId);
            formData.append("receiverId", receiverId);
        } else if (this.currentChatType === 'group') {
            if (!this.selectedGroupId) {
                //alert("Please select a group to send the file to.");
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
    handleUpdateGroupList(groups) {
       // // console.log('Nhận danh sách nhóm mới:', groups);
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
      //  // console.log("Nhận tin nhắn nhóm:", messageObj);
        let selectedGroupId = document.getElementById("selectedGroup").value;

        if (String(messageObj.groupChatId) === String(selectedGroupId)) {
            let chatContent = document.querySelector(".chat-content");
            let currentUser = document.getElementById("currentUser").value;

           // // console.log("Hiển thị tin nhắn nhóm từ:", messageObj.senderName);
            let messageElement = this.createGroupMessageElement(messageObj, messageObj.senderId === currentUser);

            if (messageElement) {
                chatContent.appendChild(messageElement);
                chatContent.scrollTop = chatContent.scrollHeight;
            }
        } else {
           // // console.log("Tin nhắn không thuộc nhóm hiện tại");
        }
    }

    handleReceiveGroupMessages(messages) {
       // // console.log("Nhận lịch sử tin nhắn nhóm:", messages);
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
            //// console.log("Không có tin nhắn hoặc dữ liệu không hợp lệ:", messages);
        }
    }

    handleReceiveOldMessages(messages) {
      // // console.log("Nhận tin nhắn cũ:", messages);
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
           // // console.log("Không có tin nhắn cũ hoặc dữ liệu không hợp lệ:", messages);
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
    loadGroupMembers() {
        const currentUser = document.getElementById("currentUser").value;
        const membersList = document.querySelector(".member-list");

        if (!membersList) return;

        // Lấy danh sách người dùng từ danh sách contacts hiện có
        const contacts = document.querySelectorAll('.contacts-scrollable .contact');
        membersList.innerHTML = '';

        contacts.forEach(contact => {
            const userId = contact.getAttribute('data-userid');
            const userName = contact.getAttribute('data-username');
            const userImage = contact.querySelector('img').src;

            if (userId && userId !== currentUser) {
                const memberItem = document.createElement("div");
                memberItem.className = "member-item d-flex align-items-center p-2 border-bottom";

                memberItem.innerHTML = `
                    <label class="checkbox checkbox-outline-primary d-flex align-items-center mb-0">
                        <input type="checkbox" class="group-member-checkbox" id="member${userId}" value="${userId}">
                        <span>
                            <div class="d-flex align-items-center">
                                <div class="avatar-wrapper me-2">
                                    <img class="avatar-sm rounded-circle" src="${userImage}" alt="${userName}">
                                </div>
                                <div class="member-info">
                                    <h6 class="mb-0">${userName}</h6>
                                </div>
                            </div>
                        </span>
                        <span class="checkmark mt-2"></span>
                    </label>
                `;

                // Thêm hover effect
                memberItem.addEventListener('mouseover', () => {
                    memberItem.style.backgroundColor = '#f8f9fa';
                });
                memberItem.addEventListener('mouseout', () => {
                    memberItem.style.backgroundColor = '';
                });

                membersList.appendChild(memberItem);
            }
        });

        // Thêm style cho member list
        membersList.style.maxHeight = '300px';
        membersList.style.overflowY = 'auto';
        membersList.style.padding = '0';
        membersList.style.margin = '10px 0';
        membersList.style.borderRadius = '8px';
        membersList.style.border = '1px solid #dee2e6';
    }
    createGroupSubmit(event) {
        event.preventDefault();
        
        // Lấy tên nhóm
        const groupName = document.getElementById("groupName").value.trim();
        if (!groupName) {
            this.showNotification("Vui lòng nhập tên nhóm!", "warning");
            return;
        }

        // Lấy danh sách thành viên được chọn
        const selectedMembers = [];
        document.querySelectorAll('.group-member-checkbox:checked').forEach(checkbox => {
            selectedMembers.push(checkbox.value);
        });

        if (selectedMembers.length === 0) {
            this.showNotification("Vui lòng chọn ít nhất một thành viên!", "warning");
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
                this.showNotification("Tạo nhóm thành công!", "success");
                this.closeModalGroup();
                // Reset form
                document.getElementById("createGroupForm").reset();
                document.querySelectorAll('.group-member-checkbox').forEach(cb => cb.checked = false);
            })
            .catch(err => {
                this.showNotification("Có lỗi xảy ra khi tạo nhóm. Vui lòng thử lại!", "error");
            });
    }

    showModalGroup() {
        // Load danh sách thành viên trước khi hiển thị modal
        this.loadGroupMembers();
        
        // Hiển thị modal
        $("#createGroupModal").modal("show");

        // Xử lý sự kiện submit form tạo nhóm
        const createGroupForm = document.getElementById("createGroupForm");
        if (createGroupForm) {
            createGroupForm.onsubmit = (e) => this.createGroupSubmit(e);
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
        const membersList = document.querySelector(".member-list");
        if (membersList) {
            membersList.innerHTML = "";
        }
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
    //#endregion Chat
    sendCallSignal(receiverId, signalType, signalData) {
        // Lấy thông tin người gửi
        const senderId = document.getElementById("currentUser").value;
        const senderName = document.getElementById("currentUser").getAttribute("data-username");

        // Gửi tín hiệu đến server
        return this.connection.invoke("SendCallSignal", senderId, receiverId, signalType, signalData)
            .then(() => {
                // console.log("✅ Tín hiệu cuộc gọi đã được gửi thành công");
            })
            .catch(err => {
                // console.error("❌ Lỗi gửi tín hiệu cuộc gọi:", err);
            });
    }

    async checkMediaDevices() {
        try {
            // Kiểm tra xem trình duyệt có hỗ trợ getUserMedia không
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Trình duyệt của bạn không hỗ trợ getUserMedia!");
            }

            // Lấy danh sách thiết bị
            const devices = await navigator.mediaDevices.enumerateDevices();
            
            // Kiểm tra camera
            this.hasCamera = devices.some(device => device.kind === 'videoinput');
            
            // Kiểm tra microphone
            this.hasMicrophone = devices.some(device => device.kind === 'audioinput');

            // Kiểm tra microphone là bắt buộc
            if (!this.hasMicrophone) {
                throw new Error("Không tìm thấy microphone - Cần có microphone để thực hiện cuộc gọi");
            }

            // Chỉ thông báo không có camera
            if (!this.hasCamera) {
                // console.log("Không tìm thấy camera - Chỉ gửi audio");
            }

            // Kiểm tra quyền truy cập
            await this.checkMediaPermissions();

        } catch (error) {
            // console.error("Lỗi khi kiểm tra thiết bị media:", error);
            this.handleMediaDeviceError(error);
        }
    }

    async checkMediaPermissions() {
        try {
            // Thử yêu cầu quyền truy cập dựa trên thiết bị có sẵn
            const constraints = {
                audio: true,
                video: this.hasCamera
            };
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            stream.getTracks().forEach(track => track.stop());
            
            return true;
        } catch (error) {
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                throw new Error("Vui lòng cấp quyền truy cập thiết bị media");
            }
            throw error;
        }
    }

    handleMediaDeviceError(error) {
        let message = "Đã xảy ra lỗi khi kiểm tra thiết bị media.";
        let solution = "";

        switch (error.name) {
            case 'NotAllowedError':
            case 'PermissionDeniedError':
                message = "Bạn đã từ chối quyền truy cập thiết bị media.";
                solution = "Vui lòng cấp quyền trong cài đặt trình duyệt và thử lại.";
                break;
            case 'NotFoundError':
                if (!this.hasMicrophone) {
                    message = "Không tìm thấy microphone - Không thể thực hiện cuộc gọi.";
                    solution = "Vui lòng kết nối microphone với thiết bị của bạn.";
                } else if (!this.hasCamera) {
                    message = "Không tìm thấy camera - Chỉ gửi audio.";
                    solution = "Bạn vẫn có thể nhận video từ người khác.";
                }
                break;
            case 'NotReadableError':
                message = "Không thể truy cập thiết bị media.";
                solution = "Vui lòng kiểm tra xem có ứng dụng nào khác đang sử dụng thiết bị không.";
                break;
            default:
                if (!this.hasMicrophone) {
                    message = "Không tìm thấy microphone.";
                    solution = "Cần có microphone để thực hiện cuộc gọi.";
                }
        }

        // Hiển thị thông báo lỗi
        const errorDiv = document.getElementById("callError");
        const errorMessage = document.getElementById("errorMessage");
        
        if (errorDiv && errorMessage) {
            errorMessage.innerHTML = `<strong>${message}</strong><br>${solution}`;
            errorDiv.style.display = "block";

            // Tự động ẩn thông báo sau 5 giây nếu chỉ là thông báo không có camera
            if (this.hasMicrophone && !this.hasCamera) {
                setTimeout(() => {
                    errorDiv.style.display = "none";
                }, 5000);
            }
        }

        // Cập nhật UI cho nút gọi
        const callButton = document.querySelector(".startCallButton");
        if (callButton) {
            // Chỉ vô hiệu hóa nút nếu không có microphone
            if (!this.hasMicrophone) {
                callButton.disabled = true;
                callButton.title = message;
            } else {
                callButton.disabled = false;
                callButton.title = !this.hasCamera ? "Gọi audio" : "";
            }
        }
    }

    setupPeerConnection() {
        if (this.peerConnection) {
            this.peerConnection.close();
        }

        //// console.log("Khởi tạo peer connection với cấu hình:", this.configuration);
        this.peerConnection = new RTCPeerConnection(this.configuration);

        // Xử lý ice gathering state
        this.peerConnection.onicegatheringstatechange = () => {
            //// console.log("ICE gathering state:", this.peerConnection.iceGatheringState);
            if (this.peerConnection.iceGatheringState === 'complete') {
                //// console.log("ICE gathering completed");
                if (this.iceGatheringTimeout) {
                    clearTimeout(this.iceGatheringTimeout);
                }
            }
        };

        // Xử lý connection state
        this.peerConnection.onconnectionstatechange = () => {
            //// console.log("Connection state:", this.peerConnection.connectionState);
            switch (this.peerConnection.connectionState) {
                case "connected":
                    //// console.log("Peers connected!");
                    this.showNotification("Kết nối thành công", "success");
                    this.reconnectAttempts = 0;
                    break;
                case "disconnected":
                    //// console.log("Peers disconnected!");
                    this.showNotification("Kết nối bị ngắt", "warning");
                    if (this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.tryReconnect();
                    } else {
                        //// console.log("Đã vượt quá số lần thử kết nối lại");
                        this.endCall();
                    }
                    break;
                case "failed":
                    //// console.log("Peer connection failed!");
                    this.showNotification("Kết nối thất bại", "error");
                    if (this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.tryReconnect();
                    } else {
                        this.endCall();
                    }
                    break;
            }
        };

        // Xử lý ice connection state
        this.peerConnection.oniceconnectionstatechange = () => {
            //// console.log("ICE connection state:", this.peerConnection.iceConnectionState);
            switch (this.peerConnection.iceConnectionState) {
                case "checking":
                    this.showNotification("Đang thiết lập kết nối...", "info");
                    break;
                case "connected":
                case "completed":
                    //// console.log("ICE connection established");
                    this.showNotification("Kết nối thành công", "success");
                    break;
                case "failed":
                    //// console.error("ICE connection failed");
                    if (this.reconnectAttempts < this.maxReconnectAttempts) {
                        //// console.log(`Thử kết nối lại lần ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts}`);
                        this.tryReconnect();
                    } else {
                        this.handleCallError(new Error("Không thể thiết lập kết nối sau nhiều lần thử"), "iceConnection");
                        this.endCall();
                    }
                    break;
                case "disconnected":
                    //// console.warn("ICE connection disconnected");
                    this.showNotification("Kết nối không ổn định", "warning");
                    if (this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.tryReconnect();
                    }
                    break;
            }
        };

        // Xử lý ice candidate errors
        this.peerConnection.onicecandidateerror = (event) => {
            //// console.error("ICE Candidate Error:", event);
        };

        return this.peerConnection;
    }

    async tryReconnect() {
        this.reconnectAttempts++;
        //// console.log(`Đang thử kết nối lại (lần ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

        if (this.peerConnection && this.callState === 'inCall') {
            try {
                const offer = await this.peerConnection.createOffer({
                    iceRestart: true,
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: true
                });

                await this.peerConnection.setLocalDescription(offer);
                
                const receiverId = document.getElementById("selectedUser").value;
                await this.sendCallSignal(receiverId, "offer", {
                    callId: this.currentCallId,
                    offer: offer
                });

                //// console.log("Đã gửi offer mới để thử kết nối lại");
            } catch (error) {
                //// console.error("Lỗi khi thử kết nối lại:", error);
                if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                    this.showNotification("Không thể thiết lập lại kết nối", "error");
                    this.endCall();
                }
            }
        }
    }

    async startCall(receiverId) {
        try {
            if (this.callState !== 'idle') {
                return;
            }

            // Debug: Log các element cần thiết
            console.log('Debug - Elements check:');
            console.log('loadVideo:', document.getElementById("loadVideo"));
            console.log('connectionStatus:', document.getElementById("connectionStatus"));
            console.log('localVideo:', document.getElementById("localVideo"));

            // Kiểm tra xem các element có tồn tại không
            const elements = {
                videoContainer: document.getElementById("loadVideo"),
                connectionStatus: document.getElementById("connectionStatus"),
                localVideo: document.getElementById("localVideo")
            };

            // Kiểm tra từng element và tạo thông báo lỗi chi tiết
            const missingElements = Object.entries(elements)
                .filter(([key, element]) => !element)
                .map(([key]) => key);

            if (missingElements.length > 0) {
                throw new Error(`Thiếu các thành phần giao diện: ${missingElements.join(', ')}`);
            }

            const gotToken = await this.getTwilioToken();
            if (!gotToken) {
                throw new Error("Không thể lấy thông tin máy chủ TURN");
            }

            await this.checkMediaDevices();

            if (!this.hasMicrophone) {
                throw new Error("Cần có microphone để thực hiện cuộc gọi");
            }

            this.callState = 'calling';
            this.currentCallId = Date.now().toString();

            elements.videoContainer.classList.remove('d-none');
            elements.connectionStatus.textContent = "Đang kết nối...";
            elements.connectionStatus.style.display = "block";

            this.peerConnection = this.setupPeerConnection();

            // Xử lý remote stream khi bắt đầu cuộc gọi
            this.peerConnection.ontrack = (event) => {
                console.log("Caller received remote track:", event.track.kind);
                const remoteVideo = document.getElementById("remoteVideo");
                if (remoteVideo) {
                    console.log("Setting up remote stream for caller");
                    remoteVideo.srcObject = event.streams[0];
                    this.remoteStream = event.streams[0];

                    const videoTracks = event.streams[0].getVideoTracks();
                    const audioTracks = event.streams[0].getAudioTracks();
                    console.log("Caller receiving - Video tracks:", videoTracks.length);
                    console.log("Caller receiving - Audio tracks:", audioTracks.length);

                    remoteVideo.onloadedmetadata = () => {
                        console.log("Caller's remote video metadata loaded");
                        remoteVideo.play()
                            .then(() => {
                                console.log("Caller's remote video playing");
                                const hasVideoTrack = videoTracks.length > 0;
                                console.log("Caller receiving video track:", hasVideoTrack);
                                remoteVideo.style.display = hasVideoTrack ? "block" : "none";
                            })
                            .catch(e => console.error('Error playing remote video for caller:', e));
                    };
                }
            };
            
            let constraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            };

            if (this.hasCamera) {
                console.log("Camera detected, adding video constraints");
                constraints.video = {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                };
            } else {
                console.log("No camera detected, audio only call");
            }

            try {
                console.log("Requesting media with constraints:", constraints);
                this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
                
                // Debug local stream
                const localVideoTracks = this.localStream.getVideoTracks();
                const localAudioTracks = this.localStream.getAudioTracks();
                console.log("Local video tracks:", localVideoTracks.length);
                console.log("Local audio tracks:", localAudioTracks.length);

                if (this.localStream.getVideoTracks().length > 0) {
                    console.log("Local video track obtained");
                    this.isAudioOnly = false;
                    elements.localVideo.srcObject = this.localStream;
                    elements.localVideo.style.display = "block";
                    try {
                        await elements.localVideo.play();
                        console.log("Local video playing");
                    } catch (playError) {
                        console.warn('Autoplay prevented:', playError);
                    }
                } else {
                    console.log("No local video track, audio only mode");
                    this.isAudioOnly = true;
                    elements.localVideo.style.display = "none";
                }

                // Add tracks to peer connection
                this.localStream.getTracks().forEach(track => {
                    console.log(`Adding local ${track.kind} track to peer connection`);
                    this.peerConnection.addTrack(track, this.localStream);
                });

                const offer = await this.peerConnection.createOffer({
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: !this.isAudioOnly
                });

                console.log("Created offer:", {
                    hasAudio: offer.sdp.includes('m=audio'),
                    hasVideo: offer.sdp.includes('m=video')
                });

                await this.peerConnection.setLocalDescription(offer);
                
                await this.sendCallSignal(receiverId, "offer", {
                    callId: this.currentCallId,
                    offer: offer,
                    isAudioOnly: this.isAudioOnly
                });

                elements.connectionStatus.style.display = "none";

            } catch (mediaError) {
                console.error("Error getting media stream:", mediaError);
                if (!this.isAudioOnly) {
                    console.log("Falling back to audio only");
                    this.isAudioOnly = true;
                    constraints = {
                        audio: {
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true
                        },
                        video: false
                    };
                    try {
                        this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
                        elements.localVideo.style.display = "none";
                        this.localStream.getTracks().forEach(track => {
                            console.log(`Adding fallback ${track.kind} track to peer connection`);
                            this.peerConnection.addTrack(track, this.localStream);
                        });
                    } catch (audioError) {
                        throw audioError;
                    }
                } else {
                    throw mediaError;
                }
            }

            this.callTimeout = setTimeout(() => {
                if (this.callState === 'calling') {
                    this.showNotification("Không có phản hồi từ người nhận", "warning");
                    this.endCall();
                }
            }, 30000);

        } catch (error) {
            console.error("Lỗi khi bắt đầu cuộc gọi:", error);
            this.handleCallError(error, 'startCall');
            this.endCall();
        }
    }

    async handleReceiveCallSignal(senderId, signalType, signalData) {
        try {
            if (signalData && signalData.callId) {
                if (signalType === "offer") {
                    if (this.callState !== 'idle') {
                        this.sendCallSignal(senderId, "busy", {
                            callId: signalData.callId
                        });
                        return;
                    }
                    this.currentCallId = signalData.callId;
                } else if (this.currentCallId && signalData.callId !== this.currentCallId) {
                    return;
                }
            }

            switch (signalType) {
                case "offer":
                    const gotToken = await this.getTwilioToken();
                    if (!gotToken) {
                        throw new Error("Không thể lấy thông tin máy chủ TURN");
                    }

                    this.callState = 'receiving';
                    
                    // Cập nhật tên người gọi và hiển thị modal
                    const callerName = document.querySelector(`[data-userid="${senderId}"]`)?.getAttribute("data-username") || "Unknown";
                    $("#callerName").text(callerName);
                    $("#callModal").modal('show');

                    // Set up countdown
                    let timeLeft = 30;
                    this.updateCountdown(timeLeft);
                    
                    this.countdownInterval = setInterval(() => {
                        timeLeft--;
                        this.updateCountdown(timeLeft);
                        if (timeLeft <= 0) {
                            clearInterval(this.countdownInterval);
                            if (this.callState === "receiving") {
                                this.rejectCall(senderId);
                            }
                        }
                    }, 1000);

                    this.callTimeout = setTimeout(() => {
                        if (this.callState === "receiving") {
                            clearInterval(this.countdownInterval);
                            this.rejectCall(senderId);
                        }
                    }, 30000);

                    // Xử lý sự kiện chấp nhận cuộc gọi
                    $("#acceptCallButton").off('click').on('click', async () => {
                        clearTimeout(this.callTimeout);
                        clearInterval(this.countdownInterval);
                        this.updateCountdown(0);
                        
                        try {
                            await this.acceptCall(senderId, signalData);
                        } catch (error) {
                            console.error("Lỗi khi chấp nhận cuộc gọi:", error);
                            this.handleCallError(error, 'acceptCall');
                            this.endCall();
                        }
                    });

                    // Xử lý sự kiện từ chối cuộc gọi
                    $("#rejectCallButton").off('click').on('click', () => {
                        clearTimeout(this.callTimeout);
                        clearInterval(this.countdownInterval);
                        this.updateCountdown(0);
                        this.rejectCall(senderId);
                    });
                    break;

                case "answer":
                    if (this.callState === 'calling' && this.peerConnection) {
                        clearTimeout(this.callTimeout);
                        this.callState = 'inCall';
                        // console.log("Received answer:", signalData.answer);
                        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(signalData.answer));
                    }
                    break;

                case "ice-candidate":
                    if (this.peerConnection && (this.callState === 'calling' || this.callState === 'inCall')) {
                        try {
                            // console.log("Adding ICE candidate:", signalData.candidate);
                            await this.peerConnection.addIceCandidate(signalData.candidate);
                        } catch (error) {
                            // console.error("Lỗi khi thêm ice candidate:", error);
                        }
                    }
                    break;

                case "reject":
                    this.showNotification("Cuộc gọi đã bị từ chối", "warning");
                    this.endCall();
                    break;

                case "busy":
                    this.showNotification("Người dùng đang trong cuộc gọi khác", "warning");
                    this.endCall();
                    break;

                case "end-call":
                    if (this.callState !== 'idle' && this.currentCallId === signalData.callId) {
                        // console.log("Nhận được tín hiệu kết thúc cuộc gọi từ:", senderId);
                        if (signalData.reason === "user_ended") {
                            this.showNotification("Người kia đã kết thúc cuộc gọi", "info");
                        }
                        this.endCall();
                    }
                    break;
            }
        } catch (error) {
            console.error("Lỗi khi xử lý tín hiệu cuộc gọi:", error);
            this.handleCallError(error, 'handleReceiveCallSignal');
            this.endCall();
        }
    }

    async acceptCall(senderId, signalData) {
        try {
            await this.checkMediaDevices();

            if (!this.hasMicrophone) {
                throw new Error("Cần có microphone để thực hiện cuộc gọi");
            }

            this.callState = 'inCall';
            this.peerConnection = this.setupPeerConnection();

            // Xử lý remote stream
            this.peerConnection.ontrack = (event) => {
                console.log("Receiver got remote track:", event.track.kind);
                const remoteVideo = document.getElementById("remoteVideo");
                if (remoteVideo) {
                    console.log("Setting up remote stream for receiver");
                    if (!remoteVideo.srcObject) {
                        remoteVideo.srcObject = event.streams[0];
                        this.remoteStream = event.streams[0];
                    }

                    // Debug remote stream
                    const videoTracks = event.streams[0].getVideoTracks();
                    const audioTracks = event.streams[0].getAudioTracks();
                    console.log("Receiver got - Video tracks:", videoTracks.length);
                    console.log("Receiver got - Audio tracks:", audioTracks.length);

                    // Check if this is a video track
                    if (event.track.kind === 'video') {
                        console.log("Received video track, enabling video display");
                        remoteVideo.style.display = "block";
                    }

                    remoteVideo.onloadedmetadata = () => {
                        console.log("Receiver's remote video metadata loaded");
                        remoteVideo.play()
                            .then(() => {
                                console.log("Receiver's remote video playing");
                                const hasVideoTrack = videoTracks.length > 0;
                                console.log("Receiver has video track:", hasVideoTrack);
                                remoteVideo.style.display = hasVideoTrack ? "block" : "none";
                            })
                            .catch(e => {
                                console.error('Error playing remote video for receiver:', e);
                                toastr.error("Có lỗi khi hiển thị video từ người gọi");
                            });
                    };

                    // Track event handlers
                    event.track.onmute = () => {
                        console.log(`Receiver: Remote ${event.track.kind} track muted`);
                        if (event.track.kind === 'video') {
                            remoteVideo.style.display = "none";
                        }
                    };

                    event.track.onunmute = () => {
                        console.log(`Receiver: Remote ${event.track.kind} track unmuted`);
                        if (event.track.kind === 'video') {
                            remoteVideo.style.display = "block";
                        }
                    };

                    event.track.onended = () => {
                        console.log(`Receiver: Remote ${event.track.kind} track ended`);
                        if (event.track.kind === 'video') {
                            remoteVideo.style.display = "none";
                        }
                    };
                }
            };

            const constraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: this.hasCamera ? {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                } : false
            };

            console.log("Receiver requesting media with constraints:", constraints);
            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

            // Debug local stream
            const localVideoTracks = this.localStream.getVideoTracks();
            const localAudioTracks = this.localStream.getAudioTracks();
            console.log("Receiver local video tracks:", localVideoTracks.length);
            console.log("Receiver local audio tracks:", localAudioTracks.length);

            // Xử lý video local
            const localVideo = document.getElementById("localVideo");
            if (localVideo) {
                if (this.hasCamera && localVideoTracks.length > 0) {
                    console.log("Receiver setting up local video");
                    localVideo.srcObject = this.localStream;
                    localVideo.style.display = "block";
                    try {
                        await localVideo.play();
                        console.log("Receiver local video playing");
                    } catch (playError) {
                        console.warn('Receiver autoplay prevented:', playError);
                    }
                } else {
                    console.log("Receiver has no camera or video tracks, hiding local video");
                    localVideo.style.display = "none";
                }
            }

            // Add tracks to peer connection
            this.localStream.getTracks().forEach(track => {
                console.log(`Receiver adding local ${track.kind} track to peer connection`);
                this.peerConnection.addTrack(track, this.localStream);
            });

            // Set up ICE handling
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log("Receiver sending ICE candidate");
                    this.sendCallSignal(senderId, "ice-candidate", {
                        callId: this.currentCallId,
                        candidate: event.candidate
                    });
                }
            };

            this.peerConnection.oniceconnectionstatechange = () => {
                console.log("Receiver ICE connection state:", this.peerConnection.iceConnectionState);
                switch (this.peerConnection.iceConnectionState) {
                    case "checking":
                        toastr.info("Đang thiết lập kết nối...");
                        break;
                    case "connected":
                        toastr.success("Kết nối thành công!");
                        break;
                    case "failed":
                        console.error("Receiver ICE connection failed");
                        toastr.error("Kết nối thất bại");
                        this.endCall();
                        break;
                }
            };

            console.log("Receiver setting remote description");
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(signalData.offer));
            
            console.log("Receiver creating answer");
            const answer = await this.peerConnection.createAnswer();
            
            console.log("Answer SDP:", {
                hasAudio: answer.sdp.includes('m=audio'),
                hasVideo: answer.sdp.includes('m=video')
            });
            
            await this.peerConnection.setLocalDescription(answer);

            await this.sendCallSignal(senderId, "answer", {
                callId: this.currentCallId,
                answer: answer
            });

            // Ẩn modal và hiển thị giao diện cuộc gọi
            $("#callModal").modal('hide');
            $("#loadVideo").removeClass('d-none');

        } catch (error) {
            console.error("Lỗi khi chấp nhận cuộc gọi:", error);
            throw error;
        }
    }

    rejectCall(senderId) {
        $("#callModal").modal('hide');
        this.sendCallSignal(senderId, "reject", {
            callId: this.currentCallId,
            reason: "user_rejected"
        });
        this.endCall();
    }

    updateCountdown(seconds) {
        const timeoutCounter = document.getElementById("timeoutCounter");
        if (timeoutCounter) {
            if (seconds <= 0) {
                timeoutCounter.textContent = "";
            } else {
                timeoutCounter.textContent = `Tự động từ chối sau ${seconds} giây`;
            }
        }
    }

    endCall() {
        try {
            // Gửi tín hiệu kết thúc cuộc gọi đến bên kia
            if (this.callState !== 'idle' && this.currentCallId) {
                const receiverId = document.getElementById("selectedUser").value;
                this.sendCallSignal(receiverId, "end-call", {
                    callId: this.currentCallId,
                    reason: "user_ended"
                });
            }

            // Dọn dẹp timeout và interval
            if (this.callTimeout) {
                clearTimeout(this.callTimeout);
                this.callTimeout = null;
            }
            if (this.countdownInterval) {
                clearInterval(this.countdownInterval);
                this.countdownInterval = null;
            }
            if (this.iceGatheringTimeout) {
                clearTimeout(this.iceGatheringTimeout);
                this.iceGatheringTimeout = null;
            }

            // Reset countdown
            const timeoutCounter = document.getElementById("timeoutCounter");
            if (timeoutCounter) {
                timeoutCounter.textContent = "";
            }

            // Dừng và dọn dẹp streams
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => {
                    track.stop();
                    console.log(`Stopped local ${track.kind} track`);
                });
                this.localStream = null;
            }
            if (this.remoteStream) {
                this.remoteStream.getTracks().forEach(track => {
                    track.stop();
                    console.log(`Stopped remote ${track.kind} track`);
                });
                this.remoteStream = null;
            }

            // Đóng và dọn dẹp peer connection
            if (this.peerConnection) {
                this.peerConnection.ontrack = null;
                this.peerConnection.onicecandidate = null;
                this.peerConnection.oniceconnectionstatechange = null;
                this.peerConnection.onconnectionstatechange = null;
                this.peerConnection.onsignalingstatechange = null;
                this.peerConnection.onicegatheringstatechange = null;
                this.peerConnection.close();
                this.peerConnection = null;
                console.log("Peer connection closed and cleaned up");
            }

            // Reset video elements
            const localVideo = document.getElementById("localVideo");
            const remoteVideo = document.getElementById("remoteVideo");
            
            if (localVideo) {
                localVideo.srcObject = null;
                localVideo.style.display = "none";
            }
            if (remoteVideo) {
                remoteVideo.srcObject = null;
                remoteVideo.style.display = "none";
            }

            // Reset các nút điều khiển về trạng thái mặc định
            const micButton = document.getElementById("toggleMicButton");
            const speakerButton = document.getElementById("toggleSpeakerButton");
            
            if (micButton) {
                const micIcon = micButton.querySelector("i");
                micIcon.className = "fas fa-microphone";
                micButton.classList.remove("btn-danger");
                micButton.classList.add("btn-outline-secondary");
            }
            
            if (speakerButton) {
                const speakerIcon = speakerButton.querySelector("i");
                speakerIcon.className = "fas fa-volume-up";
                speakerButton.classList.remove("btn-danger");
                speakerButton.classList.add("btn-outline-secondary");
            }

            // Ẩn giao diện cuộc gọi
            $("#callModal").modal('hide');
            $("#loadVideo").addClass('d-none');

            // Reset connection status
            const connectionStatus = document.getElementById("connectionStatus");
            if (connectionStatus) {
                connectionStatus.style.display = "none";
                connectionStatus.textContent = "";
            }

            // Reset state
            this.callState = 'idle';
            this.currentCallId = null;
            this.isAudioOnly = false;
            this.reconnectAttempts = 0;
            this.remoteDescription = null;
            this.remoteUserId = null;
            this.isReceivingCall = false;

            console.log("Call ended successfully, all resources cleaned up");
            this.showNotification("Cuộc gọi đã kết thúc", "info");

        } catch (error) {
            console.error("Lỗi khi kết thúc cuộc gọi:", error);
            toastr.error("Có lỗi xảy ra khi kết thúc cuộc gọi");
        }
    }

    toggleMic() {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                const micButton = document.getElementById("toggleMicButton");
                const micIcon = micButton.querySelector("i");
                
                if (audioTrack.enabled) {
                    micIcon.className = "fas fa-microphone";
                    micButton.classList.remove("btn-danger");
                    micButton.classList.add("btn-outline-secondary");
                } else {
                    micIcon.className = "fas fa-microphone-slash";
                    micButton.classList.remove("btn-outline-secondary");
                    micButton.classList.add("btn-danger");
                }
            }
        }
    }

    toggleSpeaker() {
        const remoteVideo = document.getElementById("remoteVideo");
        const speakerButton = document.getElementById("toggleSpeakerButton");
        const speakerIcon = speakerButton.querySelector("i");

        remoteVideo.muted = !remoteVideo.muted;
        
        if (remoteVideo.muted) {
            speakerIcon.className = "fas fa-volume-mute";
            speakerButton.classList.remove("btn-outline-secondary");
            speakerButton.classList.add("btn-danger");
        } else {
            speakerIcon.className = "fas fa-volume-up";
            speakerButton.classList.remove("btn-danger");
            speakerButton.classList.add("btn-outline-secondary");
        }
    }

    handleCallError(error, context) {
        console.error(`Lỗi trong context ${context}:`, error);
        
        // Hiển thị thông báo lỗi phù hợp
        let message = "Đã xảy ra lỗi không xác định.";
        
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
            message = "Vui lòng cho phép truy cập camera và microphone để thực hiện cuộc gọi.";
        } else if (error.name === "NotFoundError") {
            message = "Không tìm thấy camera hoặc microphone trên thiết bị của bạn.";
        } else if (error.name === "NotReadableError") {
            message = "Không thể truy cập camera hoặc microphone. Vui lòng đảm bảo không có ứng dụng nào khác đang sử dụng chúng.";
        } else if (error.message) {
            message = error.message;
        }
        
        // Hiển thị thông báo bằng toastr
        toastr.error(message);
        
        // Ẩn giao diện video call và reset trạng thái
        const elements = {
            videoContainer: document.getElementById("loadVideo"),
            connectionStatus: document.getElementById("connectionStatus"),
            localVideo: document.getElementById("localVideo")
        };

        if (elements.videoContainer) {
            elements.videoContainer.classList.add('d-none');
        }

        if (elements.connectionStatus) {
            elements.connectionStatus.style.display = "none";
        }

        if (elements.localVideo) {
            elements.localVideo.srcObject = null;
            elements.localVideo.style.display = "none";
        }
    }

    async getTwilioToken() {
        try {
            const response = await fetch('/Chat/GetTwilioToken');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            // console.log("Nhận được Twilio token:", data);
            
            // Cập nhật cấu hình ICE với thông tin từ Twilio
            this.configuration = {
                iceServers: data.iceServers,
                iceCandidatePoolSize: 10,
                bundlePolicy: 'max-bundle',
                rtcpMuxPolicy: 'require',
                iceTransportPolicy: 'all' // Cho phép tất cả các phương thức kết nối
            };
            
            return true;
        } catch (error) {
            // console.error("Lỗi khi lấy Twilio token:", error);
            return false;
        }
    }
}
// Khởi tạo class khi tài liệu sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Chat
    new Chat();
});