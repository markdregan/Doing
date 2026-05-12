import { SearchIcon } from '../lib/icons';

interface TopBarProps {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
  onSearchClick: () => void;
}

export default function TopBar({ title, subtitle, onMenuClick, onSearchClick }: TopBarProps) {
  return (
    <div className="md:hidden flex items-center h-[52px] px-4 border-b border-gray-100 dark:border-[#2C2C2E] bg-white dark:bg-[#151516] flex-shrink-0">
      <button
        onClick={onMenuClick}
        className="p-1 -ml-1 text-gray-400 dark:text-[#636366] hover:text-gray-600 dark:hover:text-[#98989D] transition-colors"
        title="Menu"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M3 5h14M3 10h14M3 15h14" />
        </svg>
      </button>
      <div className="ml-3 flex-1 min-w-0">
        <h1 className="text-[17px] font-bold text-gray-900 dark:text-[#F5F5F5] truncate">{title}</h1>
        {subtitle && (
          <p className="text-[11px] text-gray-400 dark:text-[#636366] leading-tight -mt-0.5">{subtitle}</p>
        )}
      </div>
      <button
        onClick={onSearchClick}
        className="p-1 -mr-1 text-gray-400 dark:text-[#636366] hover:text-gray-600 dark:hover:text-[#98989D] transition-colors"
        title="Search"
      >
        <SearchIcon size={18} />
      </button>
    </div>
  );
}
