import { useState } from "react";

export default function BottomMenu({ users, activities, permissions }) {
    const [activeTab, setActiveTab] = useState("users");

    return (
        <div className="w-full h-full bg-white dark:bg-zen-dark-surface text-zen-text dark:text-zen-dark-text flex flex-col">
            {/* Tab Navigation */}
            <div className="flex border-b border-zen-border dark:border-zen-dark-border px-6 pt-4">
                <button
                    onClick={() => setActiveTab("users")}
                    className={`pb-4 px-2 text-sm font-semibold transition-colors relative mr-6 ${
                        activeTab === "users" ? "text-zen-sage dark:text-zen-dark-sage" : "text-zen-stone dark:text-zen-dark-stone hover:text-zen-stone dark:hover:text-zen-dark-stone"
                    }`}
                >
                    Utilisateurs
                    {activeTab === "users" && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-zen-sage dark:bg-zen-dark-sage rounded-t-full"></div>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("activities")}
                    className={`pb-4 px-2 text-sm font-semibold transition-colors relative mr-6 ${
                        activeTab === "activities" ? "text-zen-sage dark:text-zen-dark-sage" : "text-zen-stone dark:text-zen-dark-stone hover:text-zen-stone dark:hover:text-zen-dark-stone"
                    }`}
                >
                    Activités
                    {activeTab === "activities" && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-zen-sage dark:bg-zen-dark-sage rounded-t-full"></div>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("permissions")}
                    className={`pb-4 px-2 text-sm font-semibold transition-colors relative ${
                        activeTab === "permissions" ? "text-zen-sage dark:text-zen-dark-sage" : "text-zen-stone dark:text-zen-dark-stone hover:text-zen-stone dark:hover:text-zen-dark-stone"
                    }`}
                >
                    Paramètres
                    {activeTab === "permissions" && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-zen-sage dark:bg-zen-dark-sage rounded-t-full"></div>
                    )}
                </button>
            </div>

            {/* Tab Content */}
            <div className="p-6 bg-zen-surface dark:bg-zen-dark-surface flex-1 overflow-y-auto">
                {activeTab === "users" && users}
                {activeTab === "activities" && activities}
                {activeTab === "permissions" && permissions}
            </div>
        </div>
    );
}
