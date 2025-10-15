"use client";

import { useState } from "react";

interface RefreshButtonProps {
  onRefresh: () => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export default function RefreshButton({
  onRefresh,
  isLoading = false,
  className = "",
}: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing || isLoading) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const isDisabled = isRefreshing || isLoading;

  return (
    <button
      onClick={handleRefresh}
      disabled={isDisabled}
      className={`
        bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full p-3
        shadow-lg hover:shadow-xl transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-95 transform
        ${className}
      `}
      title="データを更新"
    >
      <svg
        className={`w-5 h-5 text-gray-700 transition-transform duration-200 ${
          isRefreshing ? "animate-spin" : ""
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
    </button>
  );
}
