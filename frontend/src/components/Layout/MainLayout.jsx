import ChatSidebar from "@/components/ChatSidebar/ChatSidebar";
import BottomMenu from "@/components/BottomMenu/BottomMenu";


export default function MainLayout({ video, chat, users, playlist, search, history, activities, permissions }) {
    return (
        <div className="w-full h-screen flex flex-col bg-zen-bg dark:bg-zen-dark-bg text-zen-text dark:text-zen-dark-text overflow-hidden">
            {/* Main Content Area - Scrollable */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden">
                <div className="max-w-[1600px] w-full mx-auto p-6 pb-20">
                    {/* Ajout de pb-20 pour padding-bottom */}
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
                                <div className="bg-white dark:bg-zen-dark-surface p-2 rounded-2xl shadow-sm border border-zen-border dark:border-zen-dark-border">
                                    <div className="w-full aspect-video bg-black rounded-xl overflow-hidden">
                                        {video}
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Panel - Users, Activities, Permissions */}
                            <div className="bg-white dark:bg-zen-dark-surface rounded-2xl shadow-sm border border-zen-border dark:border-zen-dark-border overflow-hidden min-h-[300px] mb-6">
                                {/* Ajout de mb-6 pour plus d'espace */}
                                <BottomMenu users={users} activities={activities} permissions={permissions} />
                            </div>
                        </div>

                        {/* RIGHT PANEL - Chat & Playlist (STICKY) */}
                        <div className="hidden lg:block w-[350px] xl:w-[400px]">
                            <div className="sticky top-[0.5rem] w-[350px] xl:w-[400px] h-[calc(100vh-6.5rem)] bg-white dark:bg-zen-dark-surface border border-zen-border dark:border-zen-dark-border rounded-2xl shadow-sm overflow-hidden">
                                <ChatSidebar chat={chat} playlist={playlist} history={history} />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
