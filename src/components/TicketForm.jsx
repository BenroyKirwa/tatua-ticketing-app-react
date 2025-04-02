import React, { useState } from 'react';
import SuccessPopup from './SuccessPopup';

const TicketForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    preferredContact: 'email',
    attachment: null,
    termsAccepted: false,
  });

  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState({}); // State for validation errors

  const allowedFileTypes = ['application/pdf', 'image/png', 'image/jpeg']; // MIME types for .pdf, .png, .jpg

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    if (!formData.termsAccepted) newErrors.termsAccepted = 'You must accept the terms and conditions';

    if (formData.attachment) {
      const fileType = formData.attachment.type;
      if (!allowedFileTypes.includes(fileType)) {
        newErrors.attachment = 'Only PDF, PNG, and JPG files are allowed';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return true if no errors
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'file') {
      const file = files[0];
      setFormData((prev) => ({ ...prev, attachment: file }));
      if (file && !allowedFileTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          attachment: 'Only PDF, PNG, and JPG files are allowed',
        }));
      } else {
        setErrors((prev) => ({ ...prev, attachment: '' }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    // Clear error for the field on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return; // Stop submission if validation fails
    }

    let attachmentUrl = null;
    if (formData.attachment) {
      const formDataToSend = new FormData();
      formDataToSend.append('file', formData.attachment);
      try {
        const response = await fetch('http://172.20.94.31:3000/api/upload', {
          method: 'POST',
          body: formDataToSend,
        });
        if (!response.ok) throw new Error(`Upload failed with status: ${response.status}`);
        const data = await response.json();
        attachmentUrl = data.url;
      } catch (error) {
        console.error('Upload error:', error);
        setErrors((prev) => ({ ...prev, attachment: 'Failed to upload attachment' }));
        return;
      }
    }

    const newTicket = {
      id: Date.now(),
      subject: formData.subject,
      description: formData.message,
      fullName: formData.fullName,
      created_at: new Date().toISOString(),
      email: formData.email,
      phone: formData.phone,
      preferredContact: formData.preferredContact,
      attachment: formData.attachment ? formData.attachment.name : null,
      attachmentUrl, // Store the server URL
    };
    onSubmit(newTicket);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
      preferredContact: 'email',
      attachment: null,
      termsAccepted: false,
    });
    setSuccessMessage('Ticket submitted successfully!');
  };

  return (
    <div className="container">
      <p>Have any enquiries? Fill this form and we will get back to you as soon as possible</p>
      <form onSubmit={handleFormSubmit}>
        <div className="formCont">
          <label htmlFor="fullName">Full Name: {errors.fullName && <span className="error">{errors.fullName}</span>}</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            required
            
          />
        </div>
        <div className="formCont">
          <label htmlFor="email">Email Address: {errors.email && <span className="error">{errors.email}</span>}</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="formCont">
          <label htmlFor="phone">Phone Number: {errors.phone && <span className="error">{errors.phone}</span>}</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
          />
        </div>
        <div className="formCont">
          <label htmlFor="subject">Subject: {errors.subject && <span className="error">{errors.subject}</span>}</label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="formCont">
          <label htmlFor="message">Message: {errors.message && <span className="error">{errors.message}</span>}</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="formCont">
          <label>Preferred Contact:</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="preferredContact"
                value="email"
                checked={formData.preferredContact === 'email'}
                onChange={handleInputChange}
              />
              Email
            </label>
            <label>
              <input
                type="radio"
                name="preferredContact"
                value="phone"
                checked={formData.preferredContact === 'phone'}
                onChange={handleInputChange}
              />
              Phone
            </label>
          </div>
        </div>
        <div className="formCont">
          <label htmlFor="attachment">Attachment: {errors.attachment && <span className="error">{errors.attachment}</span>}</label>
          <input
            type="file"
            id="attachment"
            name="attachment"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleInputChange}
          />
        </div>
        <div className="formCont">
          <label>
            <input
              type="checkbox"
              name="termsAccepted"
              checked={formData.termsAccepted}
              onChange={handleInputChange}
            />
            I agree to the <a href="#">Terms and Conditions</a>
            {errors.termsAccepted && <span className="error">{errors.termsAccepted}</span>}
          </label>
        </div>
        <button type="submit" className="submitBtn">
          Submit
        </button>
      </form>
      <SuccessPopup
        message={successMessage}
        onClose={() => setSuccessMessage('')}
      />
    </div>
  );
};

export default TicketForm;