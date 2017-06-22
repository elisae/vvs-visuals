document.addEventListener("DOMContentLoaded", function() {
  var now = new Date();
  // default: show data from the last two hours
  document.getElementById("endDateField").value = toInputTypeDate(now);
  document.getElementById("endHoursField").value = now.getHours() + ":" + now.getMinutes();
  now.setHours(now.getHours() - 4);
  document.getElementById("startDateField").value = toInputTypeDate(now);
  document.getElementById("startHoursField").value = now.getHours() + ":" + now.getMinutes();
});

function toInputTypeDate(dateObject) {
  var month = dateObject.getMonth() + 1;
  var string = dateObject.getFullYear() + "-"
    + (month < 10 ? "0" : "") + month.toString()
    + "-" + dateObject.getDate();
  return string;
}

function toTimestamp(dateString, hourString) {
  var date = new Date(dateString + "T" + hourString + ":00+02:00");
  return date.getTime();
}

function update() {
  var startTime = toTimestamp(
    document.getElementById("startDateField").value,
    document.getElementById("startHoursField").value);
  var endTime = toTimestamp(
    document.getElementById("endDateField").value,
    document.getElementById("endHoursField").value);

  updateSVG(startTime, endTime);
}
