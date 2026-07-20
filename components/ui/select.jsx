import React from 'react';

export function Select({ value, onValueChange, children }) {
	return <div>{children}</div>;
}

export function SelectTrigger({ children }) {
	return <button className="h-10 w-full border rounded-md px-3 text-left">{children}</button>;
}

export function SelectValue() {
	return <span className="text-slate-600">Select…</span>;
}

export function SelectContent({ children }) {
	return <div className="mt-2 border rounded-md bg-white p-2" style={{ pointerEvents: 'auto', zIndex: 50 }}>{children}</div>;
}

export function SelectItem({ value, children, onClick }) {
	return (
		<div onClick={() => onClick && onClick(value)} className="px-2 py-1 cursor-pointer hover:bg-slate-50 rounded">
			{children}
		</div>
	);
}


