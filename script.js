function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Straal van de planeet Aarde in meters
    const φ1 = toRadians(lat1);
    const φ2 = toRadians(lat2);
    const Δφ = toRadians(lat2 - lat1);
    const Δλ = toRadians(lon2 - lon1);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Afstand
}

function findNearestParkings(userLat, userLon, parkings) {
    parkings.forEach(parking => {
        const parkingLat = parking.geo_point_2d.lat;
        const parkingLon = parking.geo_point_2d.lon;
        const distance = calculateDistance(userLat, userLon, parkingLat, parkingLon);
        parking.distance = distance;
    });

    parkings.sort((a, b) => a.distance - b.distance);
    return parkings.slice(0, 5); // We geven de 5 dichtstbijzijnde parkeerplaatsen terug
}

// ...

function displayParkings(parkings) {
    const parkingList = document.getElementById('parkingList');
    parkingList.innerHTML = ''; // De lijst leegmaken

    document.getElementById('backButton').style.display = 'inline-block'; // De 'Terug' knop tonen

    parkings.forEach(parking => {
        const div = document.createElement('div');
        const coords = `${parking.geo_point_2d.lat}, ${parking.geo_point_2d.lon}`;
        const distanceKm = (parking.distance / 1000).toFixed(2); // Afstand in kilometers
        const capacity = parking.Capaciteit ? parking.Capaciteit : 'Niet beschikbaar';
        const infoText = parking.infotekst ? parking.infotekst : '';
        const parkingUrl = parking.url ? `<a href="${parking.url}" target="_blank">Meer informatie</a>` : '';

        const address = parking.straatnaam + (parking.huisnr ? `, ${parking.huisnr}` : ''); // Controleren op huisnummer

        div.className = 'parking-item';
        div.innerHTML = `
            <h2>${parking.naam}</h2>
            <p>${address}</p>
            <p>Capaciteit: ${capacity}</p>
            <p>${infoText}</p>
            ${parkingUrl}
            <p>Afstand: ${distanceKm} km</p>
            <button onclick="copyToClipboard('${coords}')">Coördinaten kopiëren</button>
            <button onclick="openInGoogleMaps('${coords}')">Open in Google Maps</button>
        `;
        parkingList.appendChild(div);
    });
}

// De rest van de functies blijven ongewijzigd

// ...


function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Coördinaten gekopieerd naar klembord');
    }).catch(err => {
        console.error('Fout tijdens het kopiëren: ', err);
    });
}

function openInGoogleMaps(coords) {
    const url = `https://www.google.com/maps/search/?api=1&query=${coords}`;
    window.open(url, '_blank');
}

document.getElementById('findParking').addEventListener('click', function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const userLat = position.coords.latitude;
            const userLon = position.coords.longitude;

            fetch('https://data.stad.gent/api/v2/catalog/datasets/locaties-openbare-parkings-gent/exports/json')
            .then(response => response.json())
            .then(parkings => {
                const nearestParkings = findNearestParkings(userLat, userLon, parkings);
                displayParkings(nearestParkings);
            })
            .catch(error => {
                console.error('Fout bij het aanvragen van de API:', error);
            });
        }, function(error) {
            console.error('Fout bij ophalen van geolocatie:', error);
        });
    } else {
        alert('Geolocatie wordt niet ondersteund door uw browser');
    }
});

document.getElementById('backButton').addEventListener('click', function() {
    this.style.display = 'none'; // Verberg de terugknop
    document.getElementById('parkingList').innerHTML = ''; // De lijst met resultaten wissen
});
