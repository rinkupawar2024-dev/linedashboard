'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  XCircle,
  RotateCcw,
  ShieldAlert,
  BarChart3,
  FileText,
  Settings,
  Factory,
  CheckCircle2,
  Upload,
} from 'lucide-react';
import { useQualityData } from '@/context/QualityDataContext';

const NAV_ITEMS = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Line Rejection',
    href: '/rejection',
    icon: XCircle,
    color: 'text-[#FF453A]',
  },
  {
    name: 'Line Rework',
    href: '/rework',
    icon: RotateCcw,
    color: 'text-[#FF7900]',
  },
  {
    name: 'FQC Fallout',
    href: '/fqc-fallout',
    icon: ShieldAlert,
    color: 'text-[#A78BFA]',
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: FileText,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { hasData, importedFileName, setIsImportModalOpen } = useQualityData();

  return (
    <aside className="w-64 bg-[#080808] text-[#A6A6A6] flex flex-col shrink-0 min-h-screen border-r border-[#242424] select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#242424]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#FF7900] flex items-center justify-center text-white shadow-lg shadow-[#FF7900]/25">
            <Factory className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xs tracking-wider text-[#A6A6A6] uppercase">
              VE Commercial
            </span>
            <span className="text-[#FFFFFF] font-extrabold text-sm tracking-tight">
              Vehicle Limited
            </span>
          </div>
        </div>
        <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FF7900]/10 text-[#FF8C1A] border border-[#FF7900]/30">
          <span className="w-1.5 h-1.5 rounded-full bg-[#32C759] animate-pulse"></span>
          Quality Management System
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <div className="px-3 py-1.5 text-[11px] font-semibold text-[#707070] uppercase tracking-wider">
          Main Navigation
        </div>
        {NAV_ITEMS.map((item) => {
          const normalizedPathname = (pathname || '/').toLowerCase().replace(/\/+$/, '') || '/';
          const normalizedHref = (item.href || '/').toLowerCase().replace(/\/+$/, '') || '/';
          const isActive =
            normalizedHref === '/'
              ? normalizedPathname === '/'
              : normalizedPathname === normalizedHref || normalizedPathname.startsWith(`${normalizedHref}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-[#FF7900] text-white shadow-md shadow-[#FF7900]/30 font-bold'
                  : 'text-[#A6A6A6] hover:bg-[#141414] hover:text-[#FFFFFF]'
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-colors ${
                  isActive ? 'text-white' : item.color || 'text-[#707070] group-hover:text-[#FFFFFF]'
                }`}
              />
              <span className="truncate">{item.name}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-4 rounded-full bg-white" />
              )}
            </Link>
          );
        })}

        {/* Quick Import Action inside Sidebar */}
        <div className="pt-4 px-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold bg-[#FF7900]/15 text-[#FF8C1A] border border-[#FF7900]/30 hover:bg-[#FF7900] hover:text-white transition-all group shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
            <span>Import Excel File</span>
          </button>
        </div>
      </nav>

      {/* System Status Footer */}
      <div className="p-4 border-t border-[#242424] bg-[#0C0C0C]">
        <div className="rounded-lg bg-[#111111] border border-[#242424] p-3">
          <div className="flex items-center justify-between text-xs font-semibold text-[#A6A6A6] mb-1">
            <span className="flex items-center gap-1.5 text-[#FFFFFF]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#32C759]" />
              Data Source
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                hasData
                  ? 'bg-[#32C759]/15 text-[#32C759] border-[#32C759]/40'
                  : 'bg-[#FF9F0A]/15 text-[#FF9F0A] border-[#FF9F0A]/40'
              }`}
            >
              {hasData ? 'Excel File' : 'No Data'}
            </span>
          </div>
          <p className="text-[11px] text-[#707070] leading-tight mt-1 truncate">
            {hasData
              ? importedFileName
              : 'Upload Excel to view records.'}
          </p>
        </div>
      </div>
    </aside>
  );
}
