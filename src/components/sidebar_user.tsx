import { LogOut } from 'lucide-react';

export function SidebarUser({ name, role, onLogout }: { name: string; role: string; onLogout: () => void }) {
    return (
        <button className="sidebar-user" onClick={onLogout}>
        <span className="avatar">{name.slice(0, 1).toUpperCase()}</span>
        <span>
            <strong>{name}</strong>
            <small>{role}</small>
        </span>
        <LogOut size={17} />
        </button>
    );
}