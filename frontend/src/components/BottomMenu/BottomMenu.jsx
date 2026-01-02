import { useState } from "react";

export default function BottomMenu({ users, activities, permissions }) {
    const [activeTab, setActiveTab] = useState("users");

    return (
        <div className="w-full h-full bg-white text-zen-text flex flex-col">
            {/* Tab Navigation */}
            <div className="flex border-b border-zen-border px-6 pt-4">
                <button
                    onClick={() => setActiveTab("users")}
                    className={`pb-4 px-2 text-sm font-semibold transition-colors relative mr-6 ${
                        activeTab === "users" ? "text-zen-sage" : "text-zen-stone hover:text-zen-stone"
                    }`}
                >
                    Utilisateurs
                    {activeTab === "users" && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-zen-sage rounded-t-full"></div>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("activities")}
                    className={`pb-4 px-2 text-sm font-semibold transition-colors relative mr-6 ${
                        activeTab === "activities" ? "text-zen-sage" : "text-zen-stone hover:text-zen-stone"
                    }`}
                >
                    Activités
                    {activeTab === "activities" && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-zen-sage rounded-t-full"></div>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("permissions")}
                    className={`pb-4 px-2 text-sm font-semibold transition-colors relative ${
                        activeTab === "permissions" ? "text-zen-sage" : "text-zen-stone hover:text-zen-stone"
                    }`}
                >
                    Paramètres
                    {activeTab === "permissions" && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-zen-sage rounded-t-full"></div>
                    )}
                </button>
            </div>

            {/* Tab Content */}
            <div className="p-6 bg-zen-surface flex-1 overflow-y-auto">
                {activeTab === "users" && users}
                {activeTab === "activities" && activities}
                {activeTab === "permissions" && permissions}
            </div>
        </div>
    );
}
