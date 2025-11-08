import React from 'react';

const Logo: React.FC = () => {
    return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="logo-gradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#67e8f9"/>
                    <stop offset="100%" stopColor="#c026d3"/>
                </linearGradient>
            </defs>
            <path d="M12 4.155L5.5 8.028V15.972L12 19.845L18.5 15.972V8.028L12 4.155Z" stroke="url(#logo-gradient)" strokeWidth="1.5"/>
            <path d="M12 4.155L18.5 8.028L12 11.9L5.5 8.028L12 4.155Z" fill="url(#logo-gradient)" fillOpacity="0.3"/>
            <path d="M5.5 8.028L5.5 15.972L12 11.9L5.5 8.028Z" fill="url(#logo-gradient)" fillOpacity="0.3"/>
            <path d="M12 19.845L5.5 15.972L12 11.9L12 19.845Z" fill="url(#logo-gradient)" fillOpacity="0.5"/>
            <path d="M12 19.845L18.5 15.972L12 11.9L12 19.845Z" fill="url(#logo-gradient)" fillOpacity="0.3"/>
            <path d="M18.5 15.972V8.028L12 11.9L18.5 15.972Z" fill="url(#logo-gradient)" fillOpacity="0.3"/>
            <path d="M12 10.5L12.5 11.5L13.5 12L12.5 12.5L12 13.5L11.5 12.5L10.5 12L11.5 11.5L12 10.5Z" fill="#f9fafb"/>
        </svg>
    );
};

export default Logo;
