import React from "react";
import { useTheme } from "../../../context/ThemeContext";

const SkeletonDetails = () => {
    const { theme } = useTheme();

    return (
        <div className="max-w-4xl mx-auto p-6 rounded-xl shadow-md border animate-pulse"
            style={{ backgroundColor: theme.bg2, borderColor: theme.bg4 }}>
            
            {/* Header Skeleton */}
            <div className="flex gap-6 mb-6">
                <div className="w-24 h-24 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                <div className="flex flex-col w-full gap-3">
                    <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
                    <div className="flex justify-between items-end mt-4">
                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
                    </div>
                </div>
            </div>

            {/* Form Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex flex-col gap-2">
                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
                        <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SkeletonDetails;
