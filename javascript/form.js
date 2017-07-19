document.addEventListener("DOMContentLoaded", function() {
  var now = new Date();
  // default: show data from the last four hours
  document.getElementById("endDateField").value = toInputTypeDate(now);
  document.getElementById("endHoursField").value = toInputTypeTime(now);
  now.setHours(now.getHours() - 4);
  document.getElementById("startDateField").value = toInputTypeDate(now);
  document.getElementById("startHoursField").value = toInputTypeTime(now);
});

function toInputTypeDate(dateObject) {
  var month = dateObject.getMonth() + 1;
  var string = dateObject.getFullYear() + "-"
    + (month < 10 ? "0" : "") + month.toString()
    + "-" + dateObject.getDate();
  return string;
}

function toInputTypeTime(dateObject) {
  var hours = dateObject.getHours();
  var minutes = dateObject.getMinutes();
  var string = (hours < 10 ? "0" : "") + hours.toString()
    + ":" + (minutes < 10 ? "0" : "") + minutes.toString();
  return string;
}

function toTimestamp(dateString, hourString) {
  var date = new Date(dateString + "T" + hourString + ":00+02:00");
  return date.getTime();
}

function getTimeframe() {
  var startTime = toTimestamp(
    document.getElementById("startDateField").value,
    document.getElementById("startHoursField").value);
  var endTime = toTimestamp(
    document.getElementById("endDateField").value,
    document.getElementById("endHoursField").value);

  return {
    startTime: startTime,
    endTime: endTime
  };
}
