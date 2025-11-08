import React from 'react';

interface LoaderProps {
  message: string;
}

const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div className="absolute inset-0 bg-black/75 backdrop-blur-md flex flex-col justify-center items-center z-50">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-cyan-500"></div>
      <p className="mt-4 text-lg text-gray-200 font-medium tracking-wide">{message}</p>
    </div>
  );
};

export default Loader;