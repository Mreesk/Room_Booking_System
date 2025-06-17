import { supabase } from './supabase.js';

const roomNameEl = document.getElementById('room-name');
const userNameInput = document.getElementById('user-name');
const checkinBtn = document.getElementById('checkin-btn');
const messageEl = document.getElementById('message');

// Get the room_id from the URL (e.g., ?room_id=1)
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room_id');

// Function to fetch the room's name and display it
async function displayRoomName() {
  if (!roomId) {
    roomNameEl.textContent = 'Invalid Room';
    return;
  }
  const { data: room, error } = await supabase
    .from('rooms')
    .select('name')
    .eq('id', roomId)
    .single();

  if (room) {
    roomNameEl.textContent = `Check-in for ${room.name}`;
  }
}

async function handleCheckIn() {
  const userName = userNameInput.value.trim();
  if (!userName || !roomId) {
    alert('Please enter your name.');
    return;
  }

  messageEl.textContent = 'Searching for your booking...';
  messageEl.style.color = '#4b5563';

  // Calculate the valid check-in window (from start_time to 15 mins after)
  const now = new Date();
  const checkinWindowStart = now.toISOString();
  // We check for bookings that should have started up to 15 minutes ago
  const checkinWindowEnd = new Date(now.getTime() - 15 * 60 * 1000).toISOString();

  // Find a booking that matches the room, user, and is in the check-in window
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('room_id', roomId)
    .ilike('user_name', userName) // Case-insensitive search for name
    .eq('checked_in', false) // That hasn't been checked in yet
    .lte('start_time', checkinWindowStart) // Booking should have started already
    .gte('start_time', checkinWindowEnd); // But not more than 15 mins ago

  if (error || bookings.length === 0) {
    messageEl.textContent = '❌ No active booking found for this name and room. Please double-check your details and booking time.';
    messageEl.style.color = '#d9534f';
    return;
  }
  
  // If we found a booking, update it to checked_in = true
  const bookingToUpdate = bookings[0];
  const { error: updateError } = await supabase
    .from('bookings')
    .update({ checked_in: true })
    .eq('id', bookingToUpdate.id);

  if (updateError) {
    messageEl.textContent = '❌ There was an error checking you in. Please try again.';
    messageEl.style.color = '#d9534f';
    return;
  }

  messageEl.textContent = '✅ Success! You are now checked in.';
  messageEl.style.color = 'green';
  checkinBtn.disabled = true; // Prevent multiple check-ins
  userNameInput.disabled = true;
}

// Initial setup
displayRoomName();
checkinBtn.addEventListener('click', handleCheckIn);