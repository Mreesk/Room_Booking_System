// app.js
import { supabase } from './supabase.js';

const times = [
  '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00'
];

const roomList = document.getElementById('rooms');
const message = document.getElementById('message');
const datePicker = document.getElementById('date-picker');

// Set default date to today and listen for changes
datePicker.valueAsDate = new Date();
datePicker.addEventListener('change', fetchRoomsAndBookings);

// Convert 'HH:mm' and a date to a full timestamp
function toTimestamp(dateStr, timeStr) {
  return `${dateStr}T${timeStr}:00`;
}

// This function adds listeners to the 'Book this room' buttons
function addBookingListeners() {
  document.querySelectorAll('.book-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const card = e.target.closest('.room-card');

      const roomId = e.target.getAttribute('data-id');
      const userName = card.querySelector('.user-name').value;
      const activity = card.querySelector('.activity').value;
      const bookingType = card.querySelector(`input[name="booking-type-${roomId}"]:checked`).value;
      const startTime = card.querySelector('.start-time').value;
      const endTime = card.querySelector('.end-time').value;
      const selectedDate = datePicker.value;
      
      if (!userName || !activity) {
        alert('Please enter your name and the activity.');
        return;
      }
      if (startTime >= endTime) {
        alert('End time must be after start time.');
        return;
      }
      
      const bookingStart = toTimestamp(selectedDate, startTime);
      const bookingEnd = toTimestamp(selectedDate, endTime);

      const { data: conflictingBookings, error: conflictError } = await supabase
        .from('bookings')
        .select('id, booking_type')
        .eq('room_id', roomId)
        .lt('start_time', bookingEnd)
        .gt('end_time', bookingStart);

      if (conflictError) {
        alert('Error: Could not check for booking conflicts. Please try again.');
        return;
      }

      if (bookingType === 'private' && conflictingBookings.length > 0) {
        alert('This time slot is unavailable for a private booking. Please try booking as shared or choose another time.');
        return;
      }

      if (bookingType === 'shared') {
          const hasPrivateConflict = conflictingBookings.some(b => b.booking_type === 'private');
          if (hasPrivateConflict) {
            alert('A private booking already exists in this time slot. Please choose another time.');
            return;
          }
      }

      // Insert the booking AND select the data that was just inserted
      const { data: newBooking, error: insertError } = await supabase
        .from('bookings')
        .insert([{
          room_id: roomId,
          start_time: bookingStart,
          end_time: bookingEnd,
          user_name: userName,
          activity: activity,
          booking_type: bookingType
        }])
        .select()
        .single(); // .select().single() gets the new row back

      if (insertError) {
        alert('Booking failed: ' + insertError.message);
      } else {
        // --- REDIRECT TO CONFIRMATION PAGE ON SUCCESS ---
        window.location.href = `confirmation.html?bookingId=${newBooking.id}`;
      }
    });
  });
}

async function fetchRoomsAndBookings() {
  const selectedDate = datePicker.value;
  if (!selectedDate) {
    roomList.innerHTML = 'Please select a date.';
    return;
  }

  roomList.innerHTML = 'Loading...';
  message.textContent = '';

  const { data: rooms, error: roomsError } = await supabase.from('rooms').select('*');

  if (roomsError || !rooms) {
    console.error('Error loading rooms:', roomsError);
    roomList.innerHTML = '<p>Error loading rooms.</p>';
    return;
  }

  roomList.innerHTML = '';

  rooms.forEach(room => {
    const card = document.createElement('div');
    card.className = 'room-card';
    card.innerHTML = `
      <div class="room-info">
        <h2>${room.name}</h2>
        <p>📍 <strong>Location:</strong> ${room.location || 'N/A'}</p>
        <p>👥 <strong>Capacity:</strong> ${room.capacity || 'N/A'}</p>
        <p>💻 <strong>Features:</strong> ${room.features || 'N/A'}</p>
      </div>

      <div class="booking-form">
        <div class="input-group">
          <label>Your Name:</label>
          <input type="text" class="user-name" placeholder="Enter your name">
        </div>

        <div class="input-group">
            <label>Activity:</label>
            <input type="text" class="activity" placeholder="e.g., Team Meeting, Quiet Study">
        </div>

        <div class="input-group">
          <label>Booking Type:</label>
          <div class="radio-group">
              <input type="radio" id="private-${room.id}" name="booking-type-${room.id}" value="private" checked>
              <label for="private-${room.id}">Private</label>
              <input type="radio" id="shared-${room.id}" name="booking-type-${room.id}" value="shared">
              <label for="shared-${room.id}">Shared</label>
          </div>
        </div>
        
        <div class="time-picker-group">
            <div class="time-picker">
                <label>From</label>
                <select class="start-time">
                    ${times.map(time => `<option value="${time}">${time}</option>`).join('')}
                </select>
            </div>
            <div class="time-picker">
                <label>To</label>
                <select class="end-time">
                    ${times.map(time => `<option value="${time}">${time}</option>`).join('')}
                </select>
            </div>
        </div>
        <button class="book-btn" data-id="${room.id}">Book this room</button>
      </div>
    `;
    roomList.appendChild(card);
  });
  
  // After creating the room cards, call the function to attach event listeners.
  addBookingListeners();
}

// Initial load
fetchRoomsAndBookings();
