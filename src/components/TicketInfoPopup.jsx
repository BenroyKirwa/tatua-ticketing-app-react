import React from 'react';


const TicketInfoPopup = ({ ticket, onClose }) => {
  if (!ticket) return null;

  let previewHTML = 'No preview available.';
  if (ticket.attachmentUrl) {
    const fileType = ticket.attachment?.split('.').pop().toLowerCase();
    if (fileType === 'jpg' || fileType === 'png') {
      previewHTML = (
        <img
          src={ticket.attachmentUrl}
          alt="Attachment Preview"
          style={{ maxWidth: '100%', maxHeight: '300px' }}
        />
      );
    } else if (fileType === 'pdf') {
      previewHTML = (
        <embed
          src={ticket.attachmentUrl}
          type="application/pdf"
          width="100%"
          height="300px"
        />
      );
    }
  }

  return (
    <div className="popup" style={{ display: 'block' }}>
      <div className="popup-content">
        <div className="info-header">
          <h2>Ticket Details</h2>
          <img
            className="close"
            src="/cancel.svg" // Adjust path as needed
            alt="Close"
            width="20"
            height="20"
            onClick={onClose}
          />
        </div>
        <div className="info-body">
          <p><strong>Ticket ID:</strong> {ticket.id}</p>
          <p><strong>Name:</strong> {ticket.fullName}</p>
          <p><strong>Email:</strong> {ticket.email}</p>
          <p><strong>Phone:</strong> {ticket.phone}</p>
          <p><strong>Subject:</strong> {ticket.subject}</p>
          <p><strong>Message:</strong> {ticket.description}</p> {/* Adjusted to match your data */}
          <p><strong>Preferred Contact:</strong> {ticket.preferredContact}</p>
          <p><strong>Attachment:</strong> {ticket.attachment || 'None'}</p>
          <div><strong>Preview:</strong><br />{previewHTML}</div>
          <p><strong>Date:</strong> {new Date(ticket.created_at).toLocaleString()}</p> {/* Adjusted field */}
        </div>
      </div>
    </div>
  );
};

export default TicketInfoPopup;