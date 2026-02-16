// src/components/bracket/MatchCard.tsx

const RobotIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>
);

export const MatchCard = ({ match, isLastRound }: { match: any, isLastRound: boolean }) => {
  // Protección contra nulos
  if (!match) return null;

  const p1 = match.inscriptionA;
  const p2 = match.inscriptionB;

  return (
    <div className="relative flex items-center my-4 group">
      {/* Tarjeta */}
      <div className="w-64 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-lg hover:border-blue-500/50 transition-colors z-10 relative">
        <div className="absolute top-0 right-0 w-3 h-3 bg-slate-800 border-b border-l border-slate-700"></div>

        {/* Participante 1 */}
        <div className={`px-3 py-2 border-b border-slate-800 flex items-center justify-between ${match.result === 'A_WINS' ? 'bg-emerald-900/20' : ''}`}>
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-slate-500"><RobotIcon /></span>
            <div className="flex flex-col">
                <span className={`text-sm font-bold truncate ${!p1 ? 'text-slate-600' : 'text-slate-200'}`}>
                  {p1 ? p1.robot?.nombre : 'TBD'}
                </span>
                {p1 && <span className="text-[10px] text-slate-500 uppercase">{p1.robot?.competitor?.club?.nombre || 'Indep.'}</span>}
            </div>
          </div>
          {match.result && (
             <span className={`text-xs font-bold ${match.result === 'A_WINS' ? 'text-emerald-400' : 'text-red-400'}`}>
                {match.result === 'A_WINS' ? 'W' : 'L'}
             </span>
          )}
        </div>

        {/* Participante 2 */}
        <div className={`px-3 py-2 flex items-center justify-between ${match.result === 'B_WINS' ? 'bg-emerald-900/20' : ''}`}>
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-slate-500"><RobotIcon /></span>
            <div className="flex flex-col">
                <span className={`text-sm font-bold truncate ${!p2 ? 'text-slate-600' : 'text-slate-200'}`}>
                  {p2 ? p2.robot?.nombre : (match.round === 1 ? 'BYE' : 'TBD')}
                </span>
                {p2 && <span className="text-[10px] text-slate-500 uppercase">{p2.robot?.competitor?.club?.nombre || 'Indep.'}</span>}
            </div>
          </div>
          {match.result && (
             <span className={`text-xs font-bold ${match.result === 'B_WINS' ? 'text-emerald-400' : 'text-red-400'}`}>
                {match.result === 'B_WINS' ? 'W' : 'L'}
             </span>
          )}
        </div>
      </div>

      {/* Líneas Conectoras */}
      {!isLastRound && (
        <div className={`absolute -right-8 w-8 border-r-2 border-slate-700 pointer-events-none
           ${match.matchIndex % 2 === 0 
              ? 'top-1/2 h-[calc(100%+2rem)] rounded-tr-lg border-t-2' 
              : 'bottom-1/2 h-[calc(100%+2rem)] rounded-br-lg border-b-2'
            }
        `} />
      )}
      {!isLastRound && <div className="absolute left-[100%] top-1/2 w-8 h-0.5 bg-slate-700"></div>}
    </div>
  );
};