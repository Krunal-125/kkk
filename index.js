const express = require('express');
const { Server: Index } = require('socket.io');
const port = process.env.PORT || 8000;
const app = express();
const http = require('http');

const server = http.createServer(app);
app.use(express.static('build'));
const io = new Index(server);

const json = require('./backend.json');

app.use(express.static('build'));

const intents = json.intents;

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

let intent = "initial";
let mobile_number = '';
let first_name = '';
let last_name = '';
let passport_number = '';
let email_id = '';
let destination = '';
let city = '';
let check_in_date = '';
let check_out_date = '';
let total_adults = '';
let room_type = '';
let breakfast_dinner = '';
let parking_space = '';
let taxi_service = '';
let payment_option = '';
let card_number = '';
let card_expiry = '';
let mistakeCount = 0;

io.on('connection', (socket) => {
  console.log('connected');

  let restartRequested = false;

  socket.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error);
  });

  socket.on('human', (data) => {
    const input = data.toLowerCase();
    console.log(data);

    if (input.includes('restart')) {
      restartRequested = true;
    }

    if (restartRequested) {
      resetVariables(socket, input);
      processStartIntent(socket, input);
      restartRequested = false;
      return;
    }

    if (intent === 'initial') {
      if (input === 'hi') {
        processStartIntent(socket, input);
      } else {
        socket.emit('botmes', 'Please type "hi" to start the conversation.');
      }
      return;
    }

    switch (intent) {
      case 'start':
        processStartIntent(socket, input);
        break;
      case 'mobile-number':
        validateMobileNumber(socket, input);
        break;
      case 'first-name':
        validateFirstName(socket, input);
        break;
      case 'last-name':
        validateLastName(socket, input);
        break;
      case 'passport-number':
        validatePassportNumber(socket, input);
        break;
      case 'email-id':
        validateEmail(socket, input);
        break;
      case 'help':
        helpOptions(socket, input);
        break;
      case 'destination':
        selectDestination(socket, input);
        break;
      case 'city':
        selectCity(socket, input);
        break;
      case 'check-in-date':
        selectCheckInDate(socket, input);
        break;
      case 'check-out-date':
        selectCheckOutDate(socket, input);
        break;
      case 'total-adults':
        selectTotalAdults(socket, input);
        break;
      case 'room-type':
        selectRoomType(socket, input);
        break;
      case 'breakfast-dinner':
        addBreakfastDinner(socket, input);
        break;
      case 'parking-space':
        addParkingSpace(socket, input);
        break;
      case 'taxi-service':
        addTaxiService(socket, input);
        break;
      case 'confirmation':
        confirmDetails(socket, input);
        break;
      case 'payment-option':
        selectPaymentOption(socket, input);
        break;
      case 'payment-method':
        selectPaymentMethod(socket, input);
        break;
      case 'card-number':
        getCardNumber(socket, input);
        break;
      case 'card-expiry':
        getCardExpiry(socket, input);
        break;
      case 'restart':
        if (input === 'yes') {
          resetVariables(socket, input);
          processStartIntent(socket, input);
        } else {
          fallback(socket);
        }
        break;
      default:
        fallback(socket);
    }
  });
});

function processStartIntent(socket, input) {
  socket.emit('botmes', 'Before you proceed, can you please share your Mobile Number? (Format: 015566XXXXX)');
  intent = 'mobile-number';
}

function validateMobileNumber(socket, input) {
  const numberRegex = /\d+/g;
  const numbers = input.match(numberRegex);

  if (!numbers || numbers.length === 0 || numbers[0].length < 11) {
    socket.emit('botmes', 'Please enter a valid 11 digit mobile number (eg: 015566468102).');
    handleIncorrectAttempt(socket);
    return;
  }
  mobile_number = numbers[0];
  socket.emit('botmes', 'May I know your First name, please?');
  intent = 'first-name';
}

function validateFirstName(socket, input) {
  const nameRegex = /^[a-zA-Z\s]+$/;

  if (!nameRegex.test(input)) {
    socket.emit('botmes', 'Please enter a valid first name (only letters and spaces allowed).');
    handleIncorrectAttempt(socket);
    return;
  }

  first_name = input.trim();
  socket.emit('botmes', 'May I know your Last name, please?');
  intent = 'last-name';
}

function validateLastName(socket, input) {
  const nameRegex = /^[a-zA-Z\s]+$/;

  if (!nameRegex.test(input)) {
    socket.emit('botmes', 'Please enter a valid last name (only letters and spaces allowed).');
    handleIncorrectAttempt(socket);
    return;
  }

  last_name = input.trim();
  socket.emit('botmes', 'Please, enter a valid Passport number?');
  intent = 'passport-number';
}

