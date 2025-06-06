function openPopup() {
        document.getElementById('popup').style.display = 'flex';
}

function closePopup() {
    document.getElementById('popup').style.display = 'none';
    const popupContent = document.getElementById('popup-main-content');
    popupContent.innerHTML = '';
}

function sendCommand(cmd) {
    const loader = document.getElementById('loader');
    const responseBox = document.getElementById('responseBox');
    const buttons = document.querySelectorAll('.btn');

    // Show loader and disable buttons
    loader.style.display = 'block';
    responseBox.textContent = '⏳ Please wait...';
    buttons.forEach(btn => btn.disabled = true);

    fetch(`/api/${cmd}`)
    .then(res => res.json())
    .then(data => {
        if(cmd === 'ping') {
            if(data.status === 'success') {
                const popupContent = document.getElementById('popup-main-content');
                
                const table = document.createElement('table');
                table.style.width = '100%';
                table.style.borderCollapse = 'collapse';
                table.style.marginTop = '10px';

                const headerRow = document.createElement('tr');
                const headers = ['Key', 'Value'];
                headers.forEach(header => {
                    const th = document.createElement('th');
                    th.textContent = header;
                    th.style.border = '1px solid #ddd';
                    th.style.padding = '8px';
                    th.style.textAlign = 'left';
                    headerRow.appendChild(th);
                });

                table.appendChild(headerRow);

                Object.entries(data.data).forEach(([key, value]) => {
                    const row = document.createElement('tr');
                    const keyCell = document.createElement('td');
                    keyCell.textContent = key;
                    keyCell.style.border = '1px solid #ddd';
                    keyCell.style.padding = '8px';
                    row.appendChild(keyCell);

                    const valueCell = document.createElement('td');
                    valueCell.textContent = value;
                    valueCell.style.border = '1px solid #ddd';
                    valueCell.style.padding = '8px';
                    row.appendChild(valueCell);

                    table.appendChild(row);
                });

                popupContent.appendChild(table);

                openPopup();

                responseBox.textContent = '✅ Ping successful! Check the popup for details.';

            }else{
                responseBox.textContent = '⚠️ Error: ' + data.message;
            }

        }else if (cmd === 'connect'){
            const popupContent = document.getElementById('popup-main-content');
            if (data.status === 'success'){
                popupContent.textContent = '✅ Connection Requested successfully!';
            }else{
                popupContent.textContent = '⚠️ Error: ' + data.message;
            }
            responseBox.textContent = popupContent.textContent;
            openPopup();
            
        }else if(cmd === 'disconnect'){
            const popupContent = document.getElementById('popup-main-content');
            if (data.status === 'success'){
                popupContent.textContent = '✅ Disconnection Requested successfully!';
            }else{
                popupContent.textContent = '⚠️ Error: ' + data.message;
            }
            responseBox.textContent = popupContent.textContent;
            openPopup();

        }else{
            responseBox.textContent = JSON.stringify(data, null, 2);
        }
        
    })
    .catch(err => {
        responseBox.textContent = '⚠️ Error: ' + err;
    })
    .finally(() => {
        loader.style.display = 'none';
        buttons.forEach(btn => btn.disabled = false);
    });
}

function checkConnectionStatus() {
    const statusContainer = document.getElementById('connection-status');
    const statusElement = document.getElementById('cstatus');
    fetch('/api/status')
        .then(res => res.json())
        .then(data => {
            if (data.status === 'connected') {
                statusElement.textContent = 'Connected';
                statusContainer.classList.remove('danger');
                statusContainer.classList.add('success');
            } else {
                statusElement.textContent = 'Disconnected';
                statusContainer.classList.remove('success');
                statusContainer.classList.add('danger');
            }

            const botConnectedTime = data.connectedTime || 'N/A';
            showTimeSinceConnected(botConnectedTime);
        })
        .catch(err => {
            console.error('Error fetching status:', err);
        });
}
checkConnectionStatus(); // Initial check on load
setInterval(checkConnectionStatus, 3000); // Check every 3 seconds

function showTimeSinceConnected(connectedTime) {
    const timeWindow = document.querySelector('.time-window');
    const hourElement = document.querySelector('.hour');
    const minuteElement = document.querySelector('.minute');
    const secondElement = document.querySelector('.second');

    if (connectedTime === 'N/A') {
        hourElement.textContent = 'N/A';
        minuteElement.textContent = 'N/A';
        secondElement.textContent = 'N/A';
        return;
    }

    const connectedDate = new Date(connectedTime);
    const now = new Date();
    const diffInSeconds = Math.floor((now - connectedDate) / 1000);

    const hours = Math.floor(diffInSeconds / 3600);
    const minutes = Math.floor((diffInSeconds % 3600) / 60);
    const seconds = diffInSeconds % 60;

    hourElement.textContent = hours.toString().padStart(2, '0');
    minuteElement.textContent = minutes.toString().padStart(2, '0');
    secondElement.textContent = seconds.toString().padStart(2, '0');
}

function autoUpdateTime(){
    const timeWindow = document.querySelector('.time-window');
    const hourElement = document.querySelector('.hour');
    const minuteElement = document.querySelector('.minute');
    const secondElement = document.querySelector('.second');

    if (hourElement.textContent === 'N/A' || minuteElement.textContent === 'N/A' || secondElement.textContent === 'N/A') {
        return; // Do not update if time is not available
    }

    const chour = hourElement.textContent;
    const cminute = minuteElement.textContent;
    const csecond = secondElement.textContent;

    let hour = parseInt(chour, 10);
    let minute = parseInt(cminute, 10);
    let second = parseInt(csecond, 10);

    // Increase 1 second and update the whole minute, hour, second
    second++;
    if (second >= 60) {
        second = 0;
        minute++;
        if (minute >= 60) {
            minute = 0;
            hour++;
        }
    }

    hourElement.textContent = hour.toString().padStart(2, '0');
    minuteElement.textContent = minute.toString().padStart(2, '0');
    secondElement.textContent = second.toString().padStart(2, '0');
}
setInterval(autoUpdateTime, 1000); // Update every second