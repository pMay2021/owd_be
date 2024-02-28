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