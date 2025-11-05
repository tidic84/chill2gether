// src/components/UserList/UserList.jsx
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5173");

export default function UserList() {
    const [users, setUsers] = useState([]);

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
        <div className="space-y-2">
            <h2 className="font-bold text-red-500 ! text-lg">Utilisateurs connectés</h2>
            <ul className="space-y-1">
                {users.map((user) => (
                    <li
                        key={user.id}
                        className="flex items-center space-x-2 bg-gray-100 rounded px-2 py-1"
                    >
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>{user.name}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
