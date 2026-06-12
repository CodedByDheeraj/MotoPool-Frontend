const socket = io("https://motopool-backend.onrender.com");

// LOGGED IN USER
const user =
JSON.parse(localStorage.getItem("user"));


// GET CONVERSATION ID FROM URL
const params =
new URLSearchParams(window.location.search);

const conversationId =
params.get("conversationId");
const rideId =
params.get("rideId");
if (!conversationId) {
    alert("Conversation ID missing");
    window.location.href = "profile.html";
}


// HTML ELEMENTS
const messagesArea =
document.getElementById("messagesArea");

const messageInput =
document.getElementById("messageInput");

const sendBtn =
document.getElementById("sendBtn");


// JOIN SOCKET ROOM
socket.emit(
    "joinConversation",
    conversationId
);


async function loadChatHeader() {

    if (!rideId) return;

    const response = await fetch(

        `https://motopool-backend.onrender.com/conversation-by-ride/${rideId}`

    );

    const conversation = await response.json();

    const otherUser = conversation.participants.find(

        p => p._id.toString() !== user._id.toString()

    );

    console.log("Other User:", otherUser);

    if (otherUser) {

        document.getElementById("chatName").innerText =

            otherUser.name;

        document.getElementById("chatRole").innerText =

            "Ride Partner";

        document.getElementById("chatAvatar").src =

otherUser.profilePhoto

?

otherUser.profilePhoto

:

"images/profile.png";

    }

}


// LOAD OLD MESSAGES
async function loadMessages() {

    try {

        const response =
        await fetch(
            `https://motopool-backend.onrender.com/messages/${conversationId}`
        );

        const messages =
        await response.json();

        messagesArea.innerHTML = "";

        if(messages.length === 0){

           messagesArea.innerHTML = `

<div class="empty-chat">

💬

<h2>Start chatting</h2>

<p>Say Hello to your ride partner.</p>

</div>

`;


            return;
        }

        messages.forEach(addMessageToUI);

    } catch (error) {

        console.log(error);

    }
}

async function loadRideDetails(){

    const res = await fetch(
        `https://motopool-backend.onrender.com/ride/${rideId}`
    );

    const ride = await res.json();

    document.getElementById("rideCard").style.display = "block";

    document.getElementById("rideCard").innerHTML = `
        <h4>🏍 Ride Details</h4>

        <div class="ride-info">

            <div><b>From:</b> ${ride.pickup}</div>

            <div><b>To:</b> ${ride.drop}</div>

            <div><b>Date:</b> ${ride.date}</div>

            <div><b>Time:</b> ${ride.time}</div>

        </div>
    `;
}

// SHOW MESSAGE ON SCREEN
function addMessageToUI(message) {

    const div = document.createElement("div");

    const senderId = message.sender._id || message.sender;

    const isOwn = senderId.toString() === user._id.toString();

    div.className = isOwn ? "message own" : "message";

    // Force left/right
    div.style.alignSelf = isOwn ? "flex-end" : "flex-start";

    const time = new Date(message.createdAt).toLocaleTimeString(

    [],

    {

        hour: "2-digit",

        minute: "2-digit"

    }

);

div.innerHTML = `

    <div class="message-content">

        ${message.text}

    </div>

    <div class="message-time">

        ${time}

    </div>

`;

    messagesArea.appendChild(div);

    messagesArea.scrollTop = messagesArea.scrollHeight;
}


// SEND MESSAGE
function sendMessage() {

    const text =
    messageInput.value.trim();

    if (!text) return;

    socket.emit("sendMessage", {

        conversationId,

        sender: user._id,

        text

    });

    messageInput.value = "";
}


// SEND BUTTON CLICK
sendBtn.addEventListener(
    "click",
    sendMessage
);


// RECEIVE REALTIME MESSAGE
socket.on("newMessage", (message) => {

    addMessageToUI(message);

});




messageInput.addEventListener(
    "keypress",
    (e) => {

        if(e.key === "Enter"){

            sendMessage();

        }

    }
);

// INITIAL LOAD
loadChatHeader();

loadMessages();

loadRideDetails();