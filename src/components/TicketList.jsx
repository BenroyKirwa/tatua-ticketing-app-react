import React, { useState } from 'react';
import DynamicTable from './Table';
import TicketInfoPopup from './TicketInfoPopup';
import EditTicketPopup from './EditInfoPopup';
import infoIcon from '/information.svg';
import downIcon from '/download.svg';
import phoneIcon from '/phone.svg';
import emailIcon from '/email.svg';
import editIcon from '/edit.svg';
import deleteIcon from '/trash.svg';

const TicketsList = ({ tickets, setTickets, onRefresh}) => {
    const [selectedTicketId, setSelectedTicketId] = useState(null);
    const [isInfoPopupOpen, setIsInfoPopupOpen] = useState(false);
    const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);

    const deleteTicket = (id) => {
        const updatedTickets = tickets.filter((ticket) => ticket.id !== id);
        setTickets(updatedTickets);
        localStorage.setItem('tickets', JSON.stringify(updatedTickets));
    };

    const downloadAttachment = async (id) => {
        const ticket = tickets.find((ticket) => Number(ticket.id) === Number(id));
        if (!ticket) {
            alert('Ticket not found.');
            return;
        }
        if (ticket.attachmentUrl) {
            try {
                const response = await fetch(ticket.attachmentUrl);
                if (!response.ok) throw new Error('Failed to fetch file');
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = ticket.attachment || 'attachment';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            } catch (error) {
                alert('Failed to download attachment: ' + error.message);
            }
        } else {
            alert('No attachment available for this ticket.');
        }
    };

    const showInfo = (id) => {
        setSelectedTicketId(id);
        setIsInfoPopupOpen(true);
    };

    const editTicket = (id) => {
        setSelectedTicketId(id);
        setIsEditPopupOpen(true);
    };

    const handleSaveTicket = (updatedTicket) => {
        const updatedTickets = tickets.map((ticket) =>
            ticket.id === updatedTicket.id ? updatedTicket : ticket
        );
        setTickets(updatedTickets);
        localStorage.setItem('tickets', JSON.stringify(updatedTickets));
        setIsEditPopupOpen(false);
    };

    const triggerCall = (phone) => {
        console.log(`Call ${phone}`); // Replace with actual call logic
    };

    const sendEmail = (email) => {
        console.log(`Email ${email}`); // Replace with actual email logic
    };

    const handleRefresh = () => {
        const storedTickets = JSON.parse(localStorage.getItem('tickets')) || [];
        setTickets(storedTickets);
        console.log('Tickets refreshed from localStorage:', storedTickets);
    };

    const ticketColumns = [
        { key: 'id', label: 'ID', type: 'number', isSort: true},
        {
            key: 'raisedBy', label: 'Raised By', isSort: false,
            formatter: (value, item) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{item.fullName || 'N/A'}</span>
                    <span style={{ fontSize: '0.9em' }}>
                        {item.preferredContact === 'email' ? item.email : item.preferredContact === 'phone' ? item.phone : 'N/A'}
                    </span>
                </div>
            ),
        },
        {
            key: 'ticketDetails', label: 'Ticket Detials', isSort: false,
            formatter: (value, item) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{item.subject || 'N/A'}</span>
                    <span style={{ fontSize: '0.9em' }}>
                        {item.description}
                    </span>
                </div>
            ),
        },
        {
            key: 'created_at',
            label: 'Created Date',
            type: 'date',
            isSort: true,
            formatter: (value) => new Date(value).toLocaleDateString(),
        },
        {
            key: 'actions', label: 'Actions', isSort: false,
            formatter: (_, item) => (
                <div className="actions">
                    <button className="action-btn view-btn" onClick={() => showInfo(item.id)} title="View Ticket" data-id="${ticket.id}"><img alt="image" src={infoIcon} width="20" height="20" /></button>
                    <button onClick={() => downloadAttachment(item.id)} className="action-btn download-btn"><img alt="image" src={downIcon} width="20" height="20" /></button>
                    <button className="action-btn contact-btn" onClick={() => triggerCall(item.phone)} title="Contact" data-id="${ticket.id}"><img alt="image" src={phoneIcon} width="20" height="20" /></button>
                    <button className="action-btn email-btn" onClick={() => sendEmail(item.email)} title="Send Email" data-id="${ticket.id}"><img alt="image" src={emailIcon} width="20" height="20" /></button>
                    <button className="action-btn edit-btn" onClick={() => editTicket(item.id)} title="Edit Ticket" data-id="${ticket.id}"><img alt="image" src={editIcon} width="20" height="20" /></button>
                    <button className="action-btn delete-btn" title="Delete Ticket" onClick={() => deleteTicket(item.id)} ><img alt="image" src={deleteIcon} width="20" height="20" /></button>
                </div>
            ),
        },
        {
            key: 'fullName', label: 'Full Name', type: 'string', isSort: true, hide:true,
            formatter: (data, item) => (
                <span>{item.fullName || 'N/A'}</span>
            ),
        },
        {
            key: 'email', label: 'Email', type: 'string', isSort: true, hide:true,
            formatter: (data, item) => (
                <span>{item.email || 'N/A'}</span>
            ),
        },
        {
            key: 'phone', label: 'Phone', type: 'string', isSort: true, hide:true,
            formatter: (data, item) => (
                <span>{item.phone || 'N/A'}</span>
            ),
        },
        {
            key: 'subject', label: 'Subject', type: 'string', isSort: true, hide:true,
            formatter: (data, item) => (
                <span>{item.subject || 'N/A'}</span>
            ),
        },
    ];

    const selectedTicket = tickets.find((ticket) => Number(ticket.id) === Number(selectedTicketId));

    return (
        <div className="container">
            <h1>Tickets List</h1>
            <DynamicTable
                data={tickets}
                columns={ticketColumns}
                onRefresh={handleRefresh}
            />
            {isInfoPopupOpen && (
                <TicketInfoPopup
                    ticket={selectedTicket}
                    onClose={() => setIsInfoPopupOpen(false)}
                />
            )}
            {isEditPopupOpen && (
                <EditTicketPopup
                    ticket={selectedTicket}
                    onSave={handleSaveTicket}
                    onClose={() => setIsEditPopupOpen(false)}
                />
            )}
        </div>
    );
};

export default TicketsList;