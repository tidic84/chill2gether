export default function MainLayout({ video, chat, users, playlist,search }) {
    return (
        <div className="h-screen flex">
            {/* Zone principale */}
            <div className="flex-1 flex flex-col">

                <div className="w-1/3 border-r p-2 overflow-y-auto">
                    {search}
                </div>

                {/* Lecteur vidéo - force hauteur fixe ou relative à l'écran */}
                <div className="w-[80vw] h-full bg-black">
                    {video}
                </div>

                {/* Section sous la vidéo */}
                <div className="flex flex-1 h-[40vh]">
                    {/* Utilisateurs */}
                    <div className="w-1/3 border-r p-2 overflow-y-auto">
                        {users}
                    </div>

                    {/* Playlist */}
                    <div className="flex-1 p-2 overflow-y-auto">
                        {playlist}
                    </div>
                </div>

            </div>

            {/* Chat (colonne fixe à droite) */}
            <div className="w-1/5 h-screen border-l p-2 overflow-y-auto">
                {chat}
            </div>
        </div>
    );
}
