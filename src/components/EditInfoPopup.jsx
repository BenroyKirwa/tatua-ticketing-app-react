import React, { useState } from 'react';


const EditTicketPopup = ({ ticket, onSave, onClose }) => {
  const [formData, setFormData] = useState({ ...ticket });
  const [newFile, setNewFile] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setNewFile(files[0]);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let updatedTicket = { ...formData };

    if (newFile) {
      // Upload new file to server
      const formDataToSend = new FormData();
      formDataToSend.append('file', newFile);
      try {
        const response = await fetch('http://172.20.94.31:3000/api/upload', {
          method: 'POST',
          body: formDataToSend,
        });
        if (!response.ok) throw new Error('Upload failed');
        const data = await response.json();
        updatedTicket.attachment = newFile.name;
        updatedTicket.attachmentUrl = data.url;
      } catch (error) {
        alert('Failed to upload new attachment: ' + error.message);
        return;
      }
    }

    onSave(updatedTicket);
    onClose();
  };

  if (!ticket) return null;

  return (
    <div className="popup" style={{ display: 'block' }}>
      <div className="popup-content">
        <div className="edit-header">
          <h2>Edit Ticket</h2>
          <img
            className="close"
            src="/cancel.svg"
            alt="Close"
            width="20"
            height="20"
            onClick={onClose}
          />
        </div>
        <div className="edit-body">
          <form id="editTicketForm" onSubmit={handleSubmit}>
            <p><strong>Ticket ID:</strong> {ticket.id}</p>
            <label>
              Full Name:
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
              />
            </label><br />
            <label>
              Email:
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </label><br />
            <label>
              Phone:
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </label><br />
            <label>
              Subject:
              <select
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
              >
                <option value="Technical Issue">Technical Issue</option>
                <option value="Billing">Billing</option>
                {/* Add more options as needed */}
              </select>
            </label><br />
            <label>
              Message:
              <textarea
                name="description" // Adjusted to match your data
                value={formData.description}
                onChange={handleInputChange}
              />
            </label><br />
            <label>
              Preferred Contact:
              <input
                type="radio"
                name="preferredContact"
                value="email"
                checked={formData.preferredContact === 'email'}
                onChange={handleInputChange}
              /> Email
              <input
                type="radio"
                name="preferredContact"
                value="phone"
                checked={formData.preferredContact === 'phone'}
                onChange={handleInputChange}
              /> Phone
            </label><br />
            <label>
              Attachment: <span>{formData.attachment || 'None'}</span>
              <input
                type="file"
                name="attachment"
                accept=".jpg,.png,.pdf"
                onChange={handleInputChange}
              />
            </label><br />
            <button type="submit">Save Changes</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditTicketPopup;