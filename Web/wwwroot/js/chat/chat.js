"use strict";

var connection = new signalR.HubConnectionBuilder().withUrl("/chatHub").build();

// Vô hiệu hóa nút gửi khi chưa kết nối
document.getElementById("sendButton").disabled = true;

// Hàm tạo tin nhắn theo giao diện Bootstrap
//function createMessageElement(messageObj, isCurrentUser) {
//    let messageDiv = document.createElement("div");
//    messageDiv.classList.add("d-flex", "mb-4", isCurrentUser && "user");
//    let selectedUserId = document.getElementById("selectedUser").value; // Người đang chat
//    let currentUserId = document.getElementById("currentUser").value;  // User hiện tại
//    // Chỉ hiển thị tin nhắn nếu:
//    // 1. Người gửi là user hiện tại và người nhận là selectedUserId (tin nhắn mình gửi)
//    // 2. Người nhận là user hiện tại và người gửi là selectedUserId (tin nhắn mình nhận)
//    let isMessageForCurrentChat =
//        (messageObj.senderId === currentUserId && messageObj.receiverId === selectedUserId) ||
//        (messageObj.receiverId === currentUserId && messageObj.senderId === selectedUserId);

//    if (!isMessageForCurrentChat) {
//        console.warn("🚨 Tin nhắn không phải dành cho cuộc trò chuyện này, bỏ qua.");
//        return null;
//    }
//    // Nếu là người gửi thì lấy ảnh của currentUser, nếu không thì lấy ảnh của receiver
//    let avatar = isCurrentUser
//        ? ``
//        : `<img class="avatar-sm rounded-circle me-3" src="/content/images/avatar/${messageObj.senderImage}" alt="User Avatar">`;
//    messageDiv.innerHTML = `
//        ${isCurrentUser ? avatar : ""}
//        <div class="message flex-grow-1">
//            <div class="d-flex">
//                <p class="mb-1 text-title text-16 flex-grow-1">${messageObj.senderName}</p>
//                <span class="text-small text-muted">${messageObj.timestamp}</span>
//            </div>
//            <p class="m-0">${messageObj.content}</p>
//        </div>
//        ${isCurrentUser ? "" : avatar}
//    `;

//    return messageDiv;
//}
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