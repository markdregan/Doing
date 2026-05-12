import { useState } from 'react';
import { useTaskStore } from '../store/useTaskStore';

interface AssigneePickerProps {
  taskId: string;
  currentAssigneeId: string | null;
  onClose: () => void;
}

export default function AssigneePicker({ taskId, currentAssigneeId, onClose }: AssigneePickerProps) {
  const [email, setEmail] = useState('');
  const [searching, setSearching] = useState(false);

  const assignTask = useTaskStore(s => s.assignTask);
  const unassignTask = useTaskStore(s => s.unassignTask);
  const getProfileByEmail = useTaskStore(s => s.getProfileByEmail);
  const profiles = useTaskStore(s => s.profiles);
  const projectShares = useTaskStore(s => s.projectShares);
  const tasks = useTaskStore(s => s.tasks);
  const task = tasks.find(t => t.id === taskId);

  const projectCollaboratorIds = task?.projectId
    ? projectShares
        .filter(s => s.projectId === task.projectId && s.status === 'active' && s.sharedWith)
        .map(s => s.sharedWith)
    : [];

  const collaborators = profiles.filter(p =>
    p.id !== currentAssigneeId &&
    projectCollaboratorIds.includes(p.id)
  );

  const currentAssignee = profiles.find(p => p.id === currentAssigneeId);

  const handleAssign = (userId: string) => {
    assignTask(taskId, userId);
    onClose();
  };

  const handleUnassign = () => {
    unassignTask(taskId);
    onClose();
  };

  const handleSearch = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) return;

    setSearching(true);
    const profile = await getProfileByEmail(trimmed);
    setSearching(false);

    if (profile) {
      handleAssign(profile.id);
    } else {
      alert('No user found with that email address.');
    }
  };

  return (
    <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-[#2C2C2E] rounded-lg shadow-xl border border-gray-100 dark:border-[#38383A] py-1 z-50 max-h-64 overflow-y-auto animate-fade-in">
      {currentAssignee && (
        <>
          <div className="px-3 py-1.5 text-xs text-gray-400 dark:text-[#636366]">
            Assigned to {currentAssignee.displayName}
          </div>
          <button
            onClick={handleUnassign}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-gray-50 dark:hover:bg-[#252526] text-red-400 transition-colors"
          >
            Remove assignment
          </button>
          <div className="border-t border-gray-100 dark:border-[#38383A] my-1" />
        </>
      )}

      <div className="px-3 py-1.5">
        <div className="flex gap-1">
          <input
            autoFocus
            type="email"
            placeholder="Email to assign..."
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
            className="flex-1 px-2 py-1 text-xs border border-gray-200 dark:border-[#38383A] rounded-md outline-none focus:border-gray-300 dark:focus:border-[#48484A] bg-transparent text-gray-900 dark:text-[#F5F5F5] placeholder:text-gray-400 dark:placeholder:text-[#636366]"
          />
          <button
            onClick={handleSearch}
            disabled={searching || !email.trim()}
            className="px-2 py-1 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-[#48484A] rounded-md transition-colors disabled:cursor-not-allowed"
          >
            {searching ? (
              <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : 'Go'}
          </button>
        </div>
      </div>

      {collaborators.length > 0 && (
        <>
          <div className="border-t border-gray-100 dark:border-[#38383A] my-1" />
          <div className="px-3 py-1 text-[10px] text-gray-400 dark:text-[#636366] uppercase tracking-[0.05em] font-semibold">
            Project Collaborators
          </div>
          {collaborators.map(profile => (
            <button
              key={profile.id}
              onClick={() => handleAssign(profile.id)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-gray-50 dark:hover:bg-[#252526] transition-colors"
            >
              <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-[#1C3A5C] flex items-center justify-center text-[9px] font-medium text-blue-600 dark:text-[#64B5F6]">
                {profile.displayName.charAt(0).toUpperCase()}
              </div>
              <span className="text-gray-700 dark:text-[#E5E5E5]">{profile.displayName}</span>
            </button>
          ))}
        </>
      )}

      {!currentAssignee && collaborators.length === 0 && (
        <p className="px-3 py-2 text-xs text-gray-400 dark:text-[#636366]">
          Enter an email to assign someone
        </p>
      )}
    </div>
  );
}
