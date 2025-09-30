import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import MainLayout from "../components/Layout/MainLayout";
import VideoPlayer from "../components/VideoPlayer/VideoPlayer";
import Chat from "../components/Chat/Chat";
import UserList from "../components/UserList/UserList";
import Playlist from "../components/Playlist/Playlist";

export default function RoomPage() {
    //const { roomId } = useParams();
    //const [playlist, setPlaylist] = useState([]);
    //const [currentVideoUrl, setCurrentVideoUrl] = useState(null);
    //const [loading, setLoading] = useState(true);

    //Retour attendu de l'api : 
    // {
    // "currentVideoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    // "playlist": [
    // { "id": 1, "title": "Vidéo 1", "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    // { "id": 2, "title": "Vidéo 2", "url": "https://www.youtube.com/watch?v=3JZ_D3ELwOQ" }
    // ]
    // }


    /* useEffect(() => {
        // Fetch la playlist et la vidéo courante depuis ton backend
        fetch(`/api/rooms/${roomId}`)
            .then(res => res.json())
            .then(data => {
                setPlaylist(data.playlist);
                setCurrentVideoUrl(data.currentVideoUrl);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [roomId]); */

    // Playlist simulée
    const playlistVideos = [
        { id: 1, title: "Vidéo 1", url: "https://www.youtube.com/watch?v=enyUdIyZmjU" },
        { id: 2, title: "Vidéo 2", url: "https://www.youtube.com/watch?v=enyUdIyZmjU" },
        { id: 3, title: "Vidéo 3", url: "https://www.youtube.com/watch?v=enyUdIyZmjU" },
    ];

    // Vidéo actuelle
    const [currentVideoUrl, setCurrentVideoUrl] = useState(playlistVideos[0].url);

    //if (loading) return <p>Chargement du salon...</p>;
    if (!currentVideoUrl) return <p>Pas de vidéo pour ce salon.</p>;
    console.log(currentVideoUrl)

    return (
        <MainLayout
            video={<VideoPlayer url={currentVideoUrl} />}
            chat={<Chat />}
            users={<UserList />}
            playlist={
                <Playlist
                    videos={playlistVideos}
                    onSelectVideo={(url) => setCurrentVideoUrl(url)}
                />
            }
        />

    );
}
