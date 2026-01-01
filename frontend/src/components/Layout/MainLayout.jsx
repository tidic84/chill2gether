import ChatSidebar from "@/components/ChatSidebar/ChatSidebar";
import BottomMenu from "@/components/BottomMenu/BottomMenu";

export default function MainLayout({ video, chat, users, playlist, search, history, activities, permissions }) {
    return (
        <div className="h-screen bg-black flex overflow-hidden">
            {/* Partie gauche scrollable */}
            <div className="flex-1 flex flex-col overflow-y-auto">
                {/* 🔍 Barre de recherche tout en haut */}
                <div className="w-full border-b border-gray-800 p-2 bg-gray-900 shrink-0">
                    {search}
                </div>
                
                {/* Zone vidéo fixe à 80vh - IMPORTANT: shrink-0 pour garder la hauteur */}
                <div className="w-full h-[80vh] shrink-0 bg-black">
                    {video}
                </div>
                
                {/* Menu du bas */}
                <div className="p-2 min-h-[40vh] bg-black">
                    <BottomMenu users={users} activities={activities} permissions={permissions} />
                </div>
            </div>

            {/* Sidebar droite fixe */}
            <div className="w-1/5 h-screen sticky top-0 shrink-0">
                <div className="h-full mx-4 pt-4">
                    <ChatSidebar chat={chat} playlist={playlist} history={history} />
                </div>
            </div>
        </div>
    );
}