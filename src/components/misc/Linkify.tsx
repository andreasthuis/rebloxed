import React from 'react';

interface LinkifyProps {
  text: string;
}

const Linkify: React.FC<LinkifyProps> = ({ text }) => {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;

  const parts = text.split(urlRegex);

  return (
    <div className="user-bio description">
      {parts.map((part, index) => {
        if (part.match(urlRegex)) {
          const href = part.startsWith('http') ? part : `https://${part}`;
          return (
            <a 
              key={index} 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#007bff', textDecoration: 'underline' }}
            >
              {part}
            </a>
          );
        }
        return part;
      })}
    </div>
  );
};

export default Linkify;