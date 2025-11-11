import ChatSidebar from "@/components/ChatSidebar/ChatSidebar";
import BottomMenu from "@/components/BottomMenu/BottomMenu";
import YoutubeSearch from "@/components/YoutubeSearch/YoutubeSearch";

export default function MainLayout({ video, chat, users, playlist, history, activities, permissions }) {
    return (
        <div className="min-h-screen bg-black flex">
            {/* Partie gauche scrollable */}
            <div className="flex-1 flex flex-col overflow-y-auto">
                {/* 🔍 Barre de recherche tout en haut */}
                <div className="bg-black  sticky top-0 z-50">
                    <YoutubeSearch />
                </div>

                {/* Zone vidéo fixe à 80vh */}
                <div className="w-full h-[80vh]">{video}</div>

                {/* Menu du bas */}
                <div className="p-2 min-h-[40vh]">
                    <BottomMenu users={users} activities={activities} permissions={permissions} />
                </div>

            </div>

            {/* Sidebar droite fixe */}
            <div className="w-1/5 h-[95vh] mx-4 pt-4 sticky top-0">
                <ChatSidebar chat={chat} playlist={playlist} history={history} />
            </div>
        </div>
    );
}
