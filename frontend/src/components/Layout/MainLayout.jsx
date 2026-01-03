import ChatSidebar from "@/components/ChatSidebar/ChatSidebar";
import BottomMenu from "@/components/BottomMenu/BottomMenu";

export default function MainLayout({ video, chat, users, playlist, search, history, activities, permissions }) {
    return (
        <div className="w-full h-screen flex flex-col overflow-hidden bg-zen-bg dark:bg-zen-dark-bg">
            {/* Header */}
            <div className="flex-shrink-0">
                {/* header content si besoin */}
            </div>

            {/* Main content scrollable */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] xl:grid-cols-[1fr_400px] gap-6 p-6 max-w-[1600px] mx-auto mb-20 min-h-full">
                    {/* LEFT & CENTER PANELS - Scrollable */}
                    <div className="space-y-6">
                        {/* Video Player */}
                        <div className="bg-black rounded-2xl shadow-sm overflow-hidden w-full aspect-video">
                            {video}
                        </div>

                        {/* Bottom Panel - Users, Activities, Permissions */}
                        <div className="bg-white dark:bg-zen-dark-surface rounded-2xl shadow-sm border border-zen-border dark:border-zen-dark-border overflow-hidden min-h-[300px]">
                            <BottomMenu users={users} activities={activities} permissions={permissions} />
                        </div>
                    </div>

                    {/* RIGHT PANEL - Chat & Playlist (STICKY) */}
                    <div className="hidden lg:block">
                        <div className="sticky top-6 w-[350px] xl:w-[400px] h-[calc(100vh-8rem)] bg-white dark:bg-zen-dark-surface border border-zen-border dark:border-zen-dark-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
                            <ChatSidebar chat={chat} playlist={playlist} history={history} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
