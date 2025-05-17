// Configuration de base
const config = {
    appId: "2071d93215924d1c81e1bca9b4d594c0", 
    channel: "",
    token: null,
    uid: Math.floor(Math.random() * 100000),
  };
  
  let client;
  let localTracks = [];
  let remoteUsers = {};
  
  
  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("join-btn").addEventListener("click", joinCall);
    document.getElementById("leave-btn").addEventListener("click", leaveCall);
  });
  
  async function joinCall() {
    config.channel = document.getElementById("channel-name").value.trim();
    if (!config.channel) return alert("Veuillez entrer un nom de canal");
  
    document.getElementById("join-btn").disabled = true;
  
    client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  
    // pour les nouveaux utilisateurs
    client.on("user-published", handleUserPublished);
    client.on("user-unpublished", handleUserUnpublished);
    client.on("user-left", handleUserLeft);
  
    await client.join(config.appId, config.channel, config.token, config.uid);
  
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();
    localTracks[1].play("local-video");
    await client.publish(localTracks);
  
    document.getElementById("leave-btn").disabled = false;
  }
  
  async function leaveCall() {
    for (let track of localTracks) {
      track.stop();
      track.close();
    }
  
    await client.leave();
  
    document.getElementById("join-btn").disabled = false;
    document.getElementById("leave-btn").disabled = true;
  
    // Nettoie les vidéos distantes
    Object.keys(remoteUsers).forEach(uid => {
      const el = document.getElementById(`user-${uid}`);
      if (el) el.remove();
    });
  
    remoteUsers = {};
  }
  
  async function handleUserPublished(user, mediaType) {
    remoteUsers[user.uid] = user;
    await client.subscribe(user, mediaType);
  
    if (mediaType === "video") {
      addVideoStream(user);
      user.videoTrack.play(`user-${user.uid}`);
    }
  
    if (mediaType === "audio") {
      user.audioTrack.play();
    }
  }
  
  function handleUserUnpublished(user) {
    const el = document.getElementById(`user-${user.uid}`);
    if (el) el.remove();
    delete remoteUsers[user.uid];
  }
  
  function handleUserLeft(user) {
    const el = document.getElementById(`user-${user.uid}`);
    if (el) el.remove();
    delete remoteUsers[user.uid];
  }
  
  //Fonction pour créer la vidéo distante
  function addVideoStream(user) {
    const videoContainer = document.createElement("div");
    videoContainer.classList.add("video-placeholder");
    videoContainer.id = `user-${user.uid}`;
  
    const username = document.createElement("div");
    username.classList.add("user-name");
    username.textContent = `Utilisateur ${user.uid}`;
  
    videoContainer.appendChild(username);
    document.getElementById("video-container").appendChild(videoContainer);
  }
  
