import React from 'react';
import TicketForm from './TicketForm';

const RaiseTicket = ({ onAddTicket }) => {
  return (
    <div className="container">
      <h1>Raise Ticket</h1>
      <TicketForm onSubmit={onAddTicket} />
    </div>
  );
};

export default RaiseTicket;