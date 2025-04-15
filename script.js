// Configuration de base
const config = {
    appId: "2071d93215924d1c81e1bca9b4d594c0", // À remplacer par votre App ID
    channel: "", // Sera rempli quand l'utilisateur entre un nom de canal
    token: null, // Optionnel pour les tests, requis en production
    uid: Math.floor(Math.random() * 100000) // ID aléatoire pour l'utilisateur
};

// Variables globales
let client; // Client Agora
let localTracks = []; // Stocke les pistes audio/vidéo locales

// Quand la page est prête
document.addEventListener("DOMContentLoaded", () => {
    // Bouton pour rejoindre un appel
    document.getElementById("join-btn").addEventListener("click", joinCall);
    
    // Bouton pour quitter l'appel
    document.getElementById("leave-btn").addEventListener("click", leaveCall);
});

// Fonction pour rejoindre un appel
async function joinCall() {
    try {
        // Récupère le nom du canal saisi par l'utilisateur
        config.channel = document.getElementById("channel-name").value.trim();
        if (!config.channel) {
            alert("Veuillez entrer un nom de canal");
            return;
        }

        // Désactive le bouton rejoindre pendant la connexion
        document.getElementById("join-btn").disabled = true;
        
        // 1. Initialise le client Agora
        client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        
        // 2. Rejoint le canal
        await client.join(config.appId, config.channel, config.token, config.uid);
        
        // 3. Crée les pistes audio/vidéo locales
        localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();
        
        // 4. Affiche la vidéo locale
        localTracks[1].play("local-video");
        
        // 5. Publie les pistes dans le canal
        await client.publish(localTracks);
        
        console.log("Connexion réussie!");
        
        // Active le bouton quitter
        document.getElementById("leave-btn").disabled = false;
        
    } catch (error) {
        console.error("Erreur:", error);
        alert("Erreur de connexion: " + error.message);
        document.getElementById("join-btn").disabled = false;
    }
    
    // Gère les autres utilisateurs qui rejoignent
    client.on("user-published", handleUserPublished);
    client.on("user-unpublished", handleUserUnpublished);
}

// Fonction pour quitter l'appel
async function leaveCall() {
    try {
        // Arrête toutes les pistes locales
        for (let track of localTracks) {
            track.stop();
            track.close();
        }
        
        // Quitte le canal
        await client.leave();
        
        // Réinitialise l'interface
        document.getElementById("local-video").innerHTML = "Votre vidéo apparaîtra ici";
        document.getElementById("join-btn").disabled = false;
        document.getElementById("leave-btn").disabled = true;
        
        console.log("Déconnexion réussie");
        
    } catch (error) {
        console.error("Erreur en quittant:", error);
    }
}

// Quand un autre utilisateur rejoint
async function handleUserPublished(user, mediaType) {
    try {
        // S'abonne à l'utilisateur
        await client.subscribe(user, mediaType);
        
        if (mediaType === "video") {
            // Crée un élément pour afficher sa vidéo
            const remoteVideo = document.createElement("div");
            remoteVideo.id = user.uid;
            remoteVideo.className = "remote-video";
            document.getElementById("video-container").appendChild(remoteVideo);
            
            // Joue la vidéo
            user.videoTrack.play(remoteVideo.id);
        }
        
        if (mediaType === "audio") {
            // Joue l'audio
            user.audioTrack.play();
        }
    } catch (error) {
        console.error("Erreur avec utilisateur:", error);
    }
}

// Quand un utilisateur quitte
function handleUserUnpublished(user) {
    // Supprime son élément vidéo
    const remoteVideo = document.getElementById(user.uid);
    if (remoteVideo) {
        remoteVideo.remove();
    }
}