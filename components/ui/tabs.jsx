import React, { createContext, useContext } from 'react';

const TabsContext = createContext({
	value: '',
	onValueChange: () => {}
});

export function Tabs({ value, onValueChange, children, className = '' }) {
	return (
		<TabsContext.Provider value={{ value, onValueChange }}>
			<div className={className}>{children}</div>
		</TabsContext.Provider>
	);
}

export function TabsList({ className = '', children }) {
	return <div className={className}>{children}</div>;
}

export function TabsTrigger({ value, children, className = '', ...props }) {
	const context = useContext(TabsContext);
	const isActive = context.value === value;

	return (
		<button
			type="button"
			{...props}
			data-state={isActive ? 'active' : 'inactive'}
			onClick={(e) => {
				if (props.onClick) props.onClick(e);
				if (context.onValueChange) context.onValueChange(value);
			}}
			className={`${className} ${isActive ? 'active' : ''}`}
		>
			{children}
		</button>
	);
}

export function TabsContent({ value, children, className = '' }) {
	const context = useContext(TabsContext);
	if (context.value !== value) return null;

	return <div className={className}>{children}</div>;
}