function validatePassportNumber(socket, input) {
  const passportRegex = /^[A-Za-z][0-9]{7}$/;

  const trimmedInput = input.trim();
  if (!passportRegex.test(trimmedInput)) {
    socket.emit('botmes', 'Please enter a valid passport number (first character must be a letter and the remaining seven should be numbers).');
    handleIncorrectAttempt(socket);
    return;
  }

  passport_number = trimmedInput.toUpperCase();
  socket.emit('botmes', 'Lastly, please share your E-mail address.');
  intent = 'email-id';
}

function validateEmail(socket, input) {
  const emailRegex = /\S+@\S+\.\S+/;

  if (!emailRegex.test(input)) {
    socket.emit('botmes', 'Please enter a valid email address (eg: hoelgalaxy@example.com).');
    handleIncorrectAttempt(socket);
    return;
  }
  email_id = input;
  socket.emit('botmes', 'Hello, how may I help you today? (room book / cancel book)');
  intent = 'help';
}

function helpOptions(socket, input) {
  if (input.includes('room book')) {
    socket.emit('botmes', 'Where would you like to travel? Please type hotel or destination name. Example: (USA/Europe/Asia)');
    intent = 'destination';
  } else if (input.includes('cancel book')) {
    socket.emit('botmes', 'Please provide your booking reference number to cancel your booking.');
  } else {
    fallback(socket);
  }
}

function selectDestination(socket, input) {
  const validDestinations = {
    usa: ['new york', 'los angeles', 'chicago', 'houston'],
    europe: ['berlin', 'münchen', 'rome', 'paris'],
    asia: ['mumbai', 'hong kong', 'tokyo', 'surat']
  };

  destination = input.trim().toLowerCase();

  if (validDestinations[destination]) {
    socket.emit('botmes', `In which city would you like to travel? Please choose from the following options: ${validDestinations[destination].join(' · ')}`);
    intent = 'city';
  } else {
    socket.emit('botmes', 'Please select a valid destination: USA, Europe, or Asia.');
    handleIncorrectAttempt(socket);
  }
}

function selectCity(socket, input) {
  const validCities = {
    usa: ['new york', 'los angeles', 'chicago', 'houston'],
    europe: ['berlin', 'münchen', 'rome', 'paris'],
    asia: ['mumbai', 'hong kong', 'tokyo', 'surat']
  };

  city = input.trim().toLowerCase();

  if (validCities[destination] && validCities[destination].includes(city)) {
    socket.emit('botmes', 'Please select your Check in date? (Format: YYYY-MM-DD)');
    intent = 'check-in-date';
  } else {
    socket.emit('botmes', `Please select a valid city from the following options: ${validCities[destination].join(' · ')}`);
    handleIncorrectAttempt(socket);
  }
}

function selectCheckInDate(socket, input) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (!dateRegex.test(input)) {
    socket.emit('botmes', 'Please enter a valid check-in date in the format YYYY-MM-DD.');
    handleIncorrectAttempt(socket);
    return;
  }

  check_in_date = input;
  socket.emit('botmes', 'Please select your Check out date? (Format: YYYY-MM-DD)');
  intent = 'check-out-date';
}

function selectCheckOutDate(socket, input) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (!dateRegex.test(input)) {
    socket.emit('botmes', 'Please enter a valid check-out date in the format YYYY-MM-DD.');
    handleIncorrectAttempt(socket);
    return;
  }

  check_out_date = input;
  socket.emit('botmes', 'Please enter the total number of adults traveling (maximum 4 adults).');
  intent = 'total-adults';
}

function selectTotalAdults(socket, input) {
  total_adults = parseInt(input);

  if (isNaN(total_adults) || total_adults > 4) {
    socket.emit('botmes', 'Enter the total number of adults traveling (maximum 4 adults).');
    handleIncorrectAttempt(socket);
    return;
  }

  socket.emit('botmes', 'We have found these rooms for you: \n1. Deluxe Room Twin Bed for 180 €\n2. Deluxe Room City View King Bed for 220 €\n3. Deluxe Room Mangrove View Twin Bed for 250 €\n Please select a room type by typing the corresponding number.');
  intent = 'room-type';
}

function selectRoomType(socket, input) {
  const rooms = {
    '1': 'Deluxe Room Twin Bed -  180 € per night',
    '2': 'Deluxe Room City View King Bed - 220 € per night',
    '3': 'Deluxe Room Mangrove View Twin Bed - 250 € per night'
  };

  room_type = rooms[input.trim()];

  if (room_type) {
    socket.emit('botmes', 'Would you like to add breakfast/dinner? (No additional charges for that.)');
    intent = 'breakfast-dinner';
  } else {
    socket.emit('botmes', 'Please select a valid room type by typing 1, 2, or 3.');
    handleIncorrectAttempt(socket);
  }
}

function addBreakfastDinner(socket, input) {
  if (input.toLowerCase() === 'yes' || input.toLowerCase() === 'no') {
    breakfast_dinner = input.toLowerCase();
    socket.emit('botmes', 'Would you like to add parking space?');
    intent = 'parking-space';
  } else {
    socket.emit('botmes', 'Please respond with "yes" or "no".');
    handleIncorrectAttempt(socket);
  }
}

