import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import RaiseTicket from './components/RaiseTicket';
import TicketsList from './components/TicketList';
import ticketImage from '/Ticket.svg';

const App = () => {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load tickets from local storage or tickets.json on mount
  useEffect(() => {
    const loadTickets = async () => {
      setIsLoading(true);
      const loader = document.querySelector('.loader');
      if (loader) loader.classList.remove('loader-hidden');

      try {
        const storedTickets = localStorage.getItem('tickets');
        if (storedTickets) {
          setTickets(JSON.parse(storedTickets));
        } else {
          const response = await fetch('/tickets.json');
          const data = await response.json();
          setTickets(data.tickets);
          localStorage.setItem('tickets', JSON.stringify(data.tickets));
        }
      } catch (error) {
        console.error('Error loading tickets:', error);
      }

      setIsLoading(false);
      if (loader) loader.classList.add('loader-hidden');
    };

    loadTickets();
  }, []);

  const handleAddTicket = (newTicket) => {
    const updatedTickets = [...tickets, { ...newTicket, id: tickets.length ? Math.max(...tickets.map((t) => t.id)) + 1 : 1 }];
    setTickets(updatedTickets);
    localStorage.setItem('tickets', JSON.stringify(updatedTickets));
  };

  const handleRefresh = () => {
    const loadTickets = async () => {
      setIsLoading(true);
      const loader = document.querySelector('.loader');
      if (loader) loader.classList.remove('loader-hidden');

      try {
        const response = await fetch('/tickets.json');
        const data = await response.json();
        setTickets(data.tickets);
        localStorage.setItem('tickets', JSON.stringify(data.tickets));
      } catch (error) {
        console.error('Error refreshing tickets:', error);
      }

      setIsLoading(false);
      if (loader) loader.classList.add('loader-hidden');
    };
    loadTickets();
  };

  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="logo">
            <img src={ticketImage} alt="token" />
            <h1>TATUA</h1>
          </div>
          <div className="nav-links">
            <Link to="/" className={location.pathname === "/" ? "active-link" : ""}>Raise Ticket</Link>
            <Link to="/tickets" className={location.pathname === "/tickets" ? "active-link" : ""}>Tickets List</Link>
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<RaiseTicket onAddTicket={handleAddTicket} />} />
          <Route
            path="/tickets"
            element={
              <TicketsList
                tickets={tickets}
                setTickets={setTickets}
                onRefresh={handleRefresh}
              />
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
