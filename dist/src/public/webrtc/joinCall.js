"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const url = "http://localhost:4000";
let meetingDetails;
let displayName;
let localStream;
let isMuted = false;
let isScreenSharingAllowed = true;
let isChattingAllowed = true;
let isSharingScreen = false;
let isHidden = false;
let iceServersConfig;
const peerConnections = {};
const remoteStreams = [];
let remoteCandidates = {};
const participants = [];
let selectedParticipant;
let user;
let userId;
let meetingHost;
let meetingCoHost;
// socket connection initialized
const socket = io(url, {
    autoConnect: false,
    transports: ["websocket"],
});
function connect() {
    socket.connect();
}
socket.on("connect", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("connected to server");
    const meetingCreds = getMeetingDetails();
    const isVerified = yield verifyMeetingDetails(meetingCreds);
    console.log("IsVerified => ", isVerified);
    yield joinCall();
}));
// socket events
socket.on("connect", () => {
    console.log("Connected to the server");
});
socket.on("reconnect", () => {
    console.log("Re-Connected to the server");
});
socket.on("someone-got-connected", (data) => __awaiter(void 0, void 0, void 0, function* () {
    const callee = data.joineeId;
    if (callee != userId) {
        console.log("someone got connected", data);
        yield startCalling(callee);
    }
}));
socket.on("offer", (data) => {
    const { to, from, offer, meetingDetails } = data;
    console.log(`Got offer from ${from} for ${to}`);
    if (from != userId && to == userId) {
        answerCall(data);
    }
});
socket.on("answer", (data) => {
    const { to, from, answer, meetingDetails } = data;
    if (from != userId && to == userId) {
        console.log(`Got answer from ${from} for ${to}`);
        peerConnections[from].setRemoteDescription(answer);
        processCandidates(from);
    }
});
// // Handle incoming "candidate" from the server
socket.on("ice-candidate", (data) => {
    const { to, from, iceCandidate, meetingDetails } = data;
    if (from != userId && to == userId) {
        console.log(`Got ice candidate from ${from}`);
        if (peerConnections.hasOwnProperty(from) &&
            peerConnections[from].remoteDescription) {
            peerConnections[from].addIceCandidate(new RTCIceCandidate(iceCandidate));
        }
        else {
            if (remoteCandidates.hasOwnProperty(from)) {
                remoteCandidates[from].push(new RTCIceCandidate(iceCandidate));
            }
            else {
                remoteCandidates[from] = [];
                remoteCandidates[from].push(new RTCIceCandidate(iceCandidate));
            }
        }
        processCandidates(from);
    }
});
socket.on("message", (data) => {
    showMessage(data);
});
socket.on("mute", (data) => {
    console.log("Mute  triggered", data);
    isMuted = true;
    toggleAudio(!isMuted);
    //window.alert("You are muted by the host");
});
socket.on("unmute", (data) => {
    console.log("UnMute  triggered", data);
    isMuted = false;
    toggleAudio(!isMuted);
    // window.alert("You are unmuted by the host");
});
socket.on("hide", (data) => {
    console.log("Hide  triggered", data);
    isHidden = true;
    toggleVideo(!isHidden);
    // window.alert("Your video is hidden by the host");
});
socket.on("unhide", (data) => {
    console.log("Unhide  triggered", data);
    isHidden = false;
    toggleVideo(!isHidden);
    // window.alert("Your video is unhidden by the host");
});
socket.on("make-host", (data) => {
    console.log("Make host triggered", data);
    const { recipient, meetingDetails } = data;
    meetingHost = recipient;
    // window.alert("You are now the host");
});
socket.on("revoke-host-status", (data) => {
    console.log("revoke-host-status triggered", data);
    const { recipient, meetingDetails } = data;
    meetingHost = recipient;
    // window.alert("Your host status has been revoked");
});
socket.on("make-co-host", (data) => {
    console.log("Make co-host triggered", data);
    meetingCoHost = data.recipient;
    // window.alert("You are now a co-host");
});
socket.on("revoke-coHost-status", (data) => {
    console.log("revoke-coHost-status triggered", data);
    const { recipient, meetingDetails } = data;
    meetingCoHost = recipient;
    //window.alert("You are coHost-status has been revoked");
});
socket.on("allow-screen-sharing", (data) => {
    console.log("allow-screen-sharing", data);
    isScreenSharingAllowed = true;
    // window.alert("You are now allowed to share your screen");
});
socket.on("disallow-screen-sharing", (data) => {
    console.log("disallow-screen-sharing", data);
    const { meetingDetails, recipient } = data;
    isScreenSharingAllowed = false;
    // window.alert("You are not allowed to share your screen");
});
socket.on("allow-chatting", (data) => {
    console.log("allow-chatting", data);
    isChattingAllowed = true;
    // window.alert("You are now allowed to chat");
});
socket.on("disallow-chatting", (data) => {
    console.log("disallow-chatting", data);
    isChattingAllowed = false;
    //window.alert("You are not allowed to chat.");
});
socket.on("user-sharing-screen", (data) => {
    console.log("user-sharing-screen", data);
    //window.alert("has started sharing screen");
});
socket.on("user-stopped-sharing-screen", (data) => {
    console.log("user-stopped-sharing-screen", data);
    // window.alert("has stopped sharing screen");
});
function getMeetingDetails() {
    const meetingId = document.getElementById("meetingId").textContent;
    const meetingPasscode = document.getElementById("passcode").textContent;
    const hostId = document.getElementById("hostId").textContent;
    const joineeId = document.getElementById("joineeId").textContent;
    console.log("Meeting Id: ", meetingId);
    console.log("Meeting Passcode: ", meetingPasscode);
    console.log("Host Id: ", hostId);
    console.log("Joinee Id: ", joineeId);
    meetingDetails = {
        meetingId: meetingId, //"d1807435-4825-457d-b237-d9cbd4dda85b",
        meetingPasscode: meetingPasscode,
        hostId: hostId,
        joineeId: joineeId,
    };
    userId = joineeId;
    meetingHost = hostId;
    meetingCoHost = hostId;
    return meetingDetails;
}
function fillUpMeetingDetails() {
    let meetingCreds = getMeetingDetails();
    let userMeetingId = document.getElementById("meeting-id");
    let userMeetingPasscode = document.getElementById("meeting-passcode");
    userMeetingId.value = meetingCreds.meetingId;
    userMeetingPasscode.value = meetingCreds.meetingPasscode;
    return;
}
function verifyMeetingDetails(meetingDetails) {
    return __awaiter(this, void 0, void 0, function* () {
        let verificationEndpoint = `${url}/verify-meeting-creds`;
        const response = yield fetch(verificationEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(meetingDetails),
        });
        return yield response.json();
    });
}
const joinCall = () => __awaiter(void 0, void 0, void 0, function* () {
    socket.emit("joining-call", meetingDetails, (ack) => {
        console.log("sending meeting details", meetingDetails);
        console.log("Response from Server => ", ack);
    });
    // hide form
    const joinCallScreen = document.getElementById("joinCallScreen");
    const meetingRoom = document.getElementById("meetingRoom");
    if (meetingRoom) {
        meetingRoom.style.display = "block";
    }
    if (joinCallScreen) {
        joinCallScreen.style.display = "none";
    }
    yield getLocalMediaStream();
});
function startCalling(to) {
    return __awaiter(this, void 0, void 0, function* () {
        // grab local stream
        let sessionConstraints = {
            mandatory: {
                OfferToReceiveAudio: true,
                OfferToReceiveVideo: true,
                VoiceActivityDetection: true,
            },
        };
        localStream = yield getLocalMediaStream();
        const pc = initializePeerConnection(to);
        localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
        const offer = yield pc.createOffer(sessionConstraints);
        yield pc.setLocalDescription(offer);
        if (meetingDetails) {
            socket.emit("offer", {
                to: to,
                from: userId,
                offer: pc.localDescription,
                meetingDetails,
            });
            console.log(`Offer sent to ${to} by ${userId}`);
        }
    });
}
const getLocalMediaStream = () => __awaiter(void 0, void 0, void 0, function* () {
    let mediaConstraints = {
        audio: isMuted
            ? {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                volume: 1.0,
            }
            : !isMuted,
        video: {
            facingMode: "user",
            width: { ideal: 640, max: 640 }, // Lower resolution
            height: { ideal: 480, max: 480 },
            frameRate: { ideal: 30, max: 30 }, // Lower frame rate
        },
    };
    if (localStream) {
        localVideo.srcObject = localStream;
        return localStream;
    }
    else {
        const mediaStream = yield navigator.mediaDevices.getUserMedia(mediaConstraints);
        const localVideo = document.getElementById("localVideo");
        localVideo.srcObject = mediaStream;
        return mediaStream;
    }
});
const initializePeerConnection = (peer) => {
    // Configuration for the RTCPeerConnection
    const configuration = iceServersConfig;
    const pc = new RTCPeerConnection({
        iceTransportPolicy: "all", // Use 'relay' only if necessary
        iceServers: [
            {
                urls: "stun:stun.relay.metered.ca:80",
            },
            {
                urls: "turn:standard.relay.metered.ca:80",
                username: "220e58364b45c8a894643a5b",
                credential: "fqAowWbaQm64d98I",
            },
            {
                urls: "turn:standard.relay.metered.ca:80?transport=tcp",
                username: "220e58364b45c8a894643a5b",
                credential: "fqAowWbaQm64d98I",
            },
            {
                urls: "turn:standard.relay.metered.ca:443",
                username: "220e58364b45c8a894643a5b",
                credential: "fqAowWbaQm64d98I",
            },
            {
                urls: "turns:standard.relay.metered.ca:443?transport=tcp",
                username: "220e58364b45c8a894643a5b",
                credential: "fqAowWbaQm64d98I",
            },
        ],
    });
    peerConnections[peer] = pc;
    peerConnections[peer].onicecandidate = ({ candidate }) => {
        if (candidate && meetingDetails) {
            socket.emit("ice-candidate", {
                to: peer,
                from: meetingDetails.joineeId,
                iceCandidate: candidate,
                meetingDetails,
            });
            console.log(`Sent ice candidate to ${peer}`);
        }
    };
    peerConnections[peer].ontrack = ({ streams: [stream] }) => {
        console.log(`Getting stream from ${peer}`, stream.getAudioTracks());
        if (!remoteStreams.includes(peer)) {
            remoteStreams.push(peer);
            const remoteVideosContainer = document.getElementById("remoteVideosContainer");
            const videoBox = document.createElement("div");
            videoBox.id = peer;
            const remoteVideo = document.createElement("video");
            remoteVideo.autoplay = true;
            //  remoteVideo.muted = true;
            remoteVideo.classList.add("remote-video");
            const remoteUser = document.createElement("h5");
            remoteUser.classList.add("displayName");
            let remoteUserDisplayName = peer[0].toUpperCase() + peer[1].toUpperCase();
            remoteUser.textContent = remoteUserDisplayName;
            remoteVideo.srcObject = stream;
            videoBox.appendChild(remoteUser);
            videoBox.appendChild(remoteVideo);
            remoteVideosContainer.appendChild(videoBox);
        }
    };
    peerConnections[peer].oniceconnectionstatechange = (event) => {
        console.log("iceConnectionState => ", peerConnections[peer].iceConnectionState);
    };
    //"disconnected", "failed", "closed"
    peerConnections[peer].onconnectionstatechange = (event) => {
        console.log("Peer connection state => ", peerConnections[peer].connectionState);
        if (["closed"].includes(peerConnections[peer].connectionState)) {
            updateRemoteStream(peer);
        }
        if (peerConnections[peer].connectionState == "closed") {
            peerConnections[peer].close();
        }
        else if (peerConnections[peer].connectionState == "connected") {
            ///////
            if (!participants.includes(peer)) {
                participants.push(peer);
            }
        }
    };
    console.log(`Peer connection for ${peer} initialized`);
    return peerConnections[peer];
};
const processCandidates = (peer) => {
    if (peer in remoteCandidates) {
        remoteCandidates[peer].forEach((candidate) => {
            if (peerConnections.hasOwnProperty(peer) &&
                peerConnections[peer].remoteDescription) {
                peerConnections[peer].addIceCandidate(candidate);
            }
        });
    }
};
const answerCall = ({ to, from, offer }) => __awaiter(void 0, void 0, void 0, function* () {
    //capture local media stream and  initialize a new peer connection
    localStream = yield getLocalMediaStream();
    const pc = initializePeerConnection(from);
    localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
    });
    yield pc.setRemoteDescription(offer);
    const answer = yield pc.createAnswer();
    yield pc.setLocalDescription(answer);
    socket.emit("call-answered", {
        to: from,
        from: to,
        answer: pc.localDescription,
        meetingDetails,
    });
    console.log(`Call from ${from} for ${to} answered`);
});
function leave() {
    if (localStream) {
        localStream.getTracks().forEach((track) => {
            track.stop(); // Stop each track
        });
        console.log("local stream's tracks stopped");
    }
    let localVideo = document.getElementById("localVideo");
    if (localVideo) {
        localVideo.srcObject = null;
        console.log("video source made null");
    }
    for (let peer in peerConnections) {
        peerConnections[peer].close();
        console.log(`${peer} left the call`);
    }
    socket.off();
    socket.disconnect();
}
function updateRemoteStream(participant) {
    // 1. update remote stream here
    let remoteUserVideo = document.getElementById(participant);
    const remoteVideosContainer = document.getElementById("remoteVideosContainer");
    if (remoteUserVideo) {
        remoteVideosContainer.removeChild(remoteUserVideo);
        console.log("remote stream updated");
    }
}
const shareScreen = () => __awaiter(void 0, void 0, void 0, function* () {
    const displayMediaOptions = {
        video: {
            displaySurface: "browser",
            width: { ideal: 640, max: 640 }, // Lower resolution
            height: { ideal: 480, max: 480 },
            frameRate: { ideal: 30, max: 30 }, // Lower frame rate
        },
        audio: {
            suppressLocalAudioPlayback: false,
        },
        preferCurrentTab: false,
        selfBrowserSurface: "exclude",
        systemAudio: "include",
        surfaceSwitching: "include",
        monitorTypeSurfaces: "include",
    };
    if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
    }
    const screenStream = yield navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
    // Add event listener to detect when screen sharing stops
    screenStream.getVideoTracks()[0].onended = () => {
        console.log("Screen sharing stopped");
        stopSharingScreen();
    };
    replaceStream(screenStream);
    socket.emit("iam-sharing-screen", { meetingDetails });
});
const stopSharingScreen = () => __awaiter(void 0, void 0, void 0, function* () {
    let mediaConstraints = {
        audio: !isMuted,
        video: {
            frameRate: 30,
            facingMode: "user",
        },
    };
    if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
    }
    const newStream = yield navigator.mediaDevices.getUserMedia(mediaConstraints);
    replaceStream(newStream);
    socket.emit("i-have-stopped-sharing-screen", { meetingDetails });
});
const replaceStream = (newStream) => {
    for (const peer in peerConnections) {
        console.log("peer ========> ", peer);
        peerConnections[peer].getSenders().map((sender) => {
            if (sender.track.kind == "audio") {
                if (newStream.getAudioTracks().length > 0) {
                    console.log("audio stream replace", newStream.getAudioTracks()[0]);
                    sender.replaceTrack(newStream.getAudioTracks()[0]);
                }
            }
            if (sender.track.kind == "video") {
                if (newStream.getVideoTracks().length > 0) {
                    sender.replaceTrack(newStream.getVideoTracks()[0]);
                }
            }
        });
    }
    localStream = newStream;
    localVideo.srcObject = newStream;
};
const toggleVideo = (isChecked) => {
    if (isChecked && localStream && localStream.getVideoTracks().length) {
        // Execute action when toggle switch is turned on
        console.log("Video Toggle switch is ON");
        localStream.getVideoTracks()[0].enabled = true;
    }
    else if (localStream && localStream.getVideoTracks().length) {
        // Execute action when toggle switch is turned off
        console.log("Video Toggle switch is OFF");
        // Perform your action here
        if (localStream) {
            localStream.getVideoTracks()[0].enabled = false;
        }
    }
};
const toggleAudio = (isChecked) => {
    if (isChecked && localStream && localStream.getAudioTracks().length) {
        // Execute action when toggle switch is turned on
        console.log("Audio Toggle switch is ON");
        localStream.getAudioTracks()[0].enabled = true;
    }
    else if (localStream && localStream.getAudioTracks().length) {
        // Execute action when toggle switch is turned off
        console.log("Audio Toggle switch is OFF");
        // Perform your action here
        if (localStream) {
            localStream.getAudioTracks()[0].enabled = false;
        }
    }
};
const raiseHand = () => {
    socket.emit("raise-hand", {
        to: meetingDetails.hostId,
        from: userId,
        meetingDetails,
    });
};
const openChatBox = () => {
    let chatbox = document.getElementById("chats");
    chatbox.style.display = "flex";
};
const closeChatBox = () => {
    let chatbox = document.getElementById("chats");
    chatbox.style.display = "none";
};
function toggleDropdown() {
    let dropdown = document.getElementById("myDropdown");
    dropdown.classList.toggle("show");
}
const sendMessage = () => {
    let msg = document.getElementById("msg").value;
    let chatbox = document.getElementById("chatbox");
    let messageBox = document.createElement("div");
    messageBox.style.alignSelf = "flex-end";
    let messageHeader = document.createElement("div");
    let messageSubHeader = document.createElement("div");
    let messageFrom = document.createElement("p");
    let proflePic = document.createElement("img");
    let messageTime = document.createElement("p");
    let message = document.createElement("p");
    messageFrom.textContent = "You";
    messageTime.textContent = new Date().toLocaleString();
    //proflePic.src = `${url}/user.png`;
    message.textContent = msg;
    messageBox.classList.add("message");
    proflePic.classList.add("profile-pic");
    message.classList.add("message-content");
    messageTime.classList.add("message-time");
    messageHeader.classList.add("message-header");
    messageSubHeader.classList.add("message-subHeader");
    messageFrom.classList.add("message-from");
    messageBox.appendChild(messageHeader);
    messageHeader.appendChild(messageSubHeader);
    messageBox.appendChild(message);
    messageSubHeader.appendChild(proflePic);
    messageSubHeader.appendChild(messageFrom);
    messageHeader.appendChild(messageTime);
    chatbox.appendChild(messageBox);
    console.log("message sent", userId, meetingHost, msg);
    socket.emit("send-msg", {
        to: meetingHost,
        from: userId,
        msg,
        meetingDetails,
    });
    msg.value = "";
};
const showMessage = ({ to, from, msg, meetingDetails }) => {
    if (from === userId) {
        console.log("Why would i show this message ?");
    }
    let fromUser = from;
    let chatbox = document.getElementById("chatbox");
    let messageBox = document.createElement("div");
    messageBox.style.alignSelf = "flex-start";
    let messageHeader = document.createElement("div");
    let messageSubHeader = document.createElement("div");
    let messageFrom = document.createElement("p");
    let proflePic = document.createElement("img");
    let messageTime = document.createElement("p");
    let message = document.createElement("p");
    messageFrom.textContent = fromUser;
    messageTime.textContent = new Date().toLocaleString();
    // proflePic.src = `${url}/user.png`;
    message.textContent = msg;
    messageBox.classList.add("message");
    proflePic.classList.add("profile-pic");
    message.classList.add("message-content");
    messageTime.classList.add("message-time");
    messageHeader.classList.add("message-header");
    messageSubHeader.classList.add("message-subHeader");
    messageFrom.classList.add("message-from");
    messageBox.appendChild(messageHeader);
    messageHeader.appendChild(messageSubHeader);
    messageBox.appendChild(message);
    messageSubHeader.appendChild(proflePic);
    messageSubHeader.appendChild(messageFrom);
    messageHeader.appendChild(messageTime);
    chatbox.appendChild(messageBox);
};