function addParkingSpace(socket, input) {
  if (input.toLowerCase() === 'yes' || input.toLowerCase() === 'no') {
    parking_space = input.toLowerCase();
    if (parking_space === 'yes') {
      socket.emit('botmes', 'Thank you for sharing the details. Would you like to confirm your booking? (yes/no)');
      intent = 'confirmation';
    } else {
      socket.emit('botmes', 'Would you like a taxi service?');
      intent = 'taxi-service';
    }
  } else {
    socket.emit('botmes', 'Please respond with "yes" or "no".');
    handleIncorrectAttempt(socket);
  }
}

function addTaxiService(socket, input) {
  if (input.toLowerCase() === 'yes' || input.toLowerCase() === 'no') {
    taxi_service = input.toLowerCase();
    socket.emit('botmes', 'Thank you for sharing the details. Would you like to confirm your booking? (yes/no)');
    intent = 'confirmation';
  } else {
    socket.emit('botmes', 'Please respond with "yes" or "no".');
    handleIncorrectAttempt(socket);
  }
}

function confirmDetails(socket, input) {
  if (input.toLowerCase() === 'yes') {
    socket.emit('botmes', `Your booking details are as follows:\nMobile Number: ${mobile_number}\nFirst Name: ${first_name}\nLast Name: ${last_name}\nPassport Number: ${passport_number}\nEmail: ${email_id}\nDestination: ${destination}\nCity: ${city}\nCheck-in Date: ${check_in_date}\nCheck-out Date: ${check_out_date}\nTotal Adults: ${total_adults}\nRoom Type: ${room_type}\nBreakfast/Dinner: ${breakfast_dinner}\nParking Space: ${parking_space}\nTaxi Service: ${taxi_service}\nDo you want to proceed with the payment? (yes/no)`);
    intent = 'payment-option';
  } else {
    socket.emit('botmes', 'Your booking has been cancelled.');
    resetVariables(socket, input);
  }
}

function selectPaymentOption(socket, input) {
  if (input.toLowerCase() === 'yes') {
    socket.emit('botmes', 'Please select the payment option:\n1. Credit Card\n2. Debit Card\n3. Pay at Hotel');
    intent = 'payment-method';
  } else {
    socket.emit('botmes', 'Your booking has been cancelled.');
    resetVariables(socket, input);
  }
}

function selectPaymentMethod(socket, input) {
  if (input.trim() === '1' || input.trim() === '2') {
    payment_option = input.trim() === '1' ? 'Credit Card' : 'Debit Card';
    socket.emit('botmes', `Please enter your ${payment_option} number:`);
    intent = 'card-number';
  } else if (input.trim() === '3') {
    payment_option = 'Pay at Hotel';
    socket.emit('botmes', 'Thank you! Your booking is confirmed and you can pay at the hotel.');
    resetVariables(socket, input);
  } else {
    socket.emit('botmes', 'Please select a valid payment option by typing 1, 2, or 3.');
    handleIncorrectAttempt(socket);
  }
}

function getCardNumber(socket, input) {
  const cardNumberRegex = /^\d{16}$/;
  if (cardNumberRegex.test(input.trim())) {
    card_number = input.trim();
    socket.emit('botmes', 'Please enter the card expiry date (MM/YY):');
    intent = 'card-expiry';
  } else {
    socket.emit('botmes', 'Please enter a valid 16-digit card number.');
    handleIncorrectAttempt(socket);
  }
}

function getCardExpiry(socket, input) {
  const cardExpiryRegex = /^(0[1-9]|1[0-2])\/?([0-9]{2})$/;
  if (cardExpiryRegex.test(input.trim())) {
    card_expiry = input.trim();
    socket.emit('botmes', 'Thank you so much for providing the payment details. Your booking is now confirmed.');
    resetVariables(socket, input);
  } else {
    socket.emit('botmes', 'Please enter a valid expiry date (MM/YY).');
    handleIncorrectAttempt(socket);
  }
}

function fallback(socket) {
  socket.emit('botmes', 'I am sorry, I did not understand that. Can you please rephrase?');
  handleIncorrectAttempt(socket);
}

function handleIncorrectAttempt(socket) {
  mistakeCount++;
  if (mistakeCount >= 3) {
    socket.emit('botmes', 'It seems like there are some issues with the provided information. Would you like to restart the conversation? (yes/no)');
    intent = 'restart';
    mistakeCount = 0;
  }
}

function resetVariables(socket, input) {
  mobile_number = '';
  first_name = '';
  last_name = '';
  passport_number = '';
  email_id = '';
  destination = '';
  city = '';
  check_in_date = '';
  check_out_date = '';
  total_adults = '';
  room_type = '';
  breakfast_dinner = '';
  parking_space = '';
  taxi_service = '';
  payment_option = '';
  card_number = '';
  card_expiry = '';
  mistakeCount = 0;
  intent = 'initial';
}

module.exports = app;
