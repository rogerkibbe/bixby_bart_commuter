const BART_STATIONS = require("./bart_stations");
const STATIONS = BART_STATIONS.STATIONS;
const NUM_TRIPS = 2;
const TRIP_COUNTER_WORDS = ["first", "second"];  // If increase NUM_TRIPS, add to this

// Public API key - change to your own key for production use.
// See https://www.bart.gov/schedules/developers/api
const BART_API_KEY = "MW9S-E7SL-26DU-VV8V";

module.exports = {
  function: searchForTrains
}

function searchForTrains(searchDepartureStation, searchArrivalStation) {

  var depAbbr = stationNameToAbbr(searchDepartureStation);
  var arrAbbr = stationNameToAbbr(searchArrivalStation);

  var endpoint = "http://api.bart.gov/api/sched.aspx";

  var query = {
    cmd: "depart",
    orig: depAbbr,
    dest: arrAbbr,
    date: "now",
    b: 0,
    json: "y",
    key: BART_API_KEY
  };

  try {
    var response = http.getUrl(endpoint, {
      format: 'json',
      query: query
    });
  }
  catch(err) {
    // Hack solution. Error messages are returned in XML not JSON despite json=y parameter sent
    // Proper solution would be to parse the XML, get the error message and send to the user.
    console.log("Error in BART API call");
    return null;
  }

  // console.log ("response = " + JSON.stringify(response));
  /*if (response.includes("<error>")) {
     console.log("Error ");                    
  }*/

  var trips = [];
  var speak = "The first train from " + searchDepartureStation + " to " + searchArrivalStation + " is the ";

  // Trips
  for (var x = 0; x < response.root.schedule.request.trip.length; x++) {

    var tripResp = response.root.schedule.request.trip[x];
    var tripSteps = [];

    // If 
    if (x > 0) {
      speak += ". The " + TRIP_COUNTER_WORDS[x] + " train is the ";
    }

    // legs
    for (var y = 0; y < tripResp.leg.length; y++) {
      var leg = tripResp.leg[y];
      var headStation = stationAbbrToName(leg['@trainHeadStation']);
      var originTime = leg['@origTimeMin'];
      var destTime =  leg['@destTimeMin']

      // Create speech        
      if (y === 0) {
        speak += originTime + " " + headStation + " train";
      } else {
        speak += ", transfer at " +  stationAbbrToName(leg['@origin']) + " to the " + headStation + " train";
      }
      // If last leg, add destination time
      if (y === (tripResp.leg.length-1)) {
        speak += " which arrives at " + destTime;
      }

      // Create Text
      if (y != 0) {
        tripSteps.push("<--Transfer -->"); // If not start of trip, add transfer indicator
      } 
      tripSteps.push("Depart: " + originTime + " on " + headStation + " train");
      tripSteps.push("Arrive: " + destTime + " at " + stationAbbrToName(leg['@destination']));
    }

    // trip object
    var trip = {
      tripSteps: tripSteps
    }

    // store trips into array
    trips.push(trip);
    tripSteps = [];

    //console.log ("trainJourneys = " + JSON.stringify(trips));

  }

  return {
    searchDepartureStation: searchDepartureStation,
    searchArrivalStation: searchArrivalStation,
    trip: trips,
    speech: speak
  }
}

function stationAbbrToName(abbr) {
  var index = STATIONS.findIndex(p => p.abbr == abbr);
  return STATIONS[index].name;
}

function stationNameToAbbr(name) {
  var index = STATIONS.findIndex(p => p.name == name);
  return STATIONS[index].abbr;
}
