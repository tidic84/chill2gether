export default function UserList({ users = [] }) {

    return (
        <div className="p-4">
            <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                    Utilisateurs ({users.length})
                </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {users.length === 0 ? (
                    <div className="col-span-full text-center text-gray-500 py-8">
                        Aucun utilisateur dans cette room
                    </div>
                ) : (
                    users.map((user) => (
                        <div
                            key={user.userId}
                            className="flex items-center space-x-3 bg-gray-100 rounded-lg p-3 shadow hover:shadow-md transition-shadow"
                        >
                            {/* Avatar */}
                            <div className="w-12 h-12 flex-shrink-0 bg-gray-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                {user.username.charAt(0).toUpperCase()}
                            </div>

                            {/* Infos utilisateur */}
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="font-medium text-gray-800 truncate">{user.username}</span>
                                <span className="text-xs text-gray-500">
                                    {new Date(user.connectedAt).toLocaleTimeString()}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

}
