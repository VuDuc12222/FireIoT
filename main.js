var options = {
  username: 'DucVu',
  password: 'Duc12345678'
}

// initialize the MQTT client
var client = mqtt.connect("wss://fdfe39a4bdb2408d9bbcc0c8cb220535.s1.eu.hivemq.cloud:8884/mqtt", options);

// setup the callbacks
client.on('connect', function () {
  console.log('Connected');
});

client.on('error', function (error) {
  console.log(error);
});

client.on('message', function (topic, message) {
  // called each time a message is received
  console.log('Received message:', topic, message.toString());
});

client.subscribe('RealtimeNotice');
var dps = []; // dataPoints
var yVal;
var timeMode = 0;
var timeOnLedBell = 10000;
var timeOffLedBell = 20000;
var setTimeOutLedBell = timeOffLedBell;

window.onload = function () {

  var chart = new CanvasJS.Chart("chartContainer", {
    title: {
      text: "Temperature Data"
    },
    data: [{
      type: "line",
      dataPoints: dps
    }]
  });

  var xVal = 0;
  var yVal = 30;
  var updateInterval = 1000;
  var dataLength = 20; // number of dataPoints visible at any point

  var updateChart = function (count) {
    count = count || 1;

    for (var j = 0; j < count; j++) {
      dps.push({
        x: xVal,
        y: yVal
      });
      xVal++;
    }

    if (dps.length > dataLength) {
      dps.shift();
    }

    chart.render();
    const checkboxMode = document.getElementById('ModeToggleCheckbox');
    const Notice = document.getElementById('Notice');
    if (checkboxMode.checked) {
      if (dps.length > 0 && dps[dps.length - 1].y > 50) {
        Notice.textContent = 'Nhiệt Độ Cao';
        if (checkLed() || checkBell()) {
          if (setTimeOutLedBell > 0) {
            setTimeOutLedBell = setTimeOutLedBell - updateInterval;
          } else {
            setButton(false);
            setTimeOutLedBell = timeOffLedBell - updateInterval;
          }
        } else {
          if (setTimeOutLedBell == timeOffLedBell) {
            setButton(true);
            setTimeOutLedBell = setTimeOutLedBell - updateInterval;
          }
          if (setTimeOutLedBell > 0) {
            setTimeOutLedBell = setTimeOutLedBell - updateInterval;
          } else {
            setButton(true);
            setTimeOutLedBell = timeOnLedBell;
          }
        }
      } else {
        Notice.textContent = 'Nhiệt Độ Bình Thường';
        setTimeOutLedBell = timeOffLedBell;
        if (checkLed() || checkBell()) {
          setButton(false);
        }
      }
    }
  };

  client.on('message', function (topic, message) {
    if (topic === 'RealtimeNotice') {
      var yValString = message.toString();
      yVal = parseFloat(yValString);
      console.log('Received yVal:', yVal);
      updateChart();
    }
  });

  updateChart(dataLength);
  setInterval(function () {
    updateChart();
    const checkboxMode = document.getElementById('ModeToggleCheckbox');
    if (checkboxMode.checked) {
      timeMode = 0;
    } else {
      if (timeMode <= 8000) {
        timeMode = timeMode + updateInterval;
      } else {
        setTimeMode();
      }
    }
  }, updateInterval);
};

function LedToggleStatus(status) {
  const checkboxLed = document.getElementById('LedToggleCheckbox');
  const statusTextLed = document.getElementById('LedstatusText');

  if (status) {
    checkboxLed.checked = true;
    statusTextLed.textContent = 'LedOn';
    client.publish('LedStatus', 'LedOn');
  } else {
    checkboxLed.checked = false;
    statusTextLed.textContent = 'LedOff';
    client.publish('LedStatus', 'LedOff');
  }
}

function BellToggleStatus(status) {
  const checkboxBell = document.getElementById('BellToggleCheckbox');
  const statusTextBell = document.getElementById('BellstatusText');

  if (status) {
    checkboxBell.checked = true;
    statusTextBell.textContent = 'BellOn';
    client.publish('BellStatus', 'BellOn');
  } else {
    checkboxBell.checked = false;
    statusTextBell.textContent = 'BellOff';
    client.publish('BellStatus', 'BellOff');
  }
}

function checkBell() {
  const checkboxBell = document.getElementById('BellToggleCheckbox');

  return checkboxBell.checked;
}

function checkLed() {
  const checkboxLed = document.getElementById('LedToggleCheckbox');

  return checkboxLed.checked;
}

function ModeToggleStatus() {
  const checkboxMode = document.getElementById('ModeToggleCheckbox');
  const statusTextMode = document.getElementById('ModestatusText');

  if (checkboxMode.checked) {
    checkboxMode.checked = true;
    statusTextMode.textContent = 'Auto';
    client.publish('ModeStatus', 'Auto');
  } else {
    checkboxMode.checked = false;
    statusTextMode.textContent = 'Handmode';
    client.publish('ModeStatus', 'Handmode');
  }
}

function setButton(warning) {
  const checkboxMode = document.getElementById('ModeToggleCheckbox');
  if (checkboxMode.checked) {
    warning ? LedToggleStatus(true) : LedToggleStatus(false);
    warning ? BellToggleStatus(true) : BellToggleStatus(false);
  }
}

function setTimeMode() {
  const checkboxMode = document.getElementById('ModeToggleCheckbox');
  const statusTextMode = document.getElementById('ModestatusText');

  checkboxMode.checked = true;
  statusTextMode.textContent = 'Auto';
  client.publish('ModeStatus', 'Auto');
}