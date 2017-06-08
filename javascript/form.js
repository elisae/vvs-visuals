document.addEventListener("DOMContentLoaded", function() {
  document.getElementById("startDateField").value = "2017-05-21";
  document.getElementById("endDateField").value = "2017-05-21";
  document.getElementById("startHoursField").value = "14:00";
  document.getElementById("endHoursField").value = "15:00";
});

function toTimestamp(dateString, hourString) {
  var date = new Date(dateString + "T" + hourString + ":00+02:00");
  return date.getTime();
}

function update() {
  console.log("update()");
  var startTime = toTimestamp(
    document.getElementById("startDateField").value,
    document.getElementById("startHoursField").value);
  var endTime = toTimestamp(
    document.getElementById("endDateField").value,
    document.getElementById("endHoursField").value);

  updateSVG(startTime, endTime);
}
