import ChatSidebar from "@/components/ChatSidebar/ChatSidebar";
import BottomMenu from "@/components/BottomMenu/BottomMenu";

export default function MainLayout({ video, chat, users, playlist, search, history, activities, permissions }) {
    return (
        <div className="min-h-screen bg-zen-cream text-zen-charcoal flex flex-col">
            {/* Main Content Area */}
            <main className="flex-1 max-w-[1600px] w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* LEFT/CENTER AREA */}
                <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">

                    {/* Search & Video Section */}
                    <div className="flex flex-col gap-6">
                        {/* Search Bar */}
                        <div className="relative group w-full">
                            {search}
                        </div>

                        {/* Video Player */}
                        <div className="bg-white p-2 rounded-2xl shadow-sm border border-zen-warm-stone">
                            <div className="w-full aspect-video bg-zen-near-black rounded-xl overflow-hidden">
                                {video}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Panel - Users, Activities, Permissions */}
                    <div className="bg-white rounded-2xl shadow-sm border border-zen-warm-stone overflow-hidden min-h-[300px]">
                        <BottomMenu users={users} activities={activities} permissions={permissions} />
                    </div>
                </div>

                {/* RIGHT PANEL - Chat & Playlist */}
                <div className="lg:col-span-4 xl:col-span-3 flex flex-col min-h-[600px]">
                    <div className="flex-1 flex flex-col bg-white border border-zen-warm-stone rounded-2xl shadow-sm overflow-hidden">
                        <ChatSidebar chat={chat} playlist={playlist} history={history} />
                    </div>
                </div>
            </main>
        </div>
    );
}
