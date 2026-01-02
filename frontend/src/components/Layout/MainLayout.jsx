import ChatSidebar from "@/components/ChatSidebar/ChatSidebar";
import BottomMenu from "@/components/BottomMenu/BottomMenu";

export default function MainLayout({ video, chat, users, playlist, search, history, activities, permissions }) {
    return (
        <div className="min-h-screen bg-zen-bg text-zen-text flex flex-col">
            {/* Main Content Area */}
            <main className="flex-1 max-w-[1600px] w-full mx-auto p-6">
                <div className="flex gap-6">
                    {/* LEFT/CENTER AREA */}
                    <div className="flex-1 flex flex-col gap-6">

                        {/* Search & Video Section */}
                        <div className="flex flex-col gap-6">
                            {/* Search Bar */}
                            <div className="relative group w-full">
                                {search}
                            </div>

                            {/* Video Player */}
                            <div className="bg-white p-2 rounded-2xl shadow-sm border border-zen-border">
                                <div className="w-full aspect-video bg-black rounded-xl overflow-hidden">
                                    {video}
                                </div>
                            </div>
                        </div>

                        {/* Bottom Panel - Users, Activities, Permissions */}
                        <div className="bg-white rounded-2xl shadow-sm border border-zen-border overflow-hidden min-h-[300px]">
                            <BottomMenu users={users} activities={activities} permissions={permissions} />
                        </div>
                    </div>

                    {/* RIGHT PANEL - Chat & Playlist (STICKY) */}
                    <div className="hidden lg:block w-[350px] xl:w-[400px]">
                        <div className="sticky top-6 w-[350px] xl:w-[400px] h-[calc(100vh-8rem)] bg-white border border-zen-border rounded-2xl shadow-sm overflow-hidden">
                            <ChatSidebar chat={chat} playlist={playlist} history={history} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
