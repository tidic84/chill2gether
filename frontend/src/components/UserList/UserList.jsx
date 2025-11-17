import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5173");

// 20 utilisateurs fictifs
const fakeUsers = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    name: `Utilisateur ${i + 1}`,
}));

export default function UserList() {
    const [users, setUsers] = useState(fakeUsers);

    useEffect(() => {
        // Quand on reçoit la liste complète des utilisateurs connectés
        socket.on("users", (userList) => {
            setUsers(userList);
        });

        // Quand un nouvel utilisateur rejoint
        socket.on("user joined", (user) => {
            setUsers((prev) => [...prev, user]);
        });

        // Quand un utilisateur part
        socket.on("user left", (userId) => {
            setUsers((prev) => prev.filter((u) => u.id !== userId));
        });

        return () => {
            socket.off("users");
            socket.off("user joined");
            socket.off("user left");
        };
    }, []);

    return (
        <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {users.map((user) => (
                    <div
                        key={user.id}
                        className="flex items-center space-x-3 bg-gray-100 rounded-lg p-3 shadow hover:shadow-md transition-shadow"
                    >
                        {/* Avatar */}
                        <div className="w-12 h-12 flex-shrink-0 rounded-full bg-gray-400 overflow-hidden">
                            {user.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            ) : null}
                        </div>

                        {/* Infos utilisateur */}
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-800">{user.name}</span>
                            <span className="text-sm text-gray-500">{user.role}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

}
