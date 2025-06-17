// confirmation.js
import { supabase } from './supabase.js';

const bookingDetailsEl = document.getElementById('booking-details');

// Get the booking ID from the URL
const urlParams = new URLSearchParams(window.location.search);
const bookingId = urlParams.get('bookingId');

function formatDateTime(isoString) {
    const date = new Date(isoString);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('en-US', options);
}

async function loadBookingDetails() {
    if (!bookingId) {
        bookingDetailsEl.innerHTML = '<p>No booking ID provided.</p>';
        return;
    }

    // Fetch the booking and include the room details using a join
    const { data, error } = await supabase
        .from('bookings')
        .select(`
            *,
            rooms (name, location)
        `)
        .eq('id', bookingId)
        .single();

    if (error || !data) {
        bookingDetailsEl.innerHTML = '<p>Could not retrieve booking details.</p>';
        console.error('Error fetching booking details:', error);
        return;
    }

    // Display the details on the page
    bookingDetailsEl.innerHTML = `
        <p><strong>Room:</strong> ${data.rooms.name}</p>
        <p><strong>Location:</strong> ${data.rooms.location}</p>
        <p><strong>Booked by:</strong> ${data.user_name}</p>
        <p><strong>Activity:</strong> ${data.activity}</p>
        <p><strong>Type:</strong> ${data.booking_type}</p>
        <p><strong>From:</strong> ${formatDateTime(data.start_time)}</p>
        <p><strong>To:</strong> ${formatDateTime(data.end_time)}</p>
    `;
}

loadBookingDetails();
