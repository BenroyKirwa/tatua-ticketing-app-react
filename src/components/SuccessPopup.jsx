import React, { useEffect } from 'react';

const SuccessPopup = ({ message, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Auto-hide after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div id="successPopup" className="success-popup">
      <span id="successMessage">{message}</span>
    </div>
  );
};

export default SuccessPopup;