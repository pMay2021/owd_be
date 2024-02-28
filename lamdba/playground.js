const json = {
    "id": {
        "S": "travel#passport#us"
    },
    "state": {
        "S": "na"
    },
    "documentName": {
        "S": "Passport"
    },
    "importance": {
        "S": "critical"
    },
    "category": {
        "S": "Travel Documents"
    },
    "description": {
        "S": "Official document for international travel requiring periodic renewal"
    },
    "countryFlag": {
        "S": "🇺🇸"
    },
    "renewalIntervalYears": {
        "L": [
            {
                "N": "5"
            },
            {
                "N": "10"
            }
        ]
    },
    "referenceURL": {
        "S": "https://travel.state.gov/content/travel/en/passports.html"
    },
    "processingTime": {
        "S": "4-6 weeks"
    },
    "reminderOffsetDays": {
        "L": [
            {
                "N": "0"
            },
            {
                "N": "30"
            },
            {
                "N": "60"
            },
            {
                "N": "180"
            }
        ]
    },
    "relatedIds": {
        "L": [
            {
                "S": "travel#visa"
            },
            {
                "S": "immigration#I-140"
            }
        ]
    },
    "notes": {
        "S": ""
    }
}

let m = json.reminderOffsetDays.L.map(x => x.N);
console.log(m);
console.log(`offsetArray: ${m.flat()}`); // Output: Array of new date strings
console.log(["2020-10-14","2024-09-22"].flat(","));

let n = calculateDates("2030-10-08", ["0","180","270", "360"]);
console.log(n);

function getDayOfWeek(dateString) {
    // Validate input data
    if (!dateString) {
      throw new Error("Invalid input: dateString is required");
    }
  
    // Parse the date string
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date format");
    }
  
    // Get the day of the week index (0-6, where 0 is Sunday)
    const dayOfWeekIndex = date.getDay();
  
    // Convert the index to a day name using an array
    const daysOfWeek = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
    return daysOfWeek[dayOfWeekIndex];
  }

function calculateDates(expiryDate, daysList) {
    // Validate input data (same as your original code)
    console.log(`function calculateDates: expiryDate: ${expiryDate} and offsets: ${JSON.stringify(daysList)}`);
    if (!expiryDate || !Array.isArray(daysList)) {
      throw new Error("Invalid input data: expiryDate or daysList");
    }
  
    // Parse expiry date to a Date object (same as your original code)
    const parsedDate = new Date(expiryDate);
    if (isNaN(parsedDate.getTime())) {
      throw new Error("Invalid expiry date format");
    }
  
    // Calculate new dates for each day in the list
    const newDates = daysList.map(days => {
      const newDate = new Date(parsedDate.getTime());
      newDate.setDate(newDate.getDate() - days);
  
      // Get day of the week in words (using the previous function)
      const dayOfWeek = getDayOfWeek(newDate.toISOString()); // Pass date as ISO string
  
      return {
        date: newDate.toISOString().slice(0, 10), // Format as YYYY-MM-dd
        dayOfWeek: dayOfWeek,
        offsetNumber: days
      };
    });
  
    return newDates;
  }