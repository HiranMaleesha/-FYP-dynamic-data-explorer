import React from 'react';

interface SummaryCardProps {
    title: string;
    value: string | number;
    icon?: React.ReactNode;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon }) => {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 min-h-[120px]">
            <div className="flex items-center justify-between h-full">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">{title}</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white break-words leading-tight mt-1">
                        {typeof value === 'string' && value.length > 15 ? (
                            <span className="text-lg" title={value}>
                                {value.length > 20 ? `${value.substring(0, 17)}...` : value}
                            </span>
                        ) : (
                            value
                        )}
                    </p>
                </div>
                {icon && (
                    <div className="text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SummaryCard;