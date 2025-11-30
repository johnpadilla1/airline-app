function StatusBadge({ status, size = 'md' }) {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'ON_TIME':
        return {
          label: 'On Time',
          className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          dotColor: 'bg-emerald-400',
        };
      case 'SCHEDULED':
        return {
          label: 'Scheduled',
          className: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
          dotColor: 'bg-slate-400',
        };
      case 'DELAYED':
        return {
          label: 'Delayed',
          className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          dotColor: 'bg-amber-400',
          pulse: true,
        };
      case 'BOARDING':
        return {
          label: 'Boarding',
          className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
          dotColor: 'bg-cyan-400',
          pulse: true,
        };
      case 'DEPARTED':
      case 'IN_FLIGHT':
        return {
          label: status === 'DEPARTED' ? 'Departed' : 'In Flight',
          className: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
          dotColor: 'bg-violet-400',
          pulse: true,
        };
      case 'ARRIVED':
      case 'LANDED':
        return {
          label: status === 'ARRIVED' ? 'Arrived' : 'Landed',
          className: 'bg-white/10 text-slate-300 border-white/20',
          dotColor: 'bg-white',
        };
      case 'CANCELLED':
        return {
          label: 'Cancelled',
          className: 'bg-red-500/10 text-red-400 border-red-500/20',
          dotColor: 'bg-red-400',
        };
      case 'DIVERTED':
        return {
          label: 'Diverted',
          className: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
          dotColor: 'bg-orange-400',
        };
      default:
        return {
          label: status?.replace('_', ' ') || 'Unknown',
          className: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
          dotColor: 'bg-slate-400',
        };
    }
  };

  const config = getStatusConfig(status);

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  };

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border uppercase tracking-wider ${config.className} ${sizeClasses[size]}`}
    >
      <span className="relative flex">
        <span className={`${dotSizes[size]} rounded-full ${config.dotColor}`} />
        {config.pulse && (
          <span className={`absolute inset-0 ${dotSizes[size]} rounded-full ${config.dotColor} animate-ping opacity-75`} />
        )}
      </span>
      <span>{config.label}</span>
    </span>
  );
}

export default StatusBadge;
