import { QualityType } from '@/types/quality';

interface StatusBadgeProps {
  type: QualityType | string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ type, size = 'md' }: StatusBadgeProps) {
  const normalizedType = type.toUpperCase();

  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  if (normalizedType === 'REJECTION') {
    return (
      <span
        className={`inline-flex items-center font-bold tracking-wide rounded-md border bg-[#FF453A]/15 text-[#FF453A] border-[#FF453A]/30 uppercase ${sizeClasses}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#FF453A] mr-1.5"></span>
        Rejection
      </span>
    );
  }

  if (normalizedType === 'REWORK') {
    return (
      <span
        className={`inline-flex items-center font-bold tracking-wide rounded-md border bg-[#FF7900]/15 text-[#FF8C1A] border-[#FF7900]/30 uppercase ${sizeClasses}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#FF7900] mr-1.5"></span>
        Rework
      </span>
    );
  }

  if (normalizedType === 'FQC_FALLOUT' || normalizedType === 'FQC FALLOUT' || normalizedType === 'FQC') {
    return (
      <span
        className={`inline-flex items-center font-bold tracking-wide rounded-md border bg-[#A78BFA]/15 text-[#C4B5FD] border-[#A78BFA]/30 uppercase ${sizeClasses}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA] mr-1.5"></span>
        FQC Fallout
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-md border bg-[#141414] text-[#A6A6A6] border-[#242424] ${sizeClasses}`}
    >
      {type}
    </span>
  );
}
