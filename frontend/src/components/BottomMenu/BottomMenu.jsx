import { useState } from "react";

export default function BottomMenu({ users, activities, permissions }) {
    const [activeTab, setActiveTab] = useState("users");

    return (
        <div className="w-full h-full bg-gray-700 text-gray-100 rounded-3xl shadow-lg overflow-hidden flex flex-col">
            {/* Header des onglets */}
            <div className="flex w-full ">
                <button
                    className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === "users"
                        ? "bg-gray-700"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        }`}
                    onClick={() => setActiveTab("users")}
                >
                    Utilisateurs
                </button>
                <button
                    className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === "activities"
                        ? "bg-gray-700"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        }`}
                    onClick={() => setActiveTab("activities")}
                >
                    Activités
                </button>
                <button
                    className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === "permissions"
                        ? "bg-gray-700"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        }`}
                    onClick={() => setActiveTab("permissions")}
                >
                    Permissions
                </button>
            </div>

            {/* Contenu adaptatif avec scroll si nécessaire */}
            <div className="flex-1 min-h-[40vh] overflow-y-auto p-3">
                {activeTab === "users" && users}
                {activeTab === "activities" && activities}
                {activeTab === "permissions" && permissions}
            </div>
        </div>
    );
}
