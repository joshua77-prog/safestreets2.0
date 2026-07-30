import React from 'react';

export function Card({ className = '', children }) {
	return <div className={`card ${className}`}>{children}</div>;
}

export function CardHeader({ className = '', children }) {
	return <div className={`card-header ${className}`}>{children}</div>;
}

export function CardTitle({ className = '', children }) {
	return <h3 className={`card-title ${className}`}>{children}</h3>;
}

export function CardDescription({ className = '', children }) {
	return <p className={`card-description ${className}`}>{children}</p>;
}

export function CardContent({ className = '', children }) {
	return <div className={`card-content ${className}`}>{children}</div>;
}



